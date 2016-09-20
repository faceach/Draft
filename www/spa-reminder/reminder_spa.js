///<reference path="..\..\..\..\Shared\Content\Content\Script\Declarations\Shared.d.ts" />
///<reference path="..\..\..\..\Threshold\src\Content\Script\Declarations\SearchAppWrapper.d.ts" />
var CUDialog;
(function(CUDialog) {
    function sendAction(response) {
        var cuAction;
        if (_d.querySelectorAll(".b_cat3a").length > 0) {
            cuAction = response.Cat3AAction;
        } else {
            cuAction = response.Cat3BAction;
        }
        SearchAppWrapper.CortanaApp.sendAction(cuAction);
    }
    CUDialog.sendAction = sendAction;
})(CUDialog || (CUDialog = {}));; /// <reference path="..\..\..\..\Shared\Content\Content\Script\Declarations\Threshold.Utilities.d.ts" />
/// <reference path="..\..\..\..\Threshold\src\Content\Script\Declarations\CortanaSearch.d.ts" />
/// <reference path="..\..\..\..\Threshold\src\content\script\declarations\SearchAppWrapper.d.ts" />
/// <reference path="Declarations\SPADialogLib.d.ts" />
var DialogSPALib;
(function(DialogSPALib) {
    // global variables per SPA session
    var g_ttsCounter = 15 /* Max */ ;
    var g_currentUIState = 0 /* Idle */ ;
    var g_isSpeechInput = false;
    var g_currentWebviewState = 0 /* AppHidden */ ;
    var g_currentSpeakOperation = null;
    var g_currentLuOperation = null;
    var g_currentEventHandlers = {};
    var g_cuRequestHeaders;
    var g_cortanaApp = SearchAppWrapper.CortanaApp;
    var g_spaDialogRuntime = g_cortanaApp.spaDialogRuntime;
    var g_isDialogTerminated = false;
    var g_requestData = null;
    var g_language = null;
    var g_region = null;
    var g_isRequestFromBand = false;
    var g_sessionId;
    var g_asyncResolutionTurnCount = 0;
    var g_asyncResolutionInProgress = false;
    // Turn 0 input parameters to be cached
    var trumanEndpoint;
    var turn0CuInput;
    var turn0CuOutput;
    var turn0ImpressionId;
    // Per turn variables
    var t_currentImpressionId;
    var t_isRequestSentToSNR;
    var t_taskFrameId;
    // constants   
    var LOG_DIALOGSPA = "DialogSPA";
    var changeSticModeFunctionName = "changeSticStateAndInputMode";
    var spaDialogSjEvtName = "AJAX.sj_evt_startspadialog";
    var dialogSpeechEndpoint = "/DialogPolicy?&isSpeech=1&version=2";
    var dialogTextEndpoint = "/DialogPolicy?&isSpeech=0&version=2";
    sj_be(_w, 'load', initializeSPADialog);
    sj_be(_w, 'click', switchFromVoiceInputToText);

    function switchFromVoiceInputToText() {
        if (g_isSpeechInput) {
            cancelCurrentSpeakOperation();
            cancelCurrentLuOperation();
            updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
            if (g_spaDialogRuntime.changeSticStateAndInputMode) {
                ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 1 /* Disabled */ , 0 /* Standard */ );
            }
            g_isSpeechInput = false;
            g_requestData = setRequestData(turn0CuInput);
            setRequestDataHeader();
        }
    }

    function setRequestDataHeader() {
        if (g_requestData && g_cuRequestHeaders) {
            var cuRequestDataHeaderName = "X-CU-RequestData";
            var headerSet = false;
            for (var i = 0; i < g_cuRequestHeaders.length; i++) {
                if (g_cuRequestHeaders[i][0] == cuRequestDataHeaderName) {
                    g_cuRequestHeaders[i][1] = g_requestData;
                    headerSet = true;
                    break;
                }
            }
            if (!headerSet) {
                g_cuRequestHeaders.push([cuRequestDataHeaderName, g_requestData]);
            }
        }
    }
    // Set requestdata header
    function setRequestData(cuInput) {
        try {
            var json = JSON.parse(cuInput);
            var requestData = JSON.parse("{ \"CUServiceId\": \"\", \"ClientVersion\": \"\", \"ConversationId\": \"\", \"IsNewConversationId\": false, \"SpeechLanguage\": \"\", \"ClientTaskFrame\": null, \"QFClientContextTaskFrame\": null }");
            requestData.ConversationId = json.ConversationId;
            requestData.IsNewConversationId = false;
            return encodeURIComponent(JSON.stringify(requestData));
        } catch (err) {
            DialogSPALib.logVerboseTrace("SPADialog: setRequestData", 0 /* Info */ , "cuInput:" + cuInput, "cuInput: " + cuInput + ",Json exception: " + err.message, true);
            handoffDialogToCortana(2 /* Error */ );
        }
    }

    function initializeSPADialog() {
        // do not use registerEventHandler to register startspadialog & dialogterminated 
        // event, since we do not want it to be removed automatically on each turn
        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "addEventListener", "AEL", null, "startspadialog", startSpaDialogEventHandler);
        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "addEventListener", "AEL", null, "dialogterminated", dialogTerminatedEventHandler);
    }

    function startSpaDialogEventHandler(eventArgs) {
        initializeISpaDialogContextValues(eventArgs);
        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "removeEventListener", "AEL", null, "startspadialog", startSpaDialogEventHandler);
        sj_evt.fire(spaDialogSjEvtName);
    }

    function processResolutionActionsInternal(projectedApis, callBackUrl, taskFrameId, sessionId, locale) {
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 1 /* Disabled */ , 0 /* Standard */ );
        }
        DialogSPALib.logVerboseTrace("SPADialog: processResolutionActionInternal", 0 /* Info */ , "g_currentWebviewState: " + g_currentWebviewState + " currenUIState: " + g_currentUIState + " tf id: " + taskFrameId + " impression id: " + t_currentImpressionId, "callbackUrl: " + callBackUrl + ", cuRequestHeaders" + JSON.stringify(g_cuRequestHeaders));
        updateCortanaUIState(3 /* Thinking */ , 9 /* Thinking */ );
        ClientResolutionRequested.executeResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, t_currentImpressionId, locale, g_cuRequestHeaders);
    }

    function processAsyncResolutionInternal(ssml, emotion, estimatedTimeToComplete) {
        DialogSPALib.logVerboseTrace("SPADialog: processAsyncResolutionInternal", 0 /* Info */ , "g_currentWebviewState: " + g_currentWebviewState + " currenUIState: " + g_currentUIState + " timeToComplete: " + estimatedTimeToComplete, "emotion: " + emotion + ", ssml: " + ssml);
        var asyncResolutionTtsComplete = "asyncResolutionTtsComplete";
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 1 /* Disabled */ , 0 /* Standard */ );
        }
        renderSPAUX(emotion);
        if (g_isSpeechInput && !isStringNullOrEmpty(ssml) && (g_asyncResolutionTurnCount == 1)) {
            updateCortanaUIState(2 /* Speaking */ , 0 /* None */ );
            g_currentSpeakOperation = ThresholdUtilities.wrapApiCall(g_spaDialogRuntime, "speakAsync", "SA", null, ssml, g_ttsCounter++);
            g_currentSpeakOperation.done(function() {
                g_currentSpeakOperation = null;
                if (g_isDialogTerminated) {
                    return;
                }
                sj_evt.fire(asyncResolutionTtsComplete);
            }, function() {
                handoffDialogToCortana(2 /* Error */ );
                g_currentSpeakOperation = null;
                sj_evt.fire(asyncResolutionTtsComplete);
            });
        } else {
            sj_evt.fire(asyncResolutionTtsComplete);
        }

        function asyncResolutionTtsCompleteAction() {
            sj_evt.unbind(asyncResolutionTtsComplete, asyncResolutionTtsCompleteAction);
            updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
            if (!g_isDialogTerminated) {
                // set the UI to thinking state since this is just a status page
                updateCortanaUIState(3 /* Thinking */ , 9 /* Thinking */ );
                var callbackUrl = (g_isSpeechInput) ? dialogSpeechEndpoint : dialogTextEndpoint;
                // call back into TCP after timeout
                sb_st(function() {
                    return ClientResolutionRequested.sendResolutionResultsToTCP({}, callbackUrl, t_taskFrameId, g_language, g_sessionId, g_cuRequestHeaders, ClientResolutionRequested.TurnTypePrimarySingleTask);
                }, estimatedTimeToComplete);
            }
        }
        sj_evt.bind(asyncResolutionTtsComplete, asyncResolutionTtsCompleteAction, true);
    }

    function processIntermediateTurnInternal(ssml, postssmlAction, emotion, dictationParam) {
        DialogSPALib.logVerboseTrace("SPADialog: processIntermediateTurnInternal", 0 /* Info */ , "g_currentUIState: " + g_currentUIState + "; g_isSpeechInput: " + g_isSpeechInput + "; g_isDialogTerminated: " + g_isDialogTerminated + "; g_isRequestFromBand: " + g_isRequestFromBand, "postSsmlAction: " + postssmlAction + ", cuRequestHeaders" + JSON.stringify(g_cuRequestHeaders));
        if (g_isRequestFromBand) {
            // Multi-turn is not supported for band requests. Just error out.
            handoffDialogToCortana(2 /* Error */ );
            return;
        }
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 1 /* Disabled */ , (g_isSpeechInput) ? 1 /* ListeningOnly */ : 0 /* Standard */ );
        }
        if (!g_isSpeechInput) {
            // for text input, just setup state and exit since the UI controls will determine
            // how to proceed
            updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
            renderSPAUX(emotion);
            return;
        } else {
            var microphoneButtonPressedEventHandler = function(eventArgs) {
                processMicrophoneButtonPressed(dictationParam);
            };
            registerEventHandler("microphonebuttonpressed", microphoneButtonPressedEventHandler);
            renderSPAUX(emotion);
            processSsmlAndAction(ssml, postssmlAction, dictationParam);
        }
    }

    function callProjectedApi(projectedApi, projectedApiMethod, shouldHandoffDialogToCortana) {
        if (!isStringNullOrEmpty(projectedApi)) {
            if (projectedApiMethod == "ClientApiWrapper") {
                var apiContext = {};
                try {
                    apiContext = JSON.parse(projectedApi);
                } catch (error) {
                    // Error if the projected API is not in json format.
                    DialogSPALib.logVerboseTrace("ClientResolutionRequested: executeResolutionAction", 0 /* Info */ , "projectedApi: " + projectedApi, "JSON.parse EXCEPTION: " + error.message, true);
                    DialogSPALib.handoffDialogToCortana(2 /* Error */ );
                }
                ClientApiWrapper.executeApi(apiContext, function(projectedAPIOutput, isSuccess) {
                    if (shouldHandoffDialogToCortana && isSuccess) {
                        handoffDialogToCortana(0 /* RetainUI */ );
                    } else if (!isSuccess) {
                        handoffDialogToCortana(2 /* Error */ );
                    }
                }, t_currentImpressionId);
            } else {
                ThresholdUtilities.wrapApiCall(g_cortanaApp, "processNLCommandAsync", "PNLC", null, projectedApi, t_currentImpressionId).done(function() {
                    if (shouldHandoffDialogToCortana) {
                        handoffDialogToCortana(0 /* RetainUI */ );
                    }
                }, function() {
                    if (shouldHandoffDialogToCortana) {
                        handoffDialogToCortana(2 /* Error */ );
                    }
                });
            }
        }
    }

    function executeFinalActionInternal(ssml, emotion, secondaryTextSmall, secondaryTextMedium, secondaryTextLarge, projectedApi, projectedApiMethod, dismissAppTimeout) {
        DialogSPALib.logVerboseTrace("SPADialog: executeFinalActionInternal", 0 /* Info */ , "g_currentWebviewState: " + g_currentWebviewState + " g_currentUIState: " + g_currentUIState + " isRequestFromBand: " + g_isRequestFromBand, " projectedApi: " + projectedApi + " projectedApiMethod: " + projectedApiMethod + "dismissAppTimeout: " + dismissAppTimeout.toString());
        renderSPAUX(emotion);
        var shouldHandoffDialogToCortana = true;
        if (!isStringNullOrEmpty(ssml) && g_isSpeechInput) {
            if (g_isRequestFromBand) {
                if (g_spaDialogRuntime.sendSsmlToSpeechApp) {
                    ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "sendSsmlToSpeechApp", "SSA", null, ssml, secondaryTextSmall, secondaryTextMedium, secondaryTextLarge, true);
                }
            } else {
                shouldHandoffDialogToCortana = false;
                updateCortanaUIState(2 /* Speaking */ , 0 /* None */ );
                g_currentSpeakOperation = ThresholdUtilities.wrapApiCall(g_spaDialogRuntime, "speakAsync", "SA", null, ssml, g_ttsCounter++);
                var startTime = new Date();
                g_currentSpeakOperation.done(function() {
                    g_currentSpeakOperation = null;
                    if (g_isDialogTerminated) {
                        return;
                    }
                    var endTime = new Date();
                    var elapsedTime = endTime.getTime() - startTime.getTime();
                    var remainingDismissTime = dismissAppTimeout;
                    if (dismissAppTimeout > 0) {
                        // positive dismissAppTimeout specifies the total time to dismiss UI including TTS.
                        // if TTS already took more than dismissAppTimeout, dismiss instantly
                        remainingDismissTime = (dismissAppTimeout > elapsedTime) ? (dismissAppTimeout - elapsedTime) : 0;
                    }
                    if (g_spaDialogRuntime.changeSticStateAndInputMode) {
                        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 0 /* Standard */ );
                    }
                    // if dismiss time is negative, do not dismiss.
                    if (remainingDismissTime == 0) {
                        updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
                        ThresholdUtilities.wrapSynchronousApiCall(g_cortanaApp, "dismissApp", "DA", null);
                    } else if (remainingDismissTime > 0) {
                        updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
                        sb_st(function() {
                            return ThresholdUtilities.wrapSynchronousApiCall(g_cortanaApp, "dismissApp", "DA", null);
                        }, remainingDismissTime);
                    } else {
                        handoffDialogToCortana(0 /* RetainUI */ );
                    }
                }, function() {
                    handoffDialogToCortana(2 /* Error */ );
                    g_currentSpeakOperation = null;
                });
            }
        }
        if (!g_isDialogTerminated) {
            if (!isStringNullOrEmpty(projectedApi)) {
                callProjectedApi(projectedApi, projectedApiMethod, shouldHandoffDialogToCortana);
            } else {
                if (shouldHandoffDialogToCortana) {
                    handoffDialogToCortana(0 /* RetainUI */ );
                }
            }
        }
    }

    function executeFinalActionInternalMobile(ssml, emotion, secondaryTextSmall, secondaryTextMedium, secondaryTextLarge, projectedApi, projectedApiMethod) {
        var finalActionTtsCompleteMobile = "finalActionTtsCompleteMobile";
        DialogSPALib.logVerboseTrace("SPADialog: executeFinalActionInternalMobile", 0 /* Info */ , "g_currentWebviewState: " + g_currentWebviewState + " g_currentUIState: " + g_currentUIState + " g_isRequestFromBand: " + g_isRequestFromBand, "projectedApi: " + projectedApi);
        renderSPAUX(emotion);
        if (!isStringNullOrEmpty(ssml) && g_isSpeechInput) {
            if (g_isRequestFromBand) {
                if (g_spaDialogRuntime.sendSsmlToSpeechApp) {
                    ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "sendSsmlToSpeechApp", "SSA", null, ssml, secondaryTextSmall, secondaryTextMedium, secondaryTextLarge, true);
                }
                sj_evt.fire(finalActionTtsCompleteMobile);
            } else {
                updateCortanaUIState(2 /* Speaking */ , 0 /* None */ );
                g_currentSpeakOperation = ThresholdUtilities.wrapApiCall(g_spaDialogRuntime, "speakAsync", "SA", null, ssml, g_ttsCounter++);
                g_currentSpeakOperation.done(function() {
                    g_currentSpeakOperation = null;
                    if (!g_isDialogTerminated) {
                        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
                            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 0 /* Standard */ );
                        }
                        updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
                    }
                    sj_evt.fire(finalActionTtsCompleteMobile);
                }, function() {
                    handoffDialogToCortana(2 /* Error */ );
                    g_currentSpeakOperation = null;
                    sj_evt.fire(finalActionTtsCompleteMobile);
                });
            }
        } else {
            sj_evt.fire(finalActionTtsCompleteMobile);
        }

        function ttsCompleteAction() {
            sj_evt.unbind(finalActionTtsCompleteMobile, ttsCompleteAction);
            if (!g_isDialogTerminated) {
                if (!isStringNullOrEmpty(projectedApi)) {
                    callProjectedApi(projectedApi, projectedApiMethod, true);
                } else {
                    handoffDialogToCortana(0 /* RetainUI */ );
                }
            }
        }
        sj_evt.bind(finalActionTtsCompleteMobile, ttsCompleteAction, true);
    }
    // Sets emotion, udate cortana webview
    function renderSPAUX(emotion) {
        if (!isStringNullOrEmpty(emotion)) {
            ThresholdUtilities.wrapSynchronousApiCall(g_cortanaApp, "setEmotion", "SE", null, emotion, false, false);
        }
        ThresholdUtilities.wrapApiCall(g_cortanaApp, "showWebViewAsync", "SWW", null);
    }
    // Helper method for validating string
    function isStringNullOrEmpty(inputString) {
        if (inputString != null && inputString != "") {
            return false;
        }
        return true;
    }

    function initializeISpaDialogContextValues(eventArgs) {
        turn0CuInput = eventArgs.cuInput;
        turn0CuOutput = eventArgs.cuOutput;
        trumanEndpoint = eventArgs.snrConnectionUrl;
        turn0ImpressionId = eventArgs.impressionId;
        g_isRequestFromBand = isRequestFromBand(turn0CuInput);
        // this should always be defined, but as a safe practice, assume a default
        g_language = ThresholdUtilities.getUrlParameter(_w.location.href, "setlang");
        if (!g_language) {
            g_language = "en-US";
        }
        // this should always be defined, but as a safe practice, assume a default
        g_region = ThresholdUtilities.getUrlParameter(_w.location.href, "cc");
        if (!g_region) {
            g_region = "US";
        }
        // set the state to thinking the first time dialog is transitioned to SPA
        g_currentUIState = 3 /* Thinking */ ;
    }

    function isRequestFromBand(cuInput) {
        var requestFromBand = false;
        try {
            var json = JSON.parse(cuInput);
            if (json && json.LocalProperties && (json.LocalProperties.InvocationSourceType != undefined) && (json.LocalProperties.InvocationSourceType == "SpeechApp")) {
                requestFromBand = true;
            }
        } catch (err) {
            DialogSPALib.logVerboseTrace("SPADialog: isRequestFromBand", 0 /* Info */ , "cuInput:" + cuInput, "Json exception: " + err.message, true);
            handoffDialogToCortana(2 /* Error */ );
        }
        return requestFromBand;
    }

    function updateCortanaUIState(uiState, earCon) {
        if (g_currentUIState != uiState) {
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "updateGui", "UG", null, uiState);
            g_currentUIState = uiState;
            if (g_isSpeechInput && earCon != 0 /* None */ ) {
                ThresholdUtilities.wrapApiCall(g_spaDialogRuntime, "playEarconAsync", "PE", null, earCon);
            }
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
        if (!isStringNullOrEmpty(postssmlAction) && postssmlAction == "waitforuserinput" && g_isSpeechInput) {
            // prompt user for input and start listening
            updateCortanaUIState(2 /* Speaking */ , 0 /* None */ );
            g_currentSpeakOperation = ThresholdUtilities.wrapApiCall(g_spaDialogRuntime, "speakAsync", "SA", null, ssml, g_ttsCounter++);
            g_currentSpeakOperation.done(function() {
                g_currentSpeakOperation = null;
                if (!g_isDialogTerminated) {
                    updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
                    processVoiceInput(dictationParam);
                }
            }, function() {
                g_currentSpeakOperation = null;
                handoffDialogToCortana(2 /* Error */ );
            });
        }
    }

    function processMicrophoneButtonPressed(dictationParam) {
        if (!g_isSpeechInput) {
            // nothing to do if not speech input
            return;
        }
        if (g_currentSpeakOperation != null && g_currentUIState == 2 /* Speaking */ ) {
            // if there is a speak operation in progress, cancel it first
            g_currentSpeakOperation.cancel();
            g_currentSpeakOperation = null;
        }
        switch (g_currentUIState) {
            case 1 /* Listening */ :
            case 3 /* Thinking */ :
                updateCortanaUIState(0 /* Idle */ , 7 /* Cancel */ );
                break;
            default:
                // create a new impression ID for this turn and process microphone button pressed
                t_currentImpressionId = createCUImpressionId();
                processVoiceInput(dictationParam);
                break;
        }
    }

    function dialogTerminatedEventHandler() {
        g_isDialogTerminated = true;
        cancelCurrentSpeakOperation();
        cancelCurrentLuOperation();
    }

    function cancelCurrentSpeakOperation() {
        if (g_currentSpeakOperation != null) {
            g_currentSpeakOperation.cancel();
            g_currentSpeakOperation = null;
        }
    }

    function cancelCurrentLuOperation() {
        if (g_currentLuOperation != null) {
            g_currentLuOperation.cancel();
            g_currentLuOperation = null;
        }
    }
    // processes all speech events
    function processVoiceInput(dictationParameter) {
        if (!turn0CuInput) {
            handoffDialogToCortana(2 /* Error */ );
            return;
        }
        t_isRequestSentToSNR = false;
        var modifiedCuInput = modifyCuInput(turn0CuInput, t_currentImpressionId, dictationParameter);
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            // Put the STIC in listening only mode
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 1 /* ListeningOnly */ );
        }
        // Don't need to play earcon for listening since RAF will play it
        updateCortanaUIState(1 /* Listening */ , 0 /* None */ );
        g_currentLuOperation = ThresholdUtilities.wrapApiCall(g_spaDialogRuntime, "startLanguageUnderstandingFromVoiceAsync", "SLU", null, modifiedCuInput);
        g_currentLuOperation.then(function onComplete(finalResult) {
            g_currentLuOperation = null;
            if (g_isDialogTerminated) {
                return;
            }
            if (finalResult.notificationType == 3 /* FinalResult */ ) {
                if (finalResult.finalResultNotification) {
                    var finalSr = finalResult.finalResultNotification;
                    var recoStatus = getRecoResultAndUpdateTrex(finalSr.cuOutput, true);
                    // if the operation is successful, query truman endpoint and go to thinking state
                    // else go to idle state so the user can interact with the microphone
                    if (finalSr.operationHResult == 0 && recoStatus == "200") {
                        updateCortanaUIState(3 /* Thinking */ , 9 /* Thinking */ );
                        if (!t_isRequestSentToSNR) {
                            // this is hard coded for now we will be updating IDL and start using spa dialog context
                            ClientResolutionRequested.callEndPointGet(getTrumanProxyUrl(), t_currentImpressionId, g_cuRequestHeaders, function(innerHtml) {
                                return ClientResolutionRequested.render(innerHtml);
                            });
                            t_isRequestSentToSNR = true;
                        }
                    } else {
                        updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
                    }
                } else {
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */ , "Speech finalResultNotification is null;", "", true);
                }
            } else {
                DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */ , "onComplete", "NlProgressNotificationType.FinalResult Event not received", true);
            }
        }, function onError(error) {
            DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */ , "startLanguageUnderstandingFromVoiceAsync" + "Error: " + error, "", true);
            handoffDialogToCortana(2 /* Error */ );
            g_currentLuOperation = null;
        }, function onProgress(progress) {
            switch (progress.notificationType) {
                case 0 /* AudioStarted */ :
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput: NlProgressNotificationType", 0 /* Info */ , "AudioStarted", "");
                    break;
                case 1 /* CookiesAvailable */ :
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput: NlProgressNotificationType", 0 /* Info */ , "CookiesAvailable", "");
                    var iterator = progress.cookiesNotification.cookies.first();
                    if (iterator) {
                        var cookieValue;
                        var cookieName = "CUCookie";
                        do {
                            var item = iterator.current;
                            if (item.key.toLowerCase() == cookieName.toLowerCase()) {
                                cookieValue = item.value;
                                break;
                            }
                        } while (iterator.moveNext());
                        DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput: NlProgressNotificationType", 0 /* Info */ , "CUCookie set value:" + cookieValue + " sj_cook.get() result: " + sj_cook.get(cookieName), "");
                    }
                    break;
                case 2 /* IntermediateResult */ :
                    if (progress.intermediateResultNotification) {
                        if (!t_isRequestSentToSNR) {
                            // this is hard coded for now we will be updating IDL and start using spa dialog context
                            ClientResolutionRequested.callEndPointGet(getTrumanProxyUrl(), t_currentImpressionId, g_cuRequestHeaders, function(innerHtml) {
                                return ClientResolutionRequested.render(innerHtml);
                            });
                            t_isRequestSentToSNR = true;
                        }
                        var intermediate = progress.intermediateResultNotification;
                        getRecoResultAndUpdateTrex(intermediate.cuOutput);
                    } else {
                        DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */ , "Speech intermediateResultNotification is null", "", true);
                    }
                    break;
                default:
                    break;
            }
        });
    }
    // get speech recognition result and update trex
    function getRecoResultAndUpdateTrex(cuOutput, isFinal) {
        if (isFinal === void 0) {
            isFinal = false;
        }
        var recoStatus = "0";
        if (cuOutput) {
            var cuOutputJson = JSON.parse(cuOutput);
            recoStatus = cuOutputJson.SrObject.RecognitionStatus;
            var phrase = cuOutputJson.SrObject.RecognizedPhrases[0].DisplayText;
            if (phrase != undefined) {
                ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "updateTrex", "UT", null, phrase, isFinal);
            }
        } else {
            DialogSPALib.logVerboseTrace("SPADialog: getRecoResultAndUpdateTrex", 0 /* Info */ , "cuOutput", "Speech cuOutput output is null isFinal: " + isFinal, true);
        }
        return recoStatus;
    }
    // Set current impression id & dictation param
    function modifyCuInput(cuInput, impressionId, dictationParameter) {
        try {
            var json = JSON.parse(cuInput);
            json.ImpressionId = impressionId;
            if (!json.DictationParameters) {
                var dictationobj = JSON.parse(dictationParameter);
                json.DictationParameters = dictationobj;
            } else {
                json.DictationParameters.CompleteTimeout = 1000;
                json.DictationParameters.IncompleteTimeout = 1000;
                json.DictationParameters.InitialSilenceTimeout = 3000;
            }
            if (json.LocalProperties && (json.LocalProperties.InvocationSourceType != undefined)) {
                json.LocalProperties.InvocationSourceType = "SoftwareButton";
            }
            return JSON.stringify(json);
        } catch (err) {
            DialogSPALib.logVerboseTrace("SPADialog: modifyCuInput", 0 /* Info */ , "cuInput:" + cuInput, "dictationParameter: " + dictationParameter + ", Json exception: " + err.message, true);
            handoffDialogToCortana(2 /* Error */ );
        }
    }

    function registerEventHandler(eventName, handler) {
        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "addEventListener", "AEL", null, eventName, handler);
        g_currentEventHandlers[eventName] = handler;
    }

    function unregisterAllEventHandlers() {
        for (var eventName in g_currentEventHandlers) {
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "removeEventListener", "REL", null, eventName, g_currentEventHandlers[eventName]);
        }
        g_currentEventHandlers = {};
    }

    function initializeTurn(inputQueryType, cuRequestHeaders, sessionId, taskFrameId, isAsyncResolutionTurn) {
        if (cuRequestHeaders === void 0) {
            cuRequestHeaders = null;
        }
        if (sessionId === void 0) {
            sessionId = null;
        }
        if (taskFrameId === void 0) {
            taskFrameId = null;
        }
        if (isAsyncResolutionTurn === void 0) {
            isAsyncResolutionTurn = false;
        }
        // unregister all event handlers from previous turn
        unregisterAllEventHandlers();
        g_isSpeechInput = isSpeechQuery(inputQueryType);
        g_currentWebviewState = g_cortanaApp.currentState;
        g_cuRequestHeaders = cuRequestHeaders;
        if (isAsyncResolutionTurn) {
            if (g_asyncResolutionInProgress) {
                // async turn already in progress; increment the async resolution count
                g_asyncResolutionTurnCount++;
            } else {
                g_asyncResolutionInProgress = true;
                g_asyncResolutionTurnCount = 0;
            }
        } else {
            g_asyncResolutionInProgress = false;
            g_asyncResolutionTurnCount = 0;
        }
        if (!g_isSpeechInput) {
            setRequestDataHeader();
        }
        g_sessionId = sessionId;
        t_taskFrameId = taskFrameId;
        t_currentImpressionId = createCUImpressionId();
    }

    function isNumberWithinRange(str, minValue, maxValue) {
        if (!/^\d+$/.test(str)) {
            return false;
        }
        var num = parseInt(str, 10);
        return (!isNaN(num) && (num >= minValue) && (num <= maxValue));
    }

    function createCUImpressionId() {
        return g_cortanaApp.createGuid().replace("{", "").replace("}", "").toLowerCase();
    }

    function getTrumanProxyUrl() {
        return "/speech_render?speech=1&input=2&form=WNSBOX&cc=" + g_region + "&setlang=" + g_language;
    }

    function updateCallBackUrl(callBackUrl) {
        if (!g_isSpeechInput && callBackUrl.indexOf("isSpeech=1") != -1) {
            return callBackUrl.replace("isSpeech=1", "isSpeech=0");
        }
        return callBackUrl;
    }
    // process client resolution action and send data back to DialogPolicy
    function processResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, locale, inputQueryType, cuRequestHeaders) {
        function evtAction() {
            try {
                sj_evt.unbind(spaDialogSjEvtName, evtAction);
                initializeTurn(inputQueryType, cuRequestHeaders, sessionId, taskFrameId);
                callBackUrl = updateCallBackUrl(callBackUrl);
                processResolutionActionsInternal(projectedApis, callBackUrl, taskFrameId, sessionId, locale);
            } catch (error) {
                DialogSPALib.logVerboseTrace("SPADialog: processResolutionActions", 0 /* Info */ , "Session ID: " + sessionId, "Exception: " + error.message + ", inputQueryType: " + inputQueryType, true);
                handoffDialogToCortana(2 /* Error */ );
            }
        }
        sj_evt.bind(spaDialogSjEvtName, evtAction, true);
    }
    DialogSPALib.processResolutionActions = processResolutionActions;
    // execute final task action
    function executeFinalAction(ssml, emotion, secondaryTextSmall, secondaryTextMedium, secondaryTextLarge, projectedApi, projectedApiMethod, dismissAppTimeout, inputQueryType) {
        function evtAction() {
            try {
                sj_evt.unbind(spaDialogSjEvtName, evtAction);
                initializeTurn(inputQueryType);
                if (g_cortanaApp.isMobile) {
                    // On mobile we need to wait for TTS before executing projected API.
                    executeFinalActionInternalMobile(ssml, emotion, secondaryTextSmall, secondaryTextMedium, secondaryTextLarge, projectedApi, projectedApiMethod);
                } else {
                    executeFinalActionInternal(ssml, emotion, secondaryTextSmall, secondaryTextMedium, secondaryTextLarge, projectedApi, projectedApiMethod, dismissAppTimeout);
                }
            } catch (error) {
                DialogSPALib.logVerboseTrace("SPADialog: executeFinalAction", 0 /* Info */ , "projectedAPI: " + projectedApi, "Exception: " + error.message + ", inputQueryType: " + inputQueryType, true);
                handoffDialogToCortana(2 /* Error */ );
            }
        }
        sj_evt.bind(spaDialogSjEvtName, evtAction, true);
    }
    DialogSPALib.executeFinalAction = executeFinalAction;
    // initializes dialog processing and processes intermediate turns
    function processIntermediateTurn(ssml, postssmlAction, emotion, dictationParam, inputQueryType, cuRequestHeaders, sessionId) {
        function evtAction() {
            try {
                sj_evt.unbind(spaDialogSjEvtName, evtAction);
                initializeTurn(inputQueryType, cuRequestHeaders, sessionId);
                processIntermediateTurnInternal(ssml, postssmlAction, emotion, dictationParam);
            } catch (error) {
                DialogSPALib.logVerboseTrace("SPADialog: processIntermediateTurn", 0 /* Info */ , "", "Exception: " + error.message + ", inputQueryType: " + inputQueryType + ", postSsmlAction: " + postssmlAction, true);
                handoffDialogToCortana(2 /* Error */ );
            }
        }
        sj_evt.bind(spaDialogSjEvtName, evtAction, true);
    }
    DialogSPALib.processIntermediateTurn = processIntermediateTurn;

    function processAsyncResolution(ssml, postssmlAction, emotion, cuRequestHeaders, sessionId, estimatedTimeToComplete, inputQueryType) {
        function evtAction() {
            try {
                sj_evt.unbind(spaDialogSjEvtName, evtAction);
                initializeTurn(inputQueryType, cuRequestHeaders, sessionId, null, true);
                if (g_asyncResolutionTurnCount > 10) {
                    // exceeded max number of retries
                    handoffDialogToCortana(2 /* Error */ );
                } else {
                    processAsyncResolutionInternal(ssml, emotion, estimatedTimeToComplete);
                }
            } catch (error) {
                DialogSPALib.logVerboseTrace("SPADialog: processAsyncResolution", 0 /* Info */ , "estimatedTimeToComplete: " + estimatedTimeToComplete, "Exception: " + error.message + ", inputQueryType: " + inputQueryType + ", postSsmlAction: " + postssmlAction, true);
                handoffDialogToCortana(2 /* Error */ );
            }
        }
        sj_evt.bind(spaDialogSjEvtName, evtAction, true);
    }
    DialogSPALib.processAsyncResolution = processAsyncResolution;
    // This function passes back confirmation accept as a string 'yes' until there is support
    // in TCP to pass back structured data
    function processConfirmationAccept() {
        switchFromVoiceInputToText();
        updateCortanaUIState(3 /* Thinking */ , 9 /* Thinking */ );
        var multimodalSlots = {};
        multimodalSlots["intent:confirm"] = encodeURIComponent("true".replace(/\"/g, "\\\""));
        sendMultimodalAction(multimodalSlots);
    }
    DialogSPALib.processConfirmationAccept = processConfirmationAccept;
    // This function passes back confirmation reject as a string 'no' until there is support
    // in TCP to pass back structured data
    function processConfirmationReject() {
        switchFromVoiceInputToText();
        updateCortanaUIState(3 /* Thinking */ , 9 /* Thinking */ );
        var multimodalSlots = {};
        multimodalSlots["intent:reject"] = encodeURIComponent("true".replace(/\"/g, "\\\""));
        sendMultimodalAction(multimodalSlots);
    }
    DialogSPALib.processConfirmationReject = processConfirmationReject;
    // This function passes back selection index data using "ux:position_ref" slot
    function processSelectionData(selectedIndex) {
        if (selectedIndex) {
            switchFromVoiceInputToText();
            updateCortanaUIState(3 /* Thinking */ , 9 /* Thinking */ );
            var multimodalSlots = {};
            multimodalSlots["ux:position_ref"] = encodeURIComponent(selectedIndex.replace(/\"/g, "\\\""));
            sendMultimodalAction(multimodalSlots);
        } else {
            DialogSPALib.logVerboseTrace("SPADialog: processSelectionData", 0 /* Info */ , "SlotName: " + "ux:position_ref", "SlotValue found to be null or whitespace", true);
        }
    }
    DialogSPALib.processSelectionData = processSelectionData;
    // This function passes back all multimodal inputs that are to be passed to TCP
    function processAjaxCalls(multimodalSlots) {
        sendMultimodalAction(multimodalSlots);
    }
    DialogSPALib.processAjaxCalls = processAjaxCalls;
    // this function sends client structured data back to TCP
    // multimodalSlots are IStringMap of slot and value specified by TCP form
    function sendMultimodalAction(multimodalSlots) {
        ClientResolutionRequested.sendResolutionResultsToTCP(multimodalSlots, dialogTextEndpoint, t_taskFrameId, g_language, g_sessionId, g_cuRequestHeaders, ClientResolutionRequested.TurnTypePrimary);
    }
    // This function passes back time duration as a string until there is support from TCP to send
    // structured time data back
    function processTimePickerData(hoursId, minutesId, secondsId) {
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
        if (g_isSpeechInput && g_currentLuOperation != null) {
            // cancel the current LU operation
            g_currentLuOperation.cancel();
            g_currentLuOperation = null;
        }
        updateCortanaUIState(3 /* Thinking */ , 9 /* Thinking */ );
        var json = JSON.parse("{}");
        json.Hours = hoursId.value;
        json.Minutes = minutesId.value;
        json.Seconds = secondsId.value;
        var multimodalSlots = {};
        multimodalSlots["duration_ux"] = encodeURIComponent(JSON.stringify(json).replace(/\"/g, "\\\""));
        sendMultimodalAction(multimodalSlots);
    }
    DialogSPALib.processTimePickerData = processTimePickerData;

    function processHandoff() {
        handoffDialogToCortana(1 /* RelinquishUI */ );
    }
    DialogSPALib.processHandoff = processHandoff;
    // remove SPA dialog to RAF
    function handoffDialogToCortana(dialogCompleteState) {
        if (dialogCompleteState == 2 /* Error */ ) {
            updateCortanaUIState(4 /* Error */ , 8 /* Error */ );
        } else {
            updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
        }
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 0 /* Standard */ );
        }
        if (g_currentSpeakOperation != null) {
            g_currentSpeakOperation.cancel();
            g_currentSpeakOperation = null;
        }
        if (g_currentLuOperation != null) {
            g_currentLuOperation.cancel();
            g_currentLuOperation = null;
        }
        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "updateTrex", "UT", null, "", true);
        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "dialogComplete", "DC", null, "SPA Dialog completed", dialogCompleteState);
        // unregister all event handlers
        unregisterAllEventHandlers();
    }
    DialogSPALib.handoffDialogToCortana = handoffDialogToCortana;

    function processLaunchUri(launchUri, dismissApp) {
        if (!isStringNullOrEmpty(launchUri)) {
            var projectedApi = "{\"Uri\":\"action://LaunchTaskCompletionUri\",\"LaunchUri\":\"" + launchUri + "\",\"DismissOnComplete\":" + (dismissApp ? "true" : "false") + "}";
            SearchAppWrapper.CortanaApp.processNLCommandAsync(projectedApi, t_currentImpressionId).done(function() {
                handoffDialogToCortana(0 /* RetainUI */ );
            }, function() {
                DialogSPALib.logVerboseTrace("SPADialog: processLaunchUri", 0 /* Info */ , "LaunchUri: " + launchUri, "Projected API: " + projectedApi, true);
                handoffDialogToCortana(2 /* Error */ );
            });
        }
    }
    DialogSPALib.processLaunchUri = processLaunchUri;

    function isSpeakOperationInProgress() {
        return g_currentSpeakOperation != null;
    }
    DialogSPALib.isSpeakOperationInProgress = isSpeakOperationInProgress;

    function logVerboseTrace(eventName, opCode, payloadName, payloadData, isError) {
        if (isError === void 0) {
            isError = false;
        }
        if (SPAClientLoggingConfig.IsEnabled) {
            g_cortanaApp.logVerboseTrace(eventName, opCode, payloadName, payloadData, t_currentImpressionId);
        }
        if (isError) {
            SharedLogHelper.LogError(LOG_DIALOGSPA, "eventName: " + eventName + ", payloadName: " + payloadName + ", payloadData: " + payloadData + ", impressionId: " + t_currentImpressionId);
        }
    }
    DialogSPALib.logVerboseTrace = logVerboseTrace;
})(DialogSPALib || (DialogSPALib = {}));;
0;; ///<reference path="..\..\..\..\Shared\Content\Content\Script\Declarations\Shared.d.ts" />
///<reference path="..\..\..\..\Threshold\src\Content\Script\Declarations\SearchAppWrapper.d.ts" />
var ClientResolutionRequested;
(function(ClientResolutionRequested) {
    ClientResolutionRequested.TurnTypePrimary = "Primary";
    ClientResolutionRequested.TurnTypeResolution = "Resolution";
    ClientResolutionRequested.TurnTypePrimarySingleTask = "PrimarySingleTask";

    function executeResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, impressionId, locale, cuRequestHeaders) {
        if (projectedApis.length == 0) {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: no projected API found.", 0 /* Info */ , "projectedApi:" + projectedApiContext, "no projected API found.", true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
            return;
        }
        var index = 0;
        var resolverName = projectedApis[index][0];
        var projectedApiContext = projectedApis[index][1];
        var results = {};
        var callback = function(response, isSuccess) {
            // if it's success, return response. If failed, return error object in response.
            if (isSuccess) {
                // Original format.
                // {"Uri":"action://SearchLocalMusic","AlbumArtist":"kelly clarkson","MatchedMusicUri":"mswindowsmusic://play?mediaType=artistartistName=Kelly%20Clarkson","Result":0}";
                var formattedResponse = encodeURIComponent(response.replace(/\"/g, "\\\""));
                results[resolverName] = formattedResponse;
                index++;
                if (index < projectedApis.length) {
                    resolverName = projectedApis[index][0];
                    projectedApiContext = projectedApis[index][1];
                    // If there is more API, call it here. As some APIs are async, and some are synchronzed.
                    // So use callback can it simpler. APIs should callback to return value, it supports both async/sync well.
                    executeResolutionAction(resolverName, projectedApiContext, callback, impressionId);
                } else {
                    sendResolutionResultsToTCP(results, callBackUrl, taskFrameId, locale, sessionId, cuRequestHeaders, ClientResolutionRequested.TurnTypeResolution);
                }
            } else {
                // If any projected API fails, the following APIs won't be called. It post error information to server and returns error message to user.
                DialogSPALib.logVerboseTrace("ClientResolutionRequested: " + resolverName, 0 /* Info */ , "projectedApi:" + projectedApiContext, "processNLCommandAsync() failed callbackUrl: " + callBackUrl + ", error: " + response, true);
                DialogSPALib.handoffDialogToCortana(2 /* Error */ );
            }
        };
        // init first call
        executeResolutionAction(resolverName, projectedApiContext, callback, impressionId);
    }
    ClientResolutionRequested.executeResolutionActions = executeResolutionActions;

    function executeResolutionAction(resolverName, projectedApiContext, callback, impressionId) {
        // To prevent break existing features, use else block to deal with existing code.
        // If there is ClientApiWrapper in resolver name, it goes to API wrappers.
        // For example, UniqueResolverName:ClientApiWrapper
        var parsedResolverName = resolverName.split(":");
        if (parsedResolverName.length == 2 && parsedResolverName[1] == "ClientApiWrapper") {
            // As limitation of current API, the ProjectedApi parameter put both projected api and passed in data.
            // For example, {"ProjectedApi"="MockProjectedAPINamespace.MockProjectedAPI", "inputParameter1"="mockvalue"}
            var apiContext = {};
            try {
                apiContext = JSON.parse(projectedApiContext);
            } catch (error) {
                // prevent the projectedApi is not a json object for some legacy reason.
                DialogSPALib.logVerboseTrace("ClientResolutionRequested: executeResolutionAction", 0 /* Info */ , "projectedApi: " + projectedApiContext, "JSON.parse EXCEPTION: " + error.message + ", resolverName: " + resolverName, true);
                DialogSPALib.handoffDialogToCortana(2 /* Error */ );
            }
            ClientApiWrapper.executeApi(apiContext, function(projectedAPIOutput, isSuccess) {
                callback(projectedAPIOutput, isSuccess);
            }, impressionId);
        } else {
            SearchAppWrapper.CortanaApp.processNLCommandAsync(projectedApiContext, impressionId).done(function(clientResponse) {
                callback(clientResponse, true);
            }, function(error) {
                callback(error, false);
            });
        }
    }

    function sendResolutionResultsToTCP(clientResponse, callBackUrl, taskFrameId, locale, sessionId, cuRequestHeaders, turnType) {
        try {
            ajaxRequestWrapper(callBackUrl, function(url, onComplete) {
                callEndPoint(url, taskFrameId, locale, sessionId, false, clientResponse, cuRequestHeaders, turnType, onComplete);
            }, function(innerHtml) {
                return render(innerHtml);
            }, true);
        } catch (err) {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: sendResolutionResultsToTCP", 0 /* Info */ , "clientResponse:" + clientResponse, "EXCEPTION: " + err.message + ", callbackUrl: " + callBackUrl, true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
        }
    }
    ClientResolutionRequested.sendResolutionResultsToTCP = sendResolutionResultsToTCP;

    function callEndPointGet(url, impressionId, cuRequestHeaders, onSuccess) {
        if (!onSuccess) {
            return;
        }
        ajaxRequestWrapper(url, function(reqUrl, callback) {
            return CallEndPointGetInternal(reqUrl, impressionId, cuRequestHeaders, callback);
        }, onSuccess, true);
    }
    ClientResolutionRequested.callEndPointGet = callEndPointGet;

    function validateResponse(response) {
        if (!response || response.indexOf("LaunchSPA") == -1) {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: LaunchSPA not found in response", 0 /* Info */ , "", "ClientResolutionRequested validateResponse() failed", true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
            return false;
        }
        return true;
    }

    function CallEndPointGetInternal(url, impressionId, cuRequestHeaders, onSuccess) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet", 0 /* Info */ , "url:" + url, "cuRequestHeaders" + JSON.stringify(cuRequestHeaders));
        var xmlhttp = sj_gx();
        if (_w["CopyTestParameters"] !== undefined) {
            url = _w["CopyTestParameters"](_w.location.href, url);
            if (_w["CopyAndUpdateRequestDataParameter"] !== undefined) {
                url = _w["CopyAndUpdateRequestDataParameter"](url, _w.location.href);
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.timeout = 10000;
        if (cuRequestHeaders) {
            for (var i = 0; i < cuRequestHeaders.length; i++) {
                xmlhttp.setRequestHeader(cuRequestHeaders[i][0], cuRequestHeaders[i][1]);
            }
        }
        var formattedImpressionId = impressionId.replace(/-/g, '');
        xmlhttp.setRequestHeader("X-Search-IG", formattedImpressionId);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    if (validateResponse(xmlhttp.responseText)) {
                        onSuccess(xmlhttp.responseText);
                    }
                } else {
                    DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet - HTTP error", 0 /* Info */ , "url:" + url + "; http error code: " + xmlhttp.status, "ClientResolutionRequested callEndPointGet() failed", true);
                    DialogSPALib.handoffDialogToCortana(2 /* Error */ );
                }
            }
        };
        xmlhttp.onerror = function() {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet", 0 /* Info */ , "url:" + url, "ClientResolutionRequested callEndPointGet() failed", true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
        };
        xmlhttp.ontimeout = function() {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet", 0 /* Info */ , "url:" + url, "ClientResolutionRequested callEndPoint() timed out;", true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
        };
        xmlhttp.send();
    }

    function ajaxRequestWrapper(url, makeRequestFunc, onSuccess, shouldAddJsonParameter) {
        if (!onSuccess) {
            return;
        }
        var ajaxProvider = require("ajax.cortanaprovider");
        if (ajaxProvider) {
            ajaxProvider.navigate(url, function(renderUrl, callback, addJsonParamaeters) {
                var requestUrl = shouldAddJsonParameter ? addJsonParamaeters(url) : url;
                var onComplete = function(response) {
                    onSuccess(shouldAddJsonParameter ? "" : response);
                    callback(shouldAddJsonParameter ? response : "", shouldAddJsonParameter);
                };
                makeRequestFunc(requestUrl, onComplete);
            });
        } else {
            makeRequestFunc(url, onSuccess);
        }
    }

    function callEndPoint(url, taskFrameId, locale, sessionId, isSpeech, response, cuRequestHeaders, turnType, onSuccess) {
        var xmlhttp = sj_gx();
        if (_w["CopyTestParameters"] !== undefined) {
            url = _w["CopyTestParameters"](_w.location.href, url);
            if (_w["CopyAndUpdateRequestDataParameter"] !== undefined) {
                url = _w["CopyAndUpdateRequestDataParameter"](url, _w.location.href);
            }
        }
        xmlhttp.open("POST", url, true);
        var params = 'clientData=' + JSON.stringify(response);
        params += '&locale=' + locale;
        params += '&sessionId=' + sessionId;
        params += '&taskFrameId=' + taskFrameId;
        params += '&turnType=' + turnType;
        if (cuRequestHeaders) {
            for (var i = 0; i < cuRequestHeaders.length; i++) {
                xmlhttp.setRequestHeader(cuRequestHeaders[i][0], cuRequestHeaders[i][1]);
            }
        }
        xmlhttp.setRequestHeader("X-SPA-SessionId", sessionId);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.timeout = 10000;
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    if (validateResponse(xmlhttp.responseText)) {
                        onSuccess(xmlhttp.responseText);
                    }
                } else {
                    // request completed with failure error code
                    DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint - HTTP error", 0 /* Info */ , "url:" + url + "; http error code: " + xmlhttp.status, "ClientResolutionRequested callEndPoint() failed isSpeech: " + isSpeech, true);
                    DialogSPALib.handoffDialogToCortana(2 /* Error */ );
                }
            }
        };
        xmlhttp.onerror = function() {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint", 0 /* Info */ , "url:" + url, "ClientResolutionRequested callEndPoint() failed isSpeech: " + isSpeech, true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
        };
        xmlhttp.ontimeout = function() {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint", 0 /* Info */ , "url:" + url, "ClientResolutionRequested callEndPoint() timed out; isSpeech: " + isSpeech, true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
        };
        xmlhttp.send(params);
    }

    function render(innerHtml) {
        if (!innerHtml) {
            return;
        }
        var container = _ge('b_container');
        if (innerHtml == null || innerHtml == "") {
            SharedLogHelper.LogError("LOG_DIALOGSPA", "ClientResolutionRequested: innerHTML is empty");
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
        }
        if (container) {
            container.innerHTML = innerHtml;
        } else {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: render", 0 /* Info */ , "render()", "innerHTML b_container not found", true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
        }
        insertScriptsIntoDom(container);
    }
    ClientResolutionRequested.render = render;
    // removes existing scripts and insert new ones
    function insertScriptsIntoDom(source) {
        var scripts = source.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            var s = document.createElement("script");
            var sc = scripts[i];
            s.text = sc.text;
            document.body.appendChild(s);
        }
    }
})(ClientResolutionRequested || (ClientResolutionRequested = {}));; /// <reference path="..\..\..\..\Threshold\src\Content\Script\Declarations\CortanaSearch.d.ts" />
/// <reference path="..\..\..\..\Threshold\src\content\script\declarations\SearchAppWrapper.d.ts" />
// constants   
var LOG_DIALOGSPA = "DialogSPA";
var ClientApiWrapper;
(function(ClientApiWrapper) {
    var impressionId;
    // all wrapped projected API should be listed here.
    var wrappedProjectedAPIs = [
        ["SearchAppWrapper.CortanaApp.searchResultsView.deviceSearch.findAppsAsync", findAppsAsync],
        ["SearchAppWrapper.CortanaApp.searchResultsView.executeSearchAsync", executeSearchAsync],
        ["SearchAppWrapper.CortanaApp.launcher.launchUriAsync", launchUriAsync]
    ];
    // The passed in API name should be exectly match with the actual API.
    // For example, SearchAppWrapper.CortanaApp.searchResultsView.deviceSearch.findAppsAsync
    //
    // The passed in/out data have to be a string. The actual contract is decided by each wrapper.
    // 
    function executeApi(apiContext, callback, impressionIdParameter) {
        var functionObject;
        var projectedApi = apiContext.ProjectedApi;
        impressionId = impressionIdParameter;
        if (projectedApi == undefined) {
            DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */ , "projectedApi", "Couldn't found ProjectedApi parameter", true);
        } else {
            // check if API implemented or not
            var isApiFound = false;
            for (var i = 0; i < wrappedProjectedAPIs.length; i++) {
                if (projectedApi == wrappedProjectedAPIs[i][0]) {
                    functionObject = wrappedProjectedAPIs[i][1];
                    isApiFound = true;
                    break;
                }
            }
            if (isApiFound) {
                try {
                    functionObject(apiContext, callback);
                } catch (e) {
                    // If any projected API fails, the following APIs won't be called. It post error information to server and returns error message to user.
                    DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */ , "hit error:" + projectedApi, "Error on call API: " + e, true);
                    DialogSPALib.handoffDialogToCortana(2 /* Error */ );
                }
            } else {
                DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */ , "projectedApi", "The projected API \"" + projectedApi + "\" is not wrapped or case is incorrect.\r\n Implement the wrapper in ClientAPIWrapper.ts\r\n", true);
            }
        }
    }
    ClientApiWrapper.executeApi = executeApi;

    function findAppsAsync(apiContext, callback) {
        // input example:
        // {
        //   "ProjectedApi":"SearchAppWrapper.CortanaApp.searchResultsView.deviceSearch.findAppsAsync",
        //   "AppIds":["1F8B0F94.122165AE053F_j2p0p5q0044a6!App"]
        // }
        //
        // output example (included required fields only)
        // {
        //   "Result":
        //   {
        //     "1F8B0F94.122165AE053F_j2p0p5q0044a6!app":{"exists":true,"displayName":"Photos","packageFamilyName":"122165AE053F_j2p0p5q0044a6"},
        //     "microsoft.bingmaps_8wekyb3d8bbwe!appexmaps":{"exists":false}
        //   }
        // }
        SearchAppWrapper.CortanaApp.searchResultsView.deviceSearch.findAppsAsync(apiContext.AppIds, impressionId).done(function(itemMap) {
            var existenceMap = {};
            apiContext.AppIds.forEach(function(value, index, array) {
                // null is not found, and {} is found.
                if (itemMap[value] != null) {
                    existenceMap[value] = {
                        "exists": true,
                        "displayName": itemMap[value].displayName,
                        "packageFamilyName": itemMap[value].packageFamilyName
                    };
                } else {
                    existenceMap[value] = {
                        "exists": false
                    };
                }
            });
            var output = {};
            output.Result = existenceMap;
            callback(JSON.stringify(output), true);
        }, function(error) {
            callback(error, false);
        });
    }

    function executeSearchAsync(apiContext, callback) {
        var unresolvedAppNames = [];
        var resolvedAppNames = [];
        var expandedAppNames = [];
        var currentAppnameIndex = 0;
        var resolveAppName = function(appName) {
            SearchAppWrapper.CortanaApp.searchResultsView.executeSearchAsync(appName).then(function(folders) {
                if (folders && folders.apps) {
                    folders.apps.getItemsAsync(0, 10).then(function(appMap) {
                        if (appMap && appMap.resultSet.length > 0) {
                            resolvedAppNames.push(appName);
                            for (var i in appMap.resultSet) {
                                if (appMap.resultSet[i]) {
                                    expandedAppNames.push(appMap.resultSet[i].displayName);
                                }
                            }
                        } else {
                            unresolvedAppNames.push(appName);
                        }
                        // If all requested app names are processed, call callback function
                        if (currentAppnameIndex === apiContext.UnresolvedAppNames.length - 1) {
                            var res = {
                                Uri: apiContext.Uri,
                                UnresolvedAppNames: unresolvedAppNames,
                                ResolvedAppNames: expandedAppNames,
                                ResolvedApps: resolvedAppNames
                            };
                            callback(JSON.stringify(res), true);
                        } else {
                            currentAppnameIndex++;
                            resolveAppName(apiContext.UnresolvedAppNames[currentAppnameIndex]);
                        }
                    }, function(error) {
                        callback(error, false);
                    });
                }
            }, function(error) {
                callback(error, false);
            });
        };
        resolveAppName(apiContext.UnresolvedAppNames[currentAppnameIndex]);
    }

    function launchUriAsync(apiContext, callback) {
        // input example:
        // {
        //   "ProjectedApi":"SearchAppWrapper.CortanaApp.launcher.launchUriAsync",
        //   "Uri":["ms-cortana://PromptCapabilities?"]
        // }
        var uri = apiContext.Uri;
        SearchAppWrapper.CortanaApp.launcher.launchUriAsync(uri).done(function(itemMap) {
            callback("", true);
        }, function(error) {
            callback(error, false);
        });
    }
})(ClientApiWrapper || (ClientApiWrapper = {}));;
var cuRequestHeaders = [
    ["X-BM-Theme", "000000;1ba0e1"],
];
DialogSPALib.processIntermediateTurn("\u003cspeak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xmlns:mstts=\"http://www.w3.org/2001/mstts\" xml:lang=\"en-US\"\u003e\u003cmark name=\"TtsService\"/\u003e\u003cmstts:audiosegment data=\"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\"\u003eWhat was your reminder?\u003c/mstts:audiosegment\u003e\u003c/speak\u003e", "waitforuserinput", "Sensitive", "{ \"TypeId\" : \"eef2491d-6e30-44b1-962b-7a07c36d654f\", \"Topic\" : \"Short Form\", \"PrecedingContext\" : \"\",\t\"FollowingContext\" : \"\",\"Mode\" : \"OneResponse\",\t\"ApplicationName\" : \"SPA Dialog\", \"ApplicationId\" : \"e58db793-6728-4534-bbc2-726d5a449be8\",\t\"CompleteTimeout\" : 1000,\t\"IncompleteTimeout\" : 1000, \"InitialSilenceTimeout\" : 3000}", "SpeechQuery", cuRequestHeaders, "52173f4c-795f-69c5-10c0-8083187df6ad");
if (SearchAppWrapper.CortanaApp.isAmbientMode) {
    sb_de.classList.add("CortanaSPA_ambient");
};