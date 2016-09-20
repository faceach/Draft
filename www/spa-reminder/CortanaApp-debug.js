var WrapApi;
(function(WrapApi) {
    function completePromise(completionFunction) {
        if (WrapApi.AndroidReturnAsync) {
            // Set a timeout to finish resolution after the current call stack of execution finished.
            sb_st(function() {
                return completionFunction();
            }, 0);
        } else {
            // To maintain current behavior, resolve synchronously.
            completionFunction();
        }
    }
    // This method clones an object while providing a wrapMethod bridges between one implementation of a function and another.
    // We use it to make sure the object we get back from Cortana API calls can fall back to our mock implementations if Cortana APIs fail or are not implemented.
    function wrapAndroidApiAsynchronousable(cortanaObject) {
        if (!cortanaObject) {
            return;
        }
        // we don't implement the following as QF and device search are not part of CoA
        // searchResultsView: ISearchResultsView;
        // searchBox: ISearchBox;

        var uniqueEventId = 1;

        function getRandomId() {
            return uniqueEventId++;
        }

        function callNativeAsync(apiName) {
            console.log('----------------------');
            console.log('callNativeAsync 1: %s', apiName);

            var params = Array.prototype.slice.call(arguments, 1);
            return new Promise(function(resolve, reject) {
                if (!apiName || typeof cortanaObject[apiName] !== 'function') {
                    completePromise(reject);
                }
                var eventId = getRandomId();
                var eventName = 'callNativeAsync_' + apiName + '_' + eventId;

                function eventHandler(jsonParams) {
                    removeEventListener(eventName, eventHandler);
                    if (!jsonParams) {
                        return;
                    }
                    var result = jsonParams.result || null;
                    if (jsonParams.status === 'resolved') {
                        resolve(result);
                    } else {
                        reject(result);
                    }
                }
                // Add event listener
                addEventListener(eventName, eventHandler);
                console.log('----------------------');
                console.log('callNativeAsync 2: %s', apiName);
                // Cal native projected API
                params.push(eventName);
                cortanaObject[apiName].apply(cortanaObject, params);
                console.log('----------------------');
                console.log('callNativeAsync 3: %s', apiName);
            });
        }
        var nativeEventListenerMap = {};

        function addEventListener(eventName, handler) {
            console.log('----------------------');
            console.log('addEventListener 1: %s', eventName);

            if (!eventName) {
                return;
            }
            console.log('----------------------');
            console.log('addEventListener 2: %s', eventName);
            if (nativeEventListenerMap[eventName] !== undefined) {
                return;
            }
            console.log('----------------------');
            console.log('addEventListener 3: %s', eventName);
            nativeEventListenerMap[eventName] = handler;
            cortanaObject.registerEventListener(eventName, "CortanaApp.triggerCortanaEventListenerFromNative");
        }

        function removeEventListener(eventName, handler) {
            console.log('----------------------');
            console.log('removeEventListener: %s', eventName);

            if (!eventName) {
                return;
            }
            if (nativeEventListenerMap[eventName] === undefined) {
                return;
            }
            delete nativeEventListenerMap[eventName];
            cortanaObject.removeEventListener(eventName);
        }
        cortanaObject.triggerCortanaEventListenerFromNative = function(eventName, params) {
            console.log('----------------------');
            console.log('triggerCortanaEventListenerFromNative: %s', eventName);
            if (!eventName) {
                return;
            }
            var eventHandler = nativeEventListenerMap[eventName];
            if (!eventHandler) {
                return;
            }
            var jsonParams = {};
            try {
                jsonParams = JSON.parse(params);
            } catch (e) {}
            if (typeof eventHandler === 'function') {
                eventHandler.call(null, jsonParams);
            }
        };
        cortanaObject.processNLCommandAsync = function(commandTaskFrame, impressionId) {
            return new Promise(function(resolve, reject) {
                var result = cortanaObject.processNLCommandSync(commandTaskFrame, impressionId);
                completePromise(function() {
                    return resolve(result);
                });
            });
        };
        cortanaObject.searchResultsView = {};
        cortanaObject.searchResultsView.executeSearchAsync = function(query) {
            return new Promise(function(resolve, reject) {
                var result = cortanaObject.executeSearchSync(query);
                completePromise(function() {
                    return resolve(result);
                });
            });
        };
        cortanaObject.searchResultsView.deviceSearch = {};
        cortanaObject.searchResultsView.deviceSearch.findAppsAsync = function(appIds, impressionId) {
            return new Promise(function(resolve, reject) {
                var appMapString = cortanaObject.findAppsSync(appIds, impressionId);
                var appMap;
                if (appMapString) {
                    try {
                        appMap = JSON.parse(appMapString);
                    } catch (e) {
                        alert(e);
                    }
                }
                completePromise(function() {
                    return resolve(appMap);
                });
            });
        };
        // SPA - Potable Cortana
        var spaEventListenerMap = {};
        cortanaObject.spaDialogRuntime = {
            // NL APIs
            startLanguageUnderstandingFromVoiceAsync: function(cuInput) {
                return new Promise(function(resolve, reject) {
                    var result = cortanaObject.startLanguageUnderstandingFromVoiceSync(cuInput);
                    completePromise(function() {
                        return resolve(result);
                    });
                });
            },
            startDictationAsync: function(cuInput) {
                return new Promise(function(resolve, reject) {
                    cortanaObject.startDictationSync(cuInput);
                    completePromise(function() {
                        return resolve(true);
                    });
                });
            },
            endpointAudio: function(operationId) {
                cortanaObject.endpointAudio(operationId);
            },
            dialogComplete: function(completionState) {
                cortanaObject.dialogComplete(completionState);
            },
            // TTS APIs
            playEarconAsync: function(earConType) {
                return new Promise(function(resolve, reject) {
                    cortanaObject.playEarconSync(earConType);
                    completePromise(function() {
                        return resolve(true);
                    });
                });
            },
            // 
            speakAsync: function(ssmlData) {
                console.log('----------------------');
                console.log('speakAsync');

                return callNativeAsync.call(null, 'speakSync', ssmlData);
            },
            // 
            stopSpeakingAsync: function() {
                return new Promise(function(resolve, reject) {
                    cortanaObject.stopSpeakingSync();
                    completePromise(function() {
                        return resolve(true);
                    });
                });
            },
            // UI update APIs
            // 
            updateTrex: function(trexText) {
                cortanaObject.updateTrex(trexText);
            },
            // 
            updateGui: function(uiState) {
                cortanaObject.updateGui(uiState);
            },
            changeSticMode: function(isEnabled) {
                cortanaObject.changeSticMode(isEnabled);
            },
            changeSticStateAndInputMode: function(spaSticState, spaSticInputMode) {
                cortanaObject.changeSticStateAndInputMode(spaSticState, spaSticInputMode);
            },
            addEventListener: function(eventName, handler) {
                if (!eventName) {
                    return;
                }
                addEventListener(eventName, handler);
            },
            removeEventListener: function(eventName, handler) {
                if (!eventName) {
                    return;
                }
                removeEventListener(eventName, handler);
            }
        };
        return cortanaObject;
    }
    WrapApi.wrapAndroidApiAsynchronousable = wrapAndroidApiAsynchronousable;
})(WrapApi || (WrapApi = {}));
var SearchAppWrapper = {
    CortanaApp: (_w['CortanaApp'] ? WrapApi.wrapAndroidApiAsynchronousable(_w['CortanaApp']) : _w['MockCortanaAppInstance'])
};