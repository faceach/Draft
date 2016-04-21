/// <reference path="..\..\..\..\Threshold\src\Content\Script\Declarations\CortanaSearch.d.ts" />
/// <reference path="..\..\..\..\Threshold\src\content\script\declarations\SearchAppWrapper.d.ts" />
var DialogSPALib;
(function (DialogSPALib) {
    // global variables per SPA session
    var g_ttsCounter = 15 /* Max */;
    var g_currentUIState = 0 /* Idle */;
    var g_isSpeechInput = false;
    var g_currentWebviewState = 0 /* AppHidden */;
    var g_currentSpeakOperation = null;
    var g_currentEventHandlers = {};
    var g_cuRequestHeaders;
    var g_spaDialogRuntime = SearchAppWrapper.CortanaApp.spaDialogRuntime;
    // Turn 0 input parameters to be cached
    var trumanEndpoint;
    var turn0CuInput;
    var turn0ImpressionId;
    // Per turn variables
    var t_currentImpressionId;
    var t_currentTurnCount;
    // constants   
    var LOG_DIALOGSPA = "DialogSPA";
    // process client resolution action and send data back to DialogPolicy
    function processResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, impressionId, locale, turnCount, dictationParam, inputQueryType, cuRequestHeaders) {
        // unregister all event handlers from previous turn
        unregisterAllEventHandlers();
        // Initialize module variables
        initGlobals(inputQueryType, impressionId, turnCount, cuRequestHeaders);
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            g_spaDialogRuntime.changeSticStateAndInputMode(1 /* Disabled */, 0 /* Standard */);
        }
        DialogSPALib.logVerboseTrace("SPADialog: processResolutionAction", 0 /* Info */, "g_currentWebviewState: " + g_currentWebviewState + " currenUIState: " + g_currentUIState + " tf id: " + taskFrameId + " impression id: " + t_currentImpressionId, "callbackUrl: " + callBackUrl + ", turnCount: " + turnCount + ", dictationParam: " + dictationParam + ", cuRequestHeaders" + JSON.stringify(cuRequestHeaders));
        if (turnCount == 0) {
            var startSpaDialogEventHandler = function (eventArgs) {
                initializeISpaDialogContextValues(eventArgs);
                updateCortanaUIState(3 /* Thinking */, 9 /* Thinking */);
                ClientResolutionRequested.executeResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, impressionId, locale, turnCount, cuRequestHeaders);
            };
            registerEventHandler("startspadialog", startSpaDialogEventHandler);
        }
        else {
            updateCortanaUIState(3 /* Thinking */, 9 /* Thinking */);
            ClientResolutionRequested.executeResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, impressionId, locale, turnCount, cuRequestHeaders);
        }
    }
    DialogSPALib.processResolutionActions = processResolutionActions;
    // execute final task action
    function executeFinalAction(ssml, emotion, projectedApi, impressionId, inputQueryType, turnCount) {
        // unregister all event handlers from previous turn
        unregisterAllEventHandlers();
        initGlobals(inputQueryType, impressionId, turnCount);
        DialogSPALib.logVerboseTrace("SPADialog: executeFinalAction", 0 /* Info */, "g_currentWebviewState: " + g_currentWebviewState + " g_currentUIState: " + g_currentUIState, "ssml: " + ssml + ", inputQueryType: " + inputQueryType + " projectedApi: " + projectedApi);
        renderSPAUX(emotion);
        var shouldHandoffDialogToCortana = true;
        if (!isStringNullOrEmpty(ssml) && g_isSpeechInput) {
            shouldHandoffDialogToCortana = false;
            updateCortanaUIState(2 /* Speaking */, 0 /* None */);
            g_currentSpeakOperation = g_spaDialogRuntime.speakAsync(ssml, g_ttsCounter++);
            g_currentSpeakOperation.done(function () {
                if (g_spaDialogRuntime.changeSticStateAndInputMode) {
                    g_spaDialogRuntime.changeSticStateAndInputMode(0 /* Enabled */, 0 /* Standard */);
                }
                SearchAppWrapper.CortanaApp.dismissApp();
                g_currentSpeakOperation = null;
            }, function () {
                handoffDialogToCortana(2 /* Error */);
                g_currentSpeakOperation = null;
            });
        }
        if (!isStringNullOrEmpty(projectedApi)) {
            SearchAppWrapper.CortanaApp.processNLCommandAsync(projectedApi, t_currentImpressionId).done(function () {
                if (shouldHandoffDialogToCortana) {
                    handoffDialogToCortana(0 /* RetainUI */);
                }
            }, function () {
                if (shouldHandoffDialogToCortana) {
                    handoffDialogToCortana(2 /* Error */);
                }
            });
        }
        else {
            if (shouldHandoffDialogToCortana) {
                handoffDialogToCortana(0 /* RetainUI */);
            }
        }
    }
    DialogSPALib.executeFinalAction = executeFinalAction;
    // initializes dialog processing and processes intermediate turns
    function processIntermediateTurn(ssml, postssmlAction, emotion, impressionId, dictationParam, inputQueryType, turnCount, cuRequestHeaders) {
        DialogSPALib.logVerboseTrace("SPADialog: processIntermediateTurn", 0 /* Info */, " g_currentUIState: " + g_currentUIState + "g_isSpeechInput: " + g_isSpeechInput, "inputQueryType: " + inputQueryType + ", turnCount: " + t_currentTurnCount + ", postSsmlAction: " + postssmlAction + ", cuRequestHeaders" + JSON.stringify(cuRequestHeaders));
        // unregister all event handlers from previous turn
        unregisterAllEventHandlers();
        initGlobals(inputQueryType, impressionId, turnCount, cuRequestHeaders);
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            g_spaDialogRuntime.changeSticStateAndInputMode(1 /* Disabled */, (g_isSpeechInput) ? 1 /* ListeningOnly */ : 0 /* Standard */);
        }
        try {
            if (!g_isSpeechInput) {
                // for text input, just setup state and exit since the UI controls will determine
                // how to proceed
                if (turnCount == 0) {
                    var startSpaDialogEventHandler = function (eventArgs) {
                        initializeISpaDialogContextValues(eventArgs);
                        updateCortanaUIState(0 /* Idle */, 0 /* None */);
                        renderSPAUX(emotion);
                    };
                    registerEventHandler("startspadialog", startSpaDialogEventHandler);
                }
                else {
                    updateCortanaUIState(0 /* Idle */, 0 /* None */);
                    renderSPAUX(emotion);
                }
                return;
            }
            else {
                var microphoneButtonPressedEventHandler = function (eventArgs) {
                    processMicrophoneButtonPressed(dictationParam);
                };
                registerEventHandler("microphonebuttonpressed", microphoneButtonPressedEventHandler);
                if (turnCount == 0) {
                    var startSpaDialogEventHandler = function (eventArgs) {
                        initializeISpaDialogContextValues(eventArgs);
                        renderSPAUX(emotion);
                        processSsmlAndAction(ssml, postssmlAction, dictationParam);
                    };
                    registerEventHandler("startspadialog", startSpaDialogEventHandler);
                }
                else {
                    renderSPAUX(emotion);
                    processSsmlAndAction(ssml, postssmlAction, dictationParam);
                }
            }
        }
        catch (error) {
            SharedLogHelper.LogError(LOG_DIALOGSPA, "inputQueryType: " + inputQueryType + ", turnCount: " + turnCount + ", postSsmlAction: " + postssmlAction, error);
            DialogSPALib.logVerboseTrace("SPADialog: processIntermediateTurn", 0 /* Info */, "", "Exception: " + error.message + ", inputQueryType: " + inputQueryType + ", turnCount: " + turnCount + ", postSsmlAction: " + postssmlAction);
            handoffDialogToCortana(2 /* Error */);
        }
    }
    DialogSPALib.processIntermediateTurn = processIntermediateTurn;
    // This function passes back confirmation accept as a string 'yes' until there is support
    // in TCP to pass back structured data
    function processConfirmationAccept() {
        DialogSPALib.logVerboseTrace("SPADialog: processConfirmationAccept", 0 /* Info */, "impression ID: " + t_currentImpressionId + "turn count: " + t_currentTurnCount, "snr connection URL: " + trumanEndpoint);
        var confirmUrl = trumanEndpoint + "?q=yes&client=windows&input=1&setflight=mttimer";
        ClientResolutionRequested.CallEndPointGet(confirmUrl, t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function (innerHtml) {
            ClientResolutionRequested.render(innerHtml);
        });
    }
    DialogSPALib.processConfirmationAccept = processConfirmationAccept;
    // This function passes back confirmation reject as a string 'no' until there is support
    // in TCP to pass back structured data
    function processConfirmationReject() {
        DialogSPALib.logVerboseTrace("SPADialog: processConfirmationReject", 0 /* Info */, "impression ID: " + t_currentImpressionId + "turn count: " + t_currentTurnCount, "snr connection URL: " + trumanEndpoint);
        var rejectUrl = trumanEndpoint + "?q=no&client=windows&input=1&setflight=mttimer";
        ClientResolutionRequested.CallEndPointGet(rejectUrl, t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function (innerHtml) {
            ClientResolutionRequested.render(innerHtml);
        });
    }
    DialogSPALib.processConfirmationReject = processConfirmationReject;
    // This function passes back time duration as a string until there is support from TCP to send
    // structured time data back
    function processTimePickerData(hoursId, minutesId, secondsId) {
        DialogSPALib.logVerboseTrace("SPADialog: processTimePickerData", 0 /* Info */, "impression ID: " + t_currentImpressionId + "turn count: " + t_currentTurnCount, "");
        if (!isNumberWithinRange(hoursId.value, 0, 23) || !isNumberWithinRange(minutesId.value, 0, 59) || !isNumberWithinRange(secondsId.value, 0, 59)) {
            // invalid input
            hoursId.value = hoursId.defaultValue;
            minutesId.value = minutesId.defaultValue;
            secondsId.value = secondsId.defaultValue;
            return;
        }
        if ((hoursId.value == hoursId.defaultValue) && (minutesId.value == minutesId.defaultValue) && (secondsId.value == secondsId.defaultValue)) {
            // all 0s input - invalid. Do nothing
            return;
        }
        var hours = (isStringNullOrEmpty(hoursId.value) || (hoursId.value == hoursId.defaultValue)) ? "" : (hoursId.value + "%20hours");
        var minutes = (isStringNullOrEmpty(minutesId.value) || (minutesId.value == minutesId.defaultValue)) ? "" : ("%20" + minutesId.value + "%20minutes");
        var seconds = (isStringNullOrEmpty(secondsId.value) || (secondsId.value == secondsId.defaultValue)) ? "" : ("%20" + secondsId.value + "%20seconds");
        var timeUrl = trumanEndpoint + "?q=" + hours + minutes + seconds + "&input=1&setflight=mttimer";
        ClientResolutionRequested.CallEndPointGet(timeUrl, t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function (innerHtml) {
            ClientResolutionRequested.render(innerHtml);
        });
    }
    DialogSPALib.processTimePickerData = processTimePickerData;
    function processHandoff() {
        DialogSPALib.logVerboseTrace("SPADialog: processHandoff", 0 /* Info */, "impression ID: " + t_currentImpressionId + "; turn count: " + t_currentTurnCount, "snr connection URL: " + trumanEndpoint);
        handoffDialogToCortana(1 /* RelinquishUI */);
    }
    DialogSPALib.processHandoff = processHandoff;
    // remove SPA dialog to RAF
    function handoffDialogToCortana(dialogCompleteState) {
        DialogSPALib.logVerboseTrace("SPADialog: handoffDialogToCortana", 0 /* Info */, "dialogCompleteState: " + dialogCompleteState, "stic mode: enabled");
        if (dialogCompleteState == 2 /* Error */) {
            updateCortanaUIState(4 /* Error */, 8 /* Error */);
        }
        else {
            updateCortanaUIState(0 /* Idle */, 0 /* None */);
        }
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            g_spaDialogRuntime.changeSticStateAndInputMode(0 /* Enabled */, 0 /* Standard */);
        }
        g_spaDialogRuntime.updateTrex("", true);
        g_spaDialogRuntime.dialogComplete("Dialog completed", dialogCompleteState);
        // unregister all event handlers
        unregisterAllEventHandlers();
    }
    DialogSPALib.handoffDialogToCortana = handoffDialogToCortana;
    function processLaunchUri(launchUri) {
        var projectedApi = "{\"Uri\":\"action://LaunchTaskCompletionUri\",\"LaunchUri\":\"" + launchUri + "\",\"DismissOnComplete\":false}";
        DialogSPALib.logVerboseTrace("SPADialog: processLaunchUri", 0 /* Info */, "LaunchUri: " + launchUri, "Projected API: " + projectedApi);
        SearchAppWrapper.CortanaApp.processNLCommandAsync(projectedApi, t_currentImpressionId).done(function () {
            handoffDialogToCortana(0 /* RetainUI */);
        }, function () {
            handoffDialogToCortana(2 /* Error */);
        });
    }
    DialogSPALib.processLaunchUri = processLaunchUri;
    function logVerboseTrace(eventName, opCode, payloadName, payloadData, isError) {
        if (isError === void 0) { isError = false; }
        SearchAppWrapper.CortanaApp.logVerboseTrace(eventName, opCode, payloadName, payloadData, t_currentImpressionId);
        if (isError) {
            SharedLogHelper.LogError(LOG_DIALOGSPA, "eventName: " + eventName + ", payloadName: " + payloadName + ", payloadData: " + payloadData + ", impressionId: " + t_currentImpressionId);
        }
    }
    DialogSPALib.logVerboseTrace = logVerboseTrace;
    // Sets emotion, udate cortana webveiw
    function renderSPAUX(emotion) {
        DialogSPALib.logVerboseTrace("SPADialog: renderSPAUX", 0 /* Info */, "emotion: " + emotion, "");
        if (!isStringNullOrEmpty(emotion)) {
            setEmotion(emotion);
        }
        if (g_currentWebviewState == 1 /* AppVisible */) {
            DialogSPALib.logVerboseTrace("SPADialog: renderSPAUX", 0 /* Info */, "Calling ShowWebViewAsync", "");
            SearchAppWrapper.CortanaApp.showWebViewAsync();
        }
    }
    function setEmotion(emotion) {
        SearchAppWrapper.CortanaApp.setEmotion(emotion, false, false);
    }
    // Helper method for validating string
    function isStringNullOrEmpty(inputString) {
        if (inputString != null && inputString != "") {
            return false;
        }
        return true;
    }
    function initializeISpaDialogContextValues(eventArgs) {
        DialogSPALib.logVerboseTrace("SPADialog: initializeISpaDialogContextValues", 0 /* Info */, "ISpaDialogContext", "snrConnectionUrl: " + eventArgs.snrConnectionUrl + ", impressionId: " + eventArgs.impressionId);
        turn0CuInput = eventArgs.cuInput;
        trumanEndpoint = eventArgs.snrConnectionUrl;
        turn0ImpressionId = eventArgs.impressionId;
    }
    function updateCortanaUIState(uiState, earCon) {
        DialogSPALib.logVerboseTrace("SPADialog: updateCortanaUIState", 0 /* Info */, "cortana UI state: " + uiState, "Earcon : " + earCon);
        if (g_currentUIState != uiState) {
            g_spaDialogRuntime.updateGui(uiState);
            g_currentUIState = uiState;
        }
        if (g_isSpeechInput && earCon != 0 /* None */) {
            g_spaDialogRuntime.playEarconAsync(earCon);
        }
    }
    // Helper method for validating if InputQueryType is speech
    function isSpeechQuery(inputQueryType) {
        if (inputQueryType != undefined && inputQueryType == "SpeechQuery") {
            return true;
        }
        return false;
    }
    // processes current turn ssml and action
    function processSsmlAndAction(ssml, postssmlAction, dictationParam) {
        DialogSPALib.logVerboseTrace("SPADialog: processSsmlAndAction", 0 /* Info */, "ssml:" + ssml, "postssmlaction : " + postssmlAction + ", cuRequestHeaders: " + JSON.stringify(g_cuRequestHeaders));
        if (!isStringNullOrEmpty(postssmlAction) && postssmlAction == "waitforuserinput" && g_isSpeechInput) {
            // prompt user for input and start listening
            updateCortanaUIState(2 /* Speaking */, 0 /* None */);
            g_currentSpeakOperation = g_spaDialogRuntime.speakAsync(ssml, g_ttsCounter++);
            g_currentSpeakOperation.done(function () {
                g_currentSpeakOperation = null;
                processVoiceInput(dictationParam);
            }, function () {
                g_currentSpeakOperation = null;
                handoffDialogToCortana(2 /* Error */);
            });
        }
    }
    function processMicrophoneButtonPressed(dictationParam) {
        DialogSPALib.logVerboseTrace("SPADialog: processMicrophonebuttonpressed", 0 /* Info */, "Entering processMicrophonebuttonpressed()", "speakinprogress :" + (g_currentUIState == 2 /* Speaking */) + ", g_isSpeechInput: " + g_isSpeechInput + ", turnCount: " + t_currentTurnCount);
        if (!g_isSpeechInput) {
            // nothing to do if not speech input
            return;
        }
        if (g_currentSpeakOperation != null && g_currentUIState == 2 /* Speaking */) {
            // if there is a speak operation in progress, cancel it first
            g_currentSpeakOperation.cancel();
            g_currentSpeakOperation = null;
        }
        switch (g_currentUIState) {
            case 1 /* Listening */:
            case 3 /* Thinking */:
                updateCortanaUIState(0 /* Idle */, 7 /* Cancel */);
                break;
            default:
                // process microphone button
                processVoiceInput(dictationParam);
        }
    }
    // processes all speech events
    function processVoiceInput(dictationPrameter) {
        DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */, "turnCount: " + t_currentTurnCount + ", cuRequestHeaders" + JSON.stringify(g_cuRequestHeaders), "cuInput :" + turn0CuInput);
        if (!turn0CuInput) {
            handoffDialogToCortana(2 /* Error */);
            return;
        }
        var isRequestSentToSNR = false;
        var modifiedCuInput = modifyCuInput(turn0CuInput, t_currentImpressionId, dictationPrameter);
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            // Put the STIC in listening only mode
            g_spaDialogRuntime.changeSticStateAndInputMode(0 /* Enabled */, 1 /* ListeningOnly */);
        }
        // Don't need to play earcon for listening since RAF will play it
        updateCortanaUIState(1 /* Listening */, 0 /* None */);
        g_spaDialogRuntime.startLanguageUnderstandingFromVoiceAsync(modifiedCuInput).then(function onComplete(finalResult) {
            if (finalResult.notificationType == 3 /* FinalResult */) {
                if (finalResult.finalResultNotification) {
                    var finalSr = finalResult.finalResultNotification;
                    var recoStatus = getRecoResultAndUpdateTrex(finalSr.cuOutput, true);
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput: NlProgressNotificationType", 0 /* Info */, "FinalResult: hr = " + finalSr.operationHResult, "CuOutput reco result = " + recoStatus);
                    // if the operation is successful, query truman endpoint and go to thinking state
                    // else go to idle state so the user can interact with the microphone
                    if (finalSr.operationHResult == 0 && recoStatus == "200") {
                        updateCortanaUIState(3 /* Thinking */, 9 /* Thinking */);
                        if (!isRequestSentToSNR) {
                            // this is hard coded for now we will be updating IDL and start using spa dialog context
                            ClientResolutionRequested.CallEndPointGet("https://www.bing.com/speech_render?speech=1&input=2&snrtrace=1&form=WNSBOX&cc=US&setlang=en-US", t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function (innerHtml) { return ClientResolutionRequested.render(innerHtml); });
                            isRequestSentToSNR = true;
                        }
                    }
                    else {
                        updateCortanaUIState(0 /* Idle */, 0 /* None */);
                    }
                }
                else {
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */, "Speech finalResultNotification is null turnCount: " + t_currentTurnCount, "", true);
                }
            }
            else {
                DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */, "onComplete", "NlProgressNotificationType.FinalResult Event not received turnCount: " + t_currentTurnCount, true);
            }
        }, function onError(error) {
            DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */, "startLanguageUnderstandingFromVoiceAsync" + "Error: " + error + ", turnCount: " + t_currentTurnCount, "", true);
            handoffDialogToCortana(2 /* Error */);
        }, function onProgress(progress) {
            switch (progress.notificationType) {
                case 0 /* AudioStarted */:
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput: NlProgressNotificationType", 0 /* Info */, "AudioStarted", "");
                    break;
                case 1 /* CookiesAvailable */:
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput: NlProgressNotificationType", 0 /* Info */, "CookiesAvailable", "");
                    break;
                case 2 /* IntermediateResult */:
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput: NlProgressNotificationType", 0 /* Info */, "IntermediateResult", "");
                    if (progress.intermediateResultNotification) {
                        if (!isRequestSentToSNR) {
                            // this is hard coded for now we will be updating IDL and start using spa dialog context
                            ClientResolutionRequested.CallEndPointGet("https://www.bing.com/speech_render?speech=1&input=2&snrtrace=1&setflight=dialoglaunchspa&form=WNSBOX&cc=US&setlang=en-US", t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function (innerHtml) { return ClientResolutionRequested.render(innerHtml); });
                            isRequestSentToSNR = true;
                        }
                        var intermediate = progress.intermediateResultNotification;
                        getRecoResultAndUpdateTrex(intermediate.cuOutput);
                    }
                    else {
                        DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */, "Speech intermediateResultNotification is null, turnCount: " + t_currentTurnCount, "", true);
                    }
                    break;
                default:
                    break;
            }
        });
    }
    // get speech recognition result and update trex
    function getRecoResultAndUpdateTrex(cuOutput, isFinal) {
        if (isFinal === void 0) { isFinal = false; }
        var recoStatus = "0";
        if (cuOutput) {
            var cuOutputJson = JSON.parse(cuOutput);
            recoStatus = cuOutputJson.SrObject.RecognitionStatus;
            var phrase = cuOutputJson.SrObject.RecognizedPhrases[0].DisplayText;
            if (phrase != undefined) {
                DialogSPALib.logVerboseTrace("SPADialog: getRecoResultAndUpdateTrex", 0 /* Info */, "cuOutput result: " + cuOutputJson.SrObject.RecognitionStatus, "Update trex: '" + phrase + "' isFinal: " + isFinal);
                g_spaDialogRuntime.updateTrex(phrase, isFinal);
            }
        }
        else {
            DialogSPALib.logVerboseTrace("SPADialog: getRecoResultAndUpdateTrex", 0 /* Info */, "cuOutput", "Speech cuOutput output is null isFinal: " + isFinal);
        }
        return recoStatus;
    }
    // Set current impressoin id & dictation param
    function modifyCuInput(cuInput, impressionId, dictationParameter) {
        try {
            var json = JSON.parse(cuInput);
            json.ImpressionId = impressionId;
            if (!json.DictationParameters) {
                var dictationobj = JSON.parse(dictationParameter);
                json.DictationParameters = dictationobj;
            }
            else {
                json.DictationParameters.CompleteTimeout = 1000;
                json.DictationParameters.IncompleteTimeout = 1000;
                json.DictationParameters.InitialSilenceTimeout = 3000;
            }
            return JSON.stringify(json);
        }
        catch (err) {
            DialogSPALib.logVerboseTrace("SPADialog: modifyCuInput", 0 /* Info */, "cuInput:" + cuInput, "dictationPrameter: " + dictationParameter + ",Json exception: " + err.message);
            handoffDialogToCortana(2 /* Error */);
        }
    }
    function registerEventHandler(eventName, handler) {
        DialogSPALib.logVerboseTrace("SPADialog: registerEventHandler", 0 /* Info */, "eventName:" + eventName, "");
        g_spaDialogRuntime.addEventListener(eventName, handler);
        g_currentEventHandlers[eventName] = handler;
    }
    function unregisterAllEventHandlers() {
        for (var eventName in g_currentEventHandlers) {
            DialogSPALib.logVerboseTrace("SPADialog: unRegisterEventHandler", 0 /* Info */, "eventName:" + eventName, "");
            g_spaDialogRuntime.removeEventListener(eventName, g_currentEventHandlers[eventName]);
        }
        g_currentEventHandlers = {};
    }
    function initGlobals(inputQueryType, impressionId, turnCount, cuRequestHeaders) {
        if (cuRequestHeaders === void 0) { cuRequestHeaders = null; }
        g_isSpeechInput = isSpeechQuery(inputQueryType);
        g_currentWebviewState = SearchAppWrapper.CortanaApp.currentState;
        g_cuRequestHeaders = cuRequestHeaders;
        t_currentImpressionId = impressionId;
        t_currentTurnCount = turnCount;
    }
    function isNumberWithinRange(str, minValue, maxValue) {
        if (!/^\d+$/.test(str)) {
            return false;
        }
        var num = parseInt(str, 10);
        return (!isNaN(num) && (num >= minValue) && (num <= maxValue));
    }
})(DialogSPALib || (DialogSPALib = {}));
