// This file has the JS side implementation for some of the projected APIs used by proactive and other Cortana scenarios
//
//

// Create an instance of the message handler that's accessible by both
// the native side and the APIs in this file and attach it to the current window
(function(_WIN) {
    _WIN.nativeMessageHandler = new MessageHandler();

    // default Cortana Projected API handler
    var CortanaCommonHandler = 'CortanaCommon';
    var CortanaLauncherHandler = 'CortanaLauncher'
    var CortanaProactiveViewHandler = 'CortanaProactiveView'
    var CortanaSearchResultsViewHandler = 'CortanaSearchResultsView'
    var CortanaCustomizedHandler = 'CortanaCustomized'

    // Defines SearchApp as expected by proactive base page
    //
    var SearchApp = (function() {
        function SearchApp() {
            this.searchResultsView = new SearchResultsView();
            this.proactiveView = new ProactiveView();
            this.launcher = new Launcher();
            this.spaDialogRuntime = new SpaDialogRuntime();
            this.isBingEnabled = true;

            var self = this;
            getPlatformInfoAsync().then(function(results) {
                self.uiLanguage = results.uiLanguage;
            });
        }

        getPlatformInfoAsync = function getPlatformInfoAsync() {
            return callNativeAsync('getPlatformInfoAsync', CortanaCommonHandler);
        }

        SearchApp.prototype.useSmallHeader = function useSmallHeader(value) {
            callNativeVoid(
                'useSmallHeader',
                CortanaCommonHandler, {
                    value: value
                });
        };

        SearchApp.prototype.navigateWebViewAsync = function navigateWebViewAsync(uri) {
            // URI was encoded at Bing.com, to send this request again, we need to decode first
            // Otherwise URI will be encoded again at Bing.com(e.g. % -> %25 -> %2525...)
            var decodedURI = decodeURIComponent(uri);
            console.log('navigateWebViewAsync. Url:', decodedURI);
            return callNativeAsync('navigateWebViewAsync', CortanaCommonHandler, {
                uri: decodedURI
            });
        }

        SearchApp.prototype.navigateWebViewWithPostAsync = function navigateWebViewWithPostAsync(uri, parameters) {
            console.log('navigateWebViewWithPostAsync. Url %s. Params: %s', uri, parameters);
            return callNativeAsync('navigateWebViewWithPostAsync', CortanaCommonHandler, {
                uri: uri,
                parameters: parameters
            });
        }

        SearchApp.prototype.createStringMap = function createStringMap() {
            return {};
        }

        SearchApp.prototype.navigateWebViewBackAsync = function navigateWebViewBackAsync(frameCount) {
            console.log('navigateWebViewBackAsync.');
            return callNativeAsync('navigateWebViewBackAsync', CortanaCommonHandler, {
                frameCount: frameCount
            });
        }

        SearchApp.prototype.setCortanaText = function(value) {
            console.log('setCortanaText: ', value);

            callNativeVoid(
                'setCortanaText',
                CortanaCommonHandler, {
                    text: value
                });
        };

        SearchApp.prototype.notifyProfileUpdate = function() {
            callNativeVoid('notifyProfileUpdate', CortanaCommonHandler);
        };

        SearchApp.prototype.sendAction = function(msg) {
            console.log('sendAction: ', msg);

            callNativeVoid(
                'sendAction',
                CortanaCommonHandler,
                JSON.parse(msg));

            var self = this;
            var parseMsg;
            // Greeting view is hide by default
            // We need to show greeting view on L2 page while SystemAction has property "CachedQueryUri", this is a temp logic
            // We'll push Answer team call setCortanaText
            try {
                parseMsg = JSON.parse(msg);
                if (parseMsg && parseMsg.SystemAction && parseMsg.SystemAction.QueryUri) {
                    callNativeVoid('showBingSearchContent', CortanaCommonHandler);
                }
            } catch (e) {
                console.log("JSON parse action failed.");
            }
        };

        SearchApp.prototype.launchExperienceByName = function(name, args) {
            callNativeVoid(
                'launchExperienceByName',
                CortanaCommonHandler, {
                    name: name,
                    args: args
                });
        };

        SearchApp.prototype.getQueryHeadersAsync = function() {
            console.log('getQueryHeadersAsync was called');
            return callNativeAsync('getQueryHeadersAsync', CortanaCommonHandler);
        };

        SearchApp.prototype.showWebViewAsync = function() {
            console.log('showWebViewAsync was called');
            return callNativeAsync('showWebViewAsync', CortanaCommonHandler);
        };

        SearchApp.prototype.getFeedbackFilesAsync = function(feedbackFiles) {
            console.log('get feedbackFiles.');
            return callNativeAsync('getFeedbackFilesAsync', CortanaCommonHandler);

        }

        // creates a JS object
        SearchApp.prototype.createObjectMap = function() {
            return {};
        };

        SearchApp.prototype.closeFeedbackPage = function() {
            return callNativeVoid('closeFeedbackPage', CortanaCommonHandler);
        }

        var eventListeners = {};

        function triggerElement(element, index, array) {
            element();
        }

        SearchApp.prototype.addEventListener = function(eventName, cb) {
            if (eventListeners[eventName] === undefined) {
                eventListeners[eventName] = [];
            }

            eventListeners[eventName].push(cb);
        }

        SearchApp.prototype.triggerEventListener = function(eventName) {
            if (eventListeners[eventName] !== undefined) {
                eventListeners[eventName].forEach(triggerElement);
            }
        }

        SearchApp.prototype.setEmotion = function(emotion, useLargeSize, overrideSpeaking) {
            console.log('javascript interface. setEmotion called, emotion: %s', emotion);

            callNativeVoid(
                'setEmotion',
                CortanaCommonHandler, {
                    emotion: emotion
                });
        };

        function getAudioFromSSML(ssml) {
            // Ssml is formatted in XML
            // request from csp will trigger "audiosegment" in ssml
            // otherwise use standard text instead
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(ssml, 'text/xml');

            var nodeAudioSegment = xmlDoc.getElementsByTagName('audiosegment');
            var audioString = '';

            // Get the Base64 encoded audio string
            if (nodeAudioSegment.length > 0 && nodeAudioSegment[0].attributes['data']) {
                audioString = nodeAudioSegment[0].attributes['data'].value;
            }

            return audioString;
        }

        function getTextFromSSML(ssml) {
            // ssml audio string is not exist, use "text to speech" API instead.
            // Wrapper ssml into a DOM element
            var elWrapperDiv = document.createElement('div');
            elWrapperDiv.innerHTML = ssml;
            // Pick up the inner text
            var ssmlText = elWrapperDiv.innerText || '';

            return ssmlText;
        }

        // We should speak only if the web view displays the html.
        // The problem is that the respond method is invoked before the sendAction
        // therefor we store the ssml and play it only if the action is handled by the webview
        SearchApp.prototype.respond = function(ssml, postSsmlAction, smallText, mediumText, largeText) {
            console.log('javascript interface. respond called, ssml: %s, postSsmlAction: %s, smallText: %s, mediumText: %s, largeText: %s', ssml, postSsmlAction, smallText, mediumText, largeText);

            var audioString = getAudioFromSSML(ssml);
            var ssmlText;

            if (audioString) {
                callNativeVoid(
                    'respond',
                    CortanaCommonHandler, {
                        ssml: audioString
                    });
            } else {
                ssmlText = getTextFromSSML(ssml);
                if (ssmlText) {
                    callNativeVoid(
                        'respond',
                        CortanaCommonHandler, {
                            text: ssmlText
                        });
                }
            }
        };

        SearchApp.prototype.speak = function(ssml) {
            console.log('javascript interface. speak called, ssml: %s', ssml);

            var audioString = getAudioFromSSML(ssml);

            if (audioString) {
                callNativeVoid(
                    'speak',
                    CortanaCommonHandler, {
                        ssml: audioString
                    });
            }
        };

        SearchApp.prototype.shareData = function(title, content) {
            callNativeVoid(
                'shareData',
                CortanaCommonHandler, {
                    title: title,
                    content: content
                });
        };


        SearchApp.prototype.handleHTMLError = function(errorMessage) {
            console.log('javascript interface. Error message: %s', errorMessage);

            callNativeVoid(
                'handleHTMLError',
                CortanaCustomizedHandler, {
                    errorMessage: errorMessage
                });
        };

        SearchApp.prototype.setChromeState = function() {
            callNativeVoid('setChromeState', CortanaCommonHandler);
        };
    });

    var ProactiveView = (function() {
        function ProactiveView() {
            // TODO need to figure out how to bridge a property to native code
            this.entryPoint = '';
            this.perfMetrics = new PerfMetrics(CortanaProactiveViewHandler);
        }
        ProactiveView.prototype.invalidateCacheAsync = function() {
            // TODO when DSS is implemented, this should call through to invalidate its cache
            console.log('invalidateCacheAsync was called');
            return callNativeAsync('invalidateCacheAsync', CortanaProactiveViewHandler);
        };
        return ProactiveView;
    })();

    var SearchResultsView = (function() {
        // This appears to be used for MyStuff, so not relevant for iOS
        function SearchResultsView() {
            this.perfMetrics = new PerfMetrics(CortanaSearchResultsViewHandler);
        }
        return SearchResultsView;
    })();

    var PerfMetrics = (function() {
        // Conversation ID used by QF to track QF Open -> QF Closed
        // Also revved when going from myStuff -> QF, e.g. QF -> myStuff -> QF
        // Not used by iOS
        function PerfMetrics(handler) {
            this.conversationId = 'FakeConversationId'
            this.handler = handler;
        }
        PerfMetrics.prototype.lookupAsync = function(perfMetricKey) {
            // TODO: need Core UX to switch to an async implementation in order to return a correct value
            console.log("%s.PerfMetrics: lookup %d called", this.handler, perfMetricKey);

            // All values should be Javascript Date objects
            return callNativeAsync('lookupAsync', this.handler, {
                'perfMetricKey': perfMetricKey
            });
        };
        return PerfMetrics;
    })();

    var ThresholdUtilities = (function() {
        function ThresholdUtilities() {
            this.conversationId = 100;
        }
    })();

    // defines the Launcher projected APIs as expected in base page
    var Launcher = (function() {
        function Launcher() {}
        Launcher.prototype.createLaunchOptions = function() {
            console.log("Launcher: createLaunchOptions");
            callNativeVoid('createLaunchOptions', CortanaLauncherHandler);
            return null;
        };
        Launcher.prototype.createAppLaunchOptions = function() {
            // FIXME: this is a mock appLaunchOptions as we don't know the story around launching apps yet.
            //
            console.log("Launcher: createAppLaunchOptions");
            callNativeVoid('createAppLaunchOptions', CortanaLauncherHandler);
        };
        Launcher.prototype.launchSearchItemAsync = function(searchItem, options) {
            // FIXME: mock implementation.
            //
            console.log("Launcher: launchSearchItemAsync");
            return callNativeAsync('launchSearchItemAsync', CortanaLauncherHandler);
        };
        Launcher.prototype.createUriLaunchOptions = function() {
            // FIXME: mock implementation
            //
            console.log("Launcher: createUriLaunchOptions");
            callNativeVoid('createUriLaunchOptions', CortanaLauncherHandler);
            return null;
        };
        Launcher.prototype.launchUriAsync = function(uri, options) {
            console.log("Launcher: launchUriAsync");

            // send message to native code about with the arguments.
            return callNativeAsync('launchUriAsync', CortanaLauncherHandler, {
                uri: uri
            });
        };
        Launcher.prototype.startPhoneCallAsync = function(tel, name) {
            console.log("Launcher: phone call %s, %s", tel, name);

            // send message to native code about with the arguments.
            return callNativeAsync('startPhoneCallAsync', CortanaLauncherHandler, {
                tel: tel,
                name: name
            });
        };
        Launcher.prototype.launchRAFAsync = function(rawQuery, formCode, instrumentationParams) {
            return callNativeVoid('launchRAFAsync', CortanaLauncherHandler, {
                rawQuery: rawQuery,
                formCode: formCode,
                instrumentationParams: instrumentationParams
            });
        };
        Launcher.prototype.navigateReactiveViewAsync = function(rawQuery, formCode) {
            return callNativeAsync('navigateReactiveViewAsync', CortanaLauncherHandler, {
                rawQuery: rawQuery,
                formCode: formCode
            });
        };
        return Launcher;
    })();

    // SPA - dialog runtime
    var SpaDialogRuntime = (function() {
        function SpaDialogRuntime() {}
        // NL APIs
        // Doing
        SpaDialogRuntime.prototype.startLanguageUnderstanding = function(cuInput) {
            callNativeVoid('startLanguageUnderstanding', CortanaLauncherHandler, {
                cuInput: cuInput
            });
        };
        SpaDialogRuntime.prototype.startDictation = function(cuInput) {
            //cortanaObject.startDictation(cuInput);
        };
        SpaDialogRuntime.prototype.endpointAudio = function(operationId) {
            //cortanaObject.endpointAudio(operationId);
        };
        SpaDialogRuntime.prototype.dialogComplete = function(completionState) {
            //cortanaObject.dialogComplete(completionState);
        };
        // TTS APIs
        SpaDialogRuntime.prototype.playEarconAsync = function(earConType) {
            /*return new Promise(function(resolve, reject) {
                cortanaObject.playEarconSync(earConType);
                resolve(true);
            });*/
        };
        // Done
        SpaDialogRuntime.prototype.speakAsync = function(ssmlData) {
            /*return new Promise(function(resolve, reject) {
                cortanaObject.speakSync(ssmlData);
                resolve(true);
            });*/
        };
        // Done
        SpaDialogRuntime.prototype.stopSpeakingAsync = function() {
            /*return new Promise(function(resolve, reject) {
                cortanaObject.stopSpeakingSync();
                resolve(true);
            });*/
        };
        // UI update APIs
        // Doing
        SpaDialogRuntime.prototype.trexUpdate = function(trexText) {
            //cortanaObject.trexUpdate(trexText);
        };
        // Doing
        SpaDialogRuntime.prototype.personaUpdate = function(personaState) {
            //cortanaObject.personaUpdate(personaState);
        };

        return SpaDialogRuntime;
    })();

    // wrapper around MessageHandler.invoke()
    //
    function fromNative(id, err, results) {
        console.log('from native', id, err, results);

        if (_WIN.nativeMessageHandler) {
            _WIN.nativeMessageHandler.invoke(id, err, results);
        }
    }

    // wrapper around MessageHandler.callNativeVoid()
    //
    function callNativeVoid(command, handler, args) {
        if (_WIN.nativeMessageHandler) {
            _WIN.nativeMessageHandler.callNativeVoid(command, handler, args);
        }
    }

    // wrapper around MessageHandler.callNativeAsync()
    //
    function callNativeAsync(command, handler, args) {
        console.log('Calling native with args: ', args);

        if (_WIN.nativeMessageHandler) {
            return _WIN.nativeMessageHandler.callNativeAsync(command, handler, args);
        }
    }

    // create an instance of CortanaApp and attach it to current window
    // as expected by the base page
    _WIN.CortanaApp = new SearchApp();
    _WIN.fromNative = fromNative;

    // defines the browser projection used by Xiaoice
    var BrowserProjection = (function() {
        function BrowserProjection() {
        }
        BrowserProjection.prototype.handle = function(msg) {
            console.log('sendXiaoiceAction: ', msg);
            callNativeVoid(
                'sendXiaoiceAction',
                CortanaCommonHandler,
                JSON.parse(msg));
        }
        return BrowserProjection;
    })();
    _WIN.BrowserProjection = new BrowserProjection();

})(window);
