var CUDialog;
(function(CUDialog) {
    function sendAction(response) {
        SearchAppWrapper.CortanaApp.sendAction(response.CuAction);
    }
    CUDialog.sendAction = sendAction;
})(CUDialog || (CUDialog = {}));;

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
    // Turn 0 input parameters to be cached
    var trumanEndpoint;
    var turn0CuInput;
    var turn0ImpressionId;
    // Per turn variables
    var t_currentImpressionId;
    var t_currentTurnCount;
    var t_isRequestSentToSNR;
    // constants   
    var LOG_DIALOGSPA = "DialogSPA";
    var changeSticModeFunctionName = "changeSticStateAndInputMode";
    var spaDialogSjEvtName = "AJAX.sj_evt_startspadialog";
    InitializeSPADialog();

    function InitializeSPADialog() {
        registerEventHandler("startspadialog", startSpaDialogEventHandler);
    }

    function startSpaDialogEventHandler(eventArgs) {
        initializeISpaDialogContextValues(eventArgs);
        sj_evt.fire(spaDialogSjEvtName);
    }

    /*
    cortanaSpaClientRequests, 
    "https://www.bing.com/DialogPolicy?\u0026isSpeech=0", 
    "6be07796-2a07-49c9-a994-1c7d7a9f62b5", 
    "cea4dc63-122c-c7bf-5b09-62c0092037f4", 
    "en-US", 
    0, 
    "TextQuery", 
    cuRequestHeaders
    */
    function processResolutionActionsInternal(projectedApis, callBackUrl, taskFrameId, sessionId, locale) {
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 1 /* Disabled */ , 0 /* Standard */ );
        }
        DialogSPALib.logVerboseTrace("SPADialog: processResolutionActionInternal", 0 /* Info */ , "g_currentWebviewState: " + g_currentWebviewState + " currenUIState: " + g_currentUIState + " tf id: " + taskFrameId + " impression id: " + t_currentImpressionId, "callbackUrl: " + callBackUrl + ", turnCount: " + t_currentTurnCount + ", cuRequestHeaders" + JSON.stringify(g_cuRequestHeaders));
        updateCortanaUIState(3 /* Thinking */ , 9 /* Thinking */ );
        ClientResolutionRequested.executeResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, t_currentImpressionId, locale, t_currentTurnCount, g_cuRequestHeaders);
    }

    function processIntermediateTurnInternal(ssml, postssmlAction, emotion, dictationParam) {
        DialogSPALib.logVerboseTrace("SPADialog: processIntermediateTurnInternal", 0 /* Info */ , " g_currentUIState: " + g_currentUIState + "g_isSpeechInput: " + g_isSpeechInput, "turnCount: " + t_currentTurnCount + ", postSsmlAction: " + postssmlAction + ", cuRequestHeaders" + JSON.stringify(g_cuRequestHeaders));
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

    function executeFinalActionInternal(ssml, emotion, projectedApi) {
        DialogSPALib.logVerboseTrace("SPADialog: executeFinalActionInternal", 0 /* Info */ , "g_currentWebviewState: " + g_currentWebviewState + " g_currentUIState: " + g_currentUIState, "projectedApi: " + projectedApi);
        renderSPAUX(emotion);
        var shouldHandoffDialogToCortana = true;
        if (!isStringNullOrEmpty(ssml) && g_isSpeechInput) {
            shouldHandoffDialogToCortana = false;
            updateCortanaUIState(2 /* Speaking */ , 0 /* None */ );
            g_currentSpeakOperation = ThresholdUtilities.wrapApiCall(g_spaDialogRuntime, "speakAsync", "SA", null, ssml, g_ttsCounter++);
            g_currentSpeakOperation.done(function() {
                if (g_spaDialogRuntime.changeSticStateAndInputMode) {
                    ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 0 /* Standard */ );
                }
                ThresholdUtilities.wrapSynchronousApiCall(g_cortanaApp, "dismissApp", "DA", null);
                g_currentSpeakOperation = null;
            }, function() {
                handoffDialogToCortana(2 /* Error */ );
                g_currentSpeakOperation = null;
            });
        }
        if (!isStringNullOrEmpty(projectedApi)) {
            ThresholdUtilities.wrapApiCall(g_cortanaApp, "processNLCommandAsync", "PNLC", null, projectedApi, t_currentImpressionId).done(function() {
                if (shouldHandoffDialogToCortana) {
                    handoffDialogToCortana(0 /* RetainUI */ );
                }
            }, function() {
                if (shouldHandoffDialogToCortana) {
                    handoffDialogToCortana(2 /* Error */ );
                }
            });
        } else {
            if (shouldHandoffDialogToCortana) {
                handoffDialogToCortana(0 /* RetainUI */ );
            }
        }
    }

    function executeFinalActionInternalMobile(ssml, emotion, projectedApi) {
        var ttsCompleteEvent = "ttsComplete";
        DialogSPALib.logVerboseTrace("SPADialog: executeFinalActionInternalMobile", 0 /* Info */ , "g_currentWebviewState: " + g_currentWebviewState + " g_currentUIState: " + g_currentUIState, "projectedApi: " + projectedApi);
        renderSPAUX(emotion);
        if (!isStringNullOrEmpty(ssml) && g_isSpeechInput) {
            updateCortanaUIState(2 /* Speaking */ , 0 /* None */ );
            g_currentSpeakOperation = ThresholdUtilities.wrapApiCall(g_spaDialogRuntime, "speakAsync", "SA", null, ssml, g_ttsCounter++);
            g_currentSpeakOperation.done(function() {
                if (g_spaDialogRuntime.changeSticStateAndInputMode) {
                    ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 0 /* Standard */ );
                }
                g_currentSpeakOperation = null;
                sj_evt.fire(ttsCompleteEvent);
            }, function() {
                handoffDialogToCortana(2 /* Error */ );
                g_currentSpeakOperation = null;
                sj_evt.fire(ttsCompleteEvent);
            });
        } else {
            sj_evt.fire(ttsCompleteEvent);
        }

        function ttsCompleteAction() {
            sj_evt.unbind(ttsCompleteEvent, ttsCompleteAction);
            if (!isStringNullOrEmpty(projectedApi)) {
                ThresholdUtilities.wrapApiCall(g_cortanaApp, "processNLCommandAsync", "PNLC", null, projectedApi, t_currentImpressionId).done(function() {
                    handoffDialogToCortana(0 /* RetainUI */ );
                }, function() {
                    handoffDialogToCortana(2 /* Error */ );
                });
            } else {
                handoffDialogToCortana(0 /* RetainUI */ );
            }
        }
        sj_evt.bind(ttsCompleteEvent, ttsCompleteAction, true);
    }
    // Sets emotion, udate cortana webview
    function renderSPAUX(emotion) {
        DialogSPALib.logVerboseTrace("SPADialog: renderSPAUX", 0 /* Info */ , "emotion: " + emotion, "");
        if (!isStringNullOrEmpty(emotion)) {
            ThresholdUtilities.wrapSynchronousApiCall(g_cortanaApp, "setEmotion", "SE", null, emotion, false, false);
        }
        if (g_currentWebviewState == 1 /* AppVisible */ ) {
            DialogSPALib.logVerboseTrace("SPADialog: renderSPAUX", 0 /* Info */ , "Calling ShowWebViewAsync", "");
            ThresholdUtilities.wrapApiCall(g_cortanaApp, "showWebViewAsync", "SWW", null);
        }
    }
    // Helper method for validating string
    function isStringNullOrEmpty(inputString) {
        if (inputString != null && inputString != "") {
            return false;
        }
        return true;
    }

    function initializeISpaDialogContextValues(eventArgs) {
        DialogSPALib.logVerboseTrace("SPADialog: initializeISpaDialogContextValues", 0 /* Info */ , "ISpaDialogContext", "snrConnectionUrl: " + eventArgs.snrConnectionUrl + ", impressionId: " + eventArgs.impressionId);
        turn0CuInput = eventArgs.cuInput;
        trumanEndpoint = eventArgs.snrConnectionUrl;
        turn0ImpressionId = eventArgs.impressionId;
        // set the state to thinking the first time dialog is transitioned to SPA
        g_currentUIState = 3 /* Thinking */ ;
    }

    function updateCortanaUIState(uiState, earCon) {
        DialogSPALib.logVerboseTrace("SPADialog: updateCortanaUIState", 0 /* Info */ , "cortana UI state: " + uiState, "Earcon : " + earCon);
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
        DialogSPALib.logVerboseTrace("SPADialog: processSsmlAndAction", 0 /* Info */ , "ssml:" + ssml, "postssmlaction : " + postssmlAction + ", cuRequestHeaders: " + JSON.stringify(g_cuRequestHeaders));
        if (!isStringNullOrEmpty(postssmlAction) && postssmlAction == "waitforuserinput" && g_isSpeechInput) {
            // prompt user for input and start listening
            updateCortanaUIState(2 /* Speaking */ , 0 /* None */ );
            g_currentSpeakOperation = ThresholdUtilities.wrapApiCall(g_spaDialogRuntime, "speakAsync", "SA", null, ssml, g_ttsCounter++);
            g_currentSpeakOperation.done(function() {
                g_currentSpeakOperation = null;
                processVoiceInput(dictationParam);
            }, function() {
                g_currentSpeakOperation = null;
                handoffDialogToCortana(2 /* Error */ );
            });
        }
    }

    function processMicrophoneButtonPressed(dictationParam) {
        DialogSPALib.logVerboseTrace("SPADialog: processMicrophonebuttonpressed", 0 /* Info */ , "Entering processMicrophonebuttonpressed()", "speakinprogress :" + (g_currentUIState == 2 /* Speaking */ ) + ", g_isSpeechInput: " + g_isSpeechInput + ", turnCount: " + t_currentTurnCount);
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
    // processes all speech events
    function processVoiceInput(dictationParameter) {
        DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */ , "turnCount: " + t_currentTurnCount + ", cuRequestHeaders" + JSON.stringify(g_cuRequestHeaders), "cuInput :" + turn0CuInput);
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
            if (finalResult.notificationType == 3 /* FinalResult */ ) {
                if (finalResult.finalResultNotification) {
                    var finalSr = finalResult.finalResultNotification;
                    var recoStatus = getRecoResultAndUpdateTrex(finalSr.cuOutput, true);
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput: NlProgressNotificationType", 0 /* Info */ , "FinalResult: hr = " + finalSr.operationHResult, "CuOutput reco result = " + recoStatus + " t_isRequestSentToSNR = " + (t_isRequestSentToSNR ? "true" : "false"));
                    // if the operation is successful, query truman endpoint and go to thinking state
                    // else go to idle state so the user can interact with the microphone
                    if (finalSr.operationHResult == 0 && recoStatus == "200") {
                        updateCortanaUIState(3 /* Thinking */ , 9 /* Thinking */ );
                        if (!t_isRequestSentToSNR) {
                            // this is hard coded for now we will be updating IDL and start using spa dialog context
                            ClientResolutionRequested.CallEndPointGet("https://www.bing.com/speech_render?speech=1&input=2&snrtrace=1&form=WNSBOX&cc=US&setlang=en-US", t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function(innerHtml) {
                                return ClientResolutionRequested.render(innerHtml);
                            });
                            t_isRequestSentToSNR = true;
                        }
                    } else {
                        updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
                    }
                } else {
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */ , "Speech finalResultNotification is null; turnCount: " + t_currentTurnCount, "", true);
                }
            } else {
                DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */ , "onComplete", "NlProgressNotificationType.FinalResult Event not received turnCount: " + t_currentTurnCount, true);
            }
            g_currentLuOperation = null;
        }, function onError(error) {
            DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */ , "startLanguageUnderstandingFromVoiceAsync" + "Error: " + error + ", turnCount: " + t_currentTurnCount, "", true);
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
                    DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput: NlProgressNotificationType", 0 /* Info */ , "IntermediateResult", "t_isRequestSentToSNR = " + (t_isRequestSentToSNR ? "true" : "false"));
                    if (progress.intermediateResultNotification) {
                        if (!t_isRequestSentToSNR) {
                            // this is hard coded for now we will be updating IDL and start using spa dialog context
                            ClientResolutionRequested.CallEndPointGet("https://www.bing.com/speech_render?speech=1&input=2&snrtrace=1&form=WNSBOX&cc=US&setlang=en-US", t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function(innerHtml) {
                                return ClientResolutionRequested.render(innerHtml);
                            });
                            t_isRequestSentToSNR = true;
                        }
                        var intermediate = progress.intermediateResultNotification;
                        getRecoResultAndUpdateTrex(intermediate.cuOutput);
                    } else {
                        DialogSPALib.logVerboseTrace("SPADialog: processVoiceInput", 0 /* Info */ , "Speech intermediateResultNotification is null, turnCount: " + t_currentTurnCount, "", true);
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
                DialogSPALib.logVerboseTrace("SPADialog: getRecoResultAndUpdateTrex", 0 /* Info */ , "cuOutput result: " + cuOutputJson.SrObject.RecognitionStatus, "Update trex: '" + phrase + "' isFinal: " + isFinal);
                ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "updateTrex", "UT", null, phrase, isFinal);
            }
        } else {
            DialogSPALib.logVerboseTrace("SPADialog: getRecoResultAndUpdateTrex", 0 /* Info */ , "cuOutput", "Speech cuOutput output is null isFinal: " + isFinal);
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
            return JSON.stringify(json);
        } catch (err) {
            DialogSPALib.logVerboseTrace("SPADialog: modifyCuInput", 0 /* Info */ , "cuInput:" + cuInput, "dictationPrameter: " + dictationParameter + ",Json exception: " + err.message);
            handoffDialogToCortana(2 /* Error */ );
        }
    }

    function registerEventHandler(eventName, handler) {
        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "addEventListener", "AEL", null, eventName, handler);
        g_currentEventHandlers[eventName] = handler;
    }

    function unregisterAllEventHandlers() {
        for (var eventName in g_currentEventHandlers) {
            DialogSPALib.logVerboseTrace("SPADialog: unRegisterEventHandler", 0 /* Info */ , "eventName:" + eventName, "");
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "removeEventListener", "REL", null, eventName, g_currentEventHandlers[eventName]);
        }
        g_currentEventHandlers = {};
    }

    function initGlobals(inputQueryType, turnCount, cuRequestHeaders) {
        if (cuRequestHeaders === void 0) {
            cuRequestHeaders = null;
        }
        g_isSpeechInput = isSpeechQuery(inputQueryType);
        g_currentWebviewState = g_cortanaApp.currentState;
        g_cuRequestHeaders = cuRequestHeaders;
        t_currentImpressionId = createCUImpressionId();
        t_currentTurnCount = turnCount;
        DialogSPALib.logVerboseTrace("SPADialog: InitGlobals", 0 /* Info */ , "IG:" + t_currentImpressionId, "");
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
    // process client resolution action and send data back to DialogPolicy
    function processResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, locale, turnCount, inputQueryType, cuRequestHeaders) {
        function evtAction() {
            try {
                sj_evt.unbind(spaDialogSjEvtName, evtAction);
                // unregister all event handlers from previous turn
                unregisterAllEventHandlers();
                initGlobals(inputQueryType, turnCount, cuRequestHeaders);
                processResolutionActionsInternal(projectedApis, callBackUrl, taskFrameId, sessionId, locale);
            } catch (error) {
                DialogSPALib.logVerboseTrace("SPADialog: processResolutionActions", 0 /* Info */ , "Session ID: " + sessionId, "Exception: " + error.message + ", inputQueryType: " + inputQueryType + ", turnCount: " + turnCount, true);
                handoffDialogToCortana(2 /* Error */ );
            }
        }
        sj_evt.bind(spaDialogSjEvtName, evtAction, true);
    }
    DialogSPALib.processResolutionActions = processResolutionActions;
    // execute final task action
    function executeFinalAction(ssml, emotion, projectedApi, inputQueryType, turnCount) {
        function evtAction() {
            try {
                sj_evt.unbind(spaDialogSjEvtName, evtAction);
                // unregister all event handlers from previous turn
                unregisterAllEventHandlers();
                initGlobals(inputQueryType, turnCount);
                if (g_cortanaApp.isMobile) {
                    // On mobile we need to wait for TTS before executing projected API.
                    executeFinalActionInternalMobile(ssml, emotion, projectedApi);
                } else {
                    executeFinalActionInternal(ssml, emotion, projectedApi);
                }
            } catch (error) {
                DialogSPALib.logVerboseTrace("SPADialog: executeFinalAction", 0 /* Info */ , "projectedAPI: " + projectedApi, "Exception: " + error.message + ", inputQueryType: " + inputQueryType + ", turnCount: " + turnCount, true);
                handoffDialogToCortana(2 /* Error */ );
            }
        }
        sj_evt.bind(spaDialogSjEvtName, evtAction, true);
    }
    DialogSPALib.executeFinalAction = executeFinalAction;
    // initializes dialog processing and processes intermediate turns
    function processIntermediateTurn(ssml, postssmlAction, emotion, dictationParam, inputQueryType, turnCount, cuRequestHeaders) {
        function evtAction() {
            try {
                sj_evt.unbind(spaDialogSjEvtName, evtAction);
                // unregister all event handlers from previous turn
                unregisterAllEventHandlers();
                initGlobals(inputQueryType, turnCount, cuRequestHeaders);
                processIntermediateTurnInternal(ssml, postssmlAction, emotion, dictationParam);
            } catch (error) {
                DialogSPALib.logVerboseTrace("SPADialog: processIntermediateTurn", 0 /* Info */ , "", "Exception: " + error.message + ", inputQueryType: " + inputQueryType + ", turnCount: " + turnCount + ", postSsmlAction: " + postssmlAction, true);
                handoffDialogToCortana(2 /* Error */ );
            }
        }
        sj_evt.bind(spaDialogSjEvtName, evtAction, true);
    }
    DialogSPALib.processIntermediateTurn = processIntermediateTurn;
    // This function passes back confirmation accept as a string 'yes' until there is support
    // in TCP to pass back structured data
    function processConfirmationAccept() {
        DialogSPALib.logVerboseTrace("SPADialog: processConfirmationAccept", 0 /* Info */ , "impression ID: " + t_currentImpressionId + "turn count: " + t_currentTurnCount, "snr connection URL: " + trumanEndpoint);
        var confirmUrl = "https://www.bing.com/search?q=yes&input=1";
        ClientResolutionRequested.CallEndPointGet(confirmUrl, t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function(innerHtml) {
            ClientResolutionRequested.render(innerHtml);
        });
    }
    DialogSPALib.processConfirmationAccept = processConfirmationAccept;
    // This function passes back confirmation reject as a string 'no' until there is support
    // in TCP to pass back structured data
    function processConfirmationReject() {
        DialogSPALib.logVerboseTrace("SPADialog: processConfirmationReject", 0 /* Info */ , "impression ID: " + t_currentImpressionId + "turn count: " + t_currentTurnCount, "snr connection URL: " + trumanEndpoint);
        var rejectUrl = "https://www.bing.com/search?q=no&input=1";
        ClientResolutionRequested.CallEndPointGet(rejectUrl, t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function(innerHtml) {
            ClientResolutionRequested.render(innerHtml);
        });
    }
    DialogSPALib.processConfirmationReject = processConfirmationReject;
    // This function passes back time duration as a string until there is support from TCP to send
    // structured time data back
    function processTimePickerData(hoursId, minutesId, secondsId) {
        DialogSPALib.logVerboseTrace("SPADialog: processTimePickerData", 0 /* Info */ , "impression ID: " + t_currentImpressionId + "turn count: " + t_currentTurnCount, "");
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
        var hours = (isStringNullOrEmpty(hoursId.value) || (hoursId.value == hoursId.defaultValue)) ? "" : (hoursId.value + "%20hours");
        var minutes = (isStringNullOrEmpty(minutesId.value) || (minutesId.value == minutesId.defaultValue)) ? "" : ("%20" + minutesId.value + "%20minutes");
        var seconds = (isStringNullOrEmpty(secondsId.value) || (secondsId.value == secondsId.defaultValue)) ? "" : ("%20" + secondsId.value + "%20seconds");
        var timeUrl = "https://www.bing.com/search?q=" + hours + minutes + seconds + "&input=1";
        ClientResolutionRequested.CallEndPointGet(timeUrl, t_currentImpressionId, t_currentTurnCount, g_cuRequestHeaders, function(innerHtml) {
            ClientResolutionRequested.render(innerHtml);
        });
    }
    DialogSPALib.processTimePickerData = processTimePickerData;

    function processHandoff() {
        DialogSPALib.logVerboseTrace("SPADialog: processHandoff", 0 /* Info */ , "impression ID: " + t_currentImpressionId + "; turn count: " + t_currentTurnCount, "snr connection URL: " + trumanEndpoint);
        handoffDialogToCortana(1 /* RelinquishUI */ );
    }
    DialogSPALib.processHandoff = processHandoff;
    // remove SPA dialog to RAF
    function handoffDialogToCortana(dialogCompleteState) {
        DialogSPALib.logVerboseTrace("SPADialog: handoffDialogToCortana", 0 /* Info */ , "dialogCompleteState: " + dialogCompleteState, "stic mode: enabled");
        if (dialogCompleteState == 2 /* Error */ ) {
            updateCortanaUIState(4 /* Error */ , 8 /* Error */ );
        } else {
            updateCortanaUIState(0 /* Idle */ , 0 /* None */ );
        }
        if (g_spaDialogRuntime.changeSticStateAndInputMode) {
            ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 0 /* Standard */ );
        }
        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "updateTrex", "UT", null, "", true);
        ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, "dialogComplete", "DC", null, "SPA Dialog completed", dialogCompleteState);
        // unregister all event handlers
        unregisterAllEventHandlers();
    }
    DialogSPALib.handoffDialogToCortana = handoffDialogToCortana;

    function processLaunchUri(launchUri) {
        var projectedApi = JSON.stringify({
            Uri: 'action://LaunchTaskCompletionUri',
            LaunchUri: '" + launchUri + "',
            DismissOnComplete: false
        });
        DialogSPALib.logVerboseTrace("SPADialog: processLaunchUri", 0 /* Info */ , "LaunchUri: " + launchUri, "Projected API: " + projectedApi);
        SearchAppWrapper.CortanaApp.processNLCommandAsync(projectedApi, t_currentImpressionId).done(function() {
            handoffDialogToCortana(0 /* RetainUI */ );
        }, function() {
            handoffDialogToCortana(2 /* Error */ );
        });
    }
    DialogSPALib.processLaunchUri = processLaunchUri;

    function logVerboseTrace(eventName, opCode, payloadName, payloadData, isError) {
        if (isError === void 0) {
            isError = false;
        }
        g_cortanaApp.logVerboseTrace(eventName, opCode, payloadName, payloadData, t_currentImpressionId);
        if (isError) {
            SharedLogHelper.LogError(LOG_DIALOGSPA, "eventName: " + eventName + ", payloadName: " + payloadName + ", payloadData: " + payloadData + ", impressionId: " + t_currentImpressionId);
        }
    }
    DialogSPALib.logVerboseTrace = logVerboseTrace;
})(DialogSPALib || (DialogSPALib = {}));;

var ClientResolutionRequested;
(function(ClientResolutionRequested) {
    function executeResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, impressionId, locale, turnCount, cuRequestHeaders) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: executeResolutionActions (prepare calls)", 0 /* Info */ , "projectedApi:" + projectedApiContext, "callBackUrl: " + callBackUrl + ", cuRequestHeaders: " + JSON.stringify(cuRequestHeaders));
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
            /*
            //if it''s success, return response. If failed, return error object in response.
            */
            if (isSuccess) {
                DialogSPALib.logVerboseTrace("ClientResolutionRequested: " + resolverName, 0 /* Info */ , "projectedApi:" + projectedApiContext, "resolverName: " + resolverName + ", callbackUrl: " + callBackUrl + ", clientResponse: " + response);
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
                    sendResolutionResultsToTCP(results, callBackUrl, taskFrameId, locale, sessionId, turnCount, cuRequestHeaders);
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
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: executeResolutionAction (calling one)", 0 /* Info */ , "projectedApi:" + projectedApiContext, "resolverName: " + resolverName);
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

    function sendResolutionResultsToTCP(clientResponse, callBackUrl, taskFrameId, locale, sessionId, turnCount, cuRequestHeaders) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: sendResolutionResultsToTCP", 0 /* Info */ , "clientResponse:" + clientResponse, "callbackUrl: " + callBackUrl + ", turnCount: " + turnCount + ", cuRequestHeaders: " + JSON.stringify(cuRequestHeaders));
        try {
            ajaxRequestWrapper(callBackUrl, function(url, onComplete) {
                callEndPoint(url, taskFrameId, locale, sessionId, false, clientResponse, turnCount, cuRequestHeaders, onComplete);
            }, function(innerHtml) {
                return render(innerHtml);
            }, true);
        } catch (err) {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: sendResolutionResultsToTCP", 0 /* Info */ , "clientResponse:" + clientResponse, "EXCEPTION: " + err.message + ", callbackUrl: " + callBackUrl + ", turnCount: " + turnCount, true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
        }
    }

    function CallEndPointGet(url, impressionId, turnCount, cuRequestHeaders, onSuccess) {
        if (!onSuccess) {
            return;
        }
        ajaxRequestWrapper(url, function(reqUrl, callback) {
            return CallEndPointGetInternal(reqUrl, impressionId, turnCount, cuRequestHeaders, callback);
        }, onSuccess, true);
    }
    ClientResolutionRequested.CallEndPointGet = CallEndPointGet;

    function CallEndPointGetInternal(url, impressionId, turnCount, cuRequestHeaders, onSuccess) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet", 0 /* Info */ , "url:" + url, "turnCount: " + turnCount + ", cuRequestHeaders" + JSON.stringify(cuRequestHeaders));
        var xmlhttp = sj_gx();
        xmlhttp.open("GET", url, true);
        if (cuRequestHeaders) {
            for (var i = 0; i < cuRequestHeaders.length; i++) {
                xmlhttp.setRequestHeader(cuRequestHeaders[i][0], cuRequestHeaders[i][1]);
            }
        }
        var formattedImpressionId = impressionId.replace(/-/g, '');
        xmlhttp.setRequestHeader("X-Search-IG", formattedImpressionId);
        turnCount++;
        xmlhttp.setRequestHeader("X-CU-TurnId", turnCount.toString());
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    onSuccess(xmlhttp.responseText);
                    // if returned length is 0, it should be invalid status. Report it to server side.
                    if (xmlhttp.responseText.length == 0) {
                        DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGetInternal", 0 /* Info */ , "url:" + url, "ClientResolutionRequested CallEndPointGetInternal() return 0 length content. There may be errors on server side.", true);
                    }
                } else {
                    DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet - HTTP error", 0 /* Info */ , "url:" + url + "; http error code: " + xmlhttp.status, "ClientResolutionRequested callEndPointGet() failed turnCount: " + turnCount, true);
                    DialogSPALib.handoffDialogToCortana(2 /* Error */ );
                }
            }
        };
        xmlhttp.onerror = function() {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet", 0 /* Info */ , "url:" + url, "ClientResolutionRequested callEndPointGet() failed turnCount: " + turnCount, true);
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

    function callEndPoint(url, taskFrameId, locale, sessionId, isSpeech, response, turnCount, cuRequestHeaders, onSuccess) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint", 0 /* Info */ , "url:" + url, "turnCount: " + turnCount + ", isSpeech: " + isSpeech);
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", url, true);
        var params = 'clientData=' + JSON.stringify(response);
        params += '&locale=' + locale;
        params += '&sessionId=' + sessionId;
        params += '&taskFrameId=' + taskFrameId;
        turnCount++;
        if (cuRequestHeaders) {
            for (var i = 0; i < cuRequestHeaders.length; i++) {
                xmlhttp.setRequestHeader(cuRequestHeaders[i][0], cuRequestHeaders[i][1]);
            }
        }
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.setRequestHeader("X-CU-TurnId", turnCount.toString());
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    onSuccess(xmlhttp.responseText);
                    // if returned length is 0, it should be invalid status. Report it to server side.
                    if (xmlhttp.responseText.length == 0) {
                        DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint", 0 /* Info */ , "url:" + url, "ClientResolutionRequested callEndPoint() return 0 length content. There may be errors on server side.", true);
                    }
                } else {
                    // request completed with failure error code
                    DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint - HTTP error", 0 /* Info */ , "url:" + url + "; http error code: " + xmlhttp.status, "ClientResolutionRequested callEndPoint() failed turnCount: " + turnCount + ", isSpeech: " + isSpeech, true);
                    DialogSPALib.handoffDialogToCortana(2 /* Error */ );
                }
            }
        };
        xmlhttp.onerror = function() {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint", 0 /* Info */ , "url:" + url, "ClientResolutionRequested callEndPoint() failed turnCount: " + turnCount + ", isSpeech: " + isSpeech, true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */ );
        };
        xmlhttp.ontimeout = function() {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint", 0 /* Info */ , "url:" + url, "ClientResolutionRequested callEndPoint() timed out; turnCount: " + turnCount + ", isSpeech: " + isSpeech, true);
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
})(ClientResolutionRequested || (ClientResolutionRequested = {}));;

// constants   
var LOG_DIALOGSPA = "DialogSPA";
var ClientApiWrapper;
(function(ClientApiWrapper) {
    var impressionId;
    // all wrapped projected API should be listed here.
    var wrappedPorjectedAPIs = [
        ["SearchAppWrapper.CortanaApp.searchResultsView.deviceSearch.findAppsAsync", findAppsAsync],
        ["SearchAppWrapper.CortanaApp.searchResultsView.executeSearchAsync", executeSearchAsync]
    ];
    // The passed in API name should be exectly match with the actual API.
    // For example, SearchAppWrapper.CortanaApp.searchResultsView.deviceSearch.findAppsAsync
    //
    // The passed in/out data have to be a string. The actual contract is decided by each wrapper.
    // 
    function executeApi(apiContext, callback, impressionIdParameter) {
        var functionObject;
        var projectedApi = apiContext.ProjectedApi;
        DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */ , "projectedApi:" + projectedApi, impressionIdParameter);
        impressionId = impressionIdParameter;
        if (projectedApi == undefined) {
            DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */ , "projectedApi", "Couldn't found ProjectedApi parameter", true);
        } else {
            // check if API implemented or not
            var isApiFound = false;
            for (var i = 0; i < wrappedPorjectedAPIs.length; i++) {
                if (projectedApi == wrappedPorjectedAPIs[i][0]) {
                    functionObject = wrappedPorjectedAPIs[i][1];
                    isApiFound = true;
                    break;
                }
            }
            if (isApiFound) {
                DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */ , "executing API:" + projectedApi, "apiContext:" + JSON.stringify(apiContext));
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
        var resolvedApps = {};
        var expandedAppNames = [];
        var complete = false;
        apiContext.UnresolvedAppNames.forEach(function(value, index, array) {
            SearchAppWrapper.CortanaApp.searchResultsView.executeSearchAsync(value).then(function(folders) {
                if (folders && folders.apps) {
                    folders.apps.getItemsAsync(0, 10).then(function(appMap) {
                        if (appMap && appMap.resultSet.length > 0) {
                            resolvedAppNames.push(value);
                            resolvedApps[value] = appMap.resultSet[0];
                            for (var i in appMap.resultSet) {
                                expandedAppNames.push(appMap.resultSet[i].displayName);
                            }
                        } else {
                            unresolvedAppNames.push(value);
                        }
                        // If all requested app names are processed, call callback function
                        if (!complete && ((resolvedAppNames.length + unresolvedAppNames.length) == apiContext.UnresolvedAppNames.length)) {
                            complete = true;
                            var res = {
                                Uri: apiContext.Uri,
                                UnresolvedAppNames: unresolvedAppNames,
                                ResolvedAppNames: expandedAppNames,
                                ResolvedApps: resolvedAppNames
                            };
                            callback(JSON.stringify(res), true);
                        }
                    }, function(error) {
                        callback(error, false);
                    });
                }
            }, function(error) {
                callback(error, false);
            });
        });
    }
})(ClientApiWrapper || (ClientApiWrapper = {}));;









