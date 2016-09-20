//<![CDATA[
// ------------------------------------------------------------------------------
// <copyright file="SearchAppAndroid.Async.ts" company="Microsoft Corporation">
//     Copyright (c) Microsoft Corporation. All Rights Reserved.
//     Information Contained Herein is Proprietary and Confidential.
// </copyright>
// ------------------------------------------------------------------------------
/// <reference path="Declarations\CortanaSearch.d.ts" />
/// <reference path="..\..\..\..\Shared\Content\Content\Script\Declarations\Promise.Mock.d.ts" />
/// <reference path="..\..\..\..\Shared\Content\Content\Script\Declarations\Threshold.Utilities.d.ts" />
var WrapApi;
(function (WrapApi) {
    function completePromise(completionFunction) {
        if (WrapApi.AndroidReturnAsync) {
            // Set a timeout to finish resolution after the current call stack of execution finished.
            sb_st(function () { return completionFunction(); }, 0);
        }
        else {
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
            var params = Array.prototype.slice.call(arguments, 1);
            return new Promise(function (resolve, reject) {
                if (!apiName || typeof cortanaObject[apiName] !== 'function') {
                    completePromise(reject);
                }
                var eventId = getRandomId();
                var eventName = 'callNativeAsync_' + apiName + '_' + eventId;
                function eventHandler(jsonParams) {
                    removeCortanaEventListener(eventName, eventHandler);
                    if (!jsonParams) {
                        return;
                    }
                    var result = jsonParams.result || null;
                    if (jsonParams.status === 'resolved') {
                        resolve(result);
                    }
                    else {
                        reject(result);
                    }
                }
                // Add event listener
                addCortanaEventListener(eventName, eventHandler);
                // Call native projected API
                params.push(eventName);
                cortanaObject[apiName].apply(cortanaObject, params);
            });
        }
        var nativeEventListenerMap = {};
        function addCortanaEventListener(eventName, handler) {
            if (!eventName) {
                return;
            }
            if (nativeEventListenerMap[eventName] !== undefined) {
                SharedLogHelper.LogWarning("addCortanaEventListener", "CoA projected API", "eventName exists");
                return;
            }
            nativeEventListenerMap[eventName] = handler;
            cortanaObject.registerEventListener(eventName, "CortanaApp.triggerCortanaEventListenerFromNative");
        }
        function removeCortanaEventListener(eventName, handler) {
            if (!eventName) {
                return;
            }
            if (nativeEventListenerMap[eventName] === undefined) {
                SharedLogHelper.LogWarning("removeCortanaEventListener", "CoA projected API", "eventName not exists");
                return;
            }
            delete nativeEventListenerMap[eventName];
            cortanaObject.removeEventListener(eventName);
        }
        cortanaObject.triggerCortanaEventListenerFromNative = function (eventName, params) {
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
            }
            catch (ex) {
                SharedLogHelper.LogError("triggerCortanaEventListenerFromNative", "CoA projected API", ex);
            }
            if (typeof eventHandler === 'function') {
                eventHandler.call(null, jsonParams);
            }
        };
        cortanaObject.isCortanaEnabled = cortanaObject.getIsCortanaEnabled();
        cortanaObject.isBingEnabled = cortanaObject.getIsBingEnabled();
        cortanaObject.isMobile = cortanaObject.getIsMobile();
        cortanaObject.region = cortanaObject.getRegion(); // The country code for the current region  
        cortanaObject.uiLanguage = cortanaObject.getUiLanguage(); // the language code for localized resources  
        cortanaObject.sessionId = cortanaObject.getSessionId(); // Logged in the Client to identify App open -> App close "sessions"  
        cortanaObject.impressionId = cortanaObject.getImpressionId(); // Produced by the client & logged by the server to identify each Keystroke  
        if (typeof cortanaObject.getCurrentState === 'function') {
            cortanaObject.currentState = cortanaObject.getCurrentState();
        }
        cortanaObject.launcher = cortanaObject.launcher || {
            launchUriAsync: function (uri, options) {
                return callNativeAsync.call(null, 'launchUriSync', uri, options);
            },
            launchRAFAsync: function (rawQuery, formCode) {
                cortanaObject.launchRAFSync(rawQuery, formCode);
            },
            startPhoneCallAsync: function (phoneNumber, displayName) {
                return new Promise(function (resolve, reject) {
                    cortanaObject.startPhoneCallSync(phoneNumber, displayName);
                    completePromise(function () { return resolve(true); });
                });
            },
            navigateReactiveViewAsync: function (rawQuery, formCode) {
                return new Promise(function (resolve, reject) {
                    var result = false;
                    if (cortanaObject.navigateReactiveViewSync) {
                        result = cortanaObject.navigateReactiveViewSync(rawQuery, formCode);
                    }
                    completePromise(function () { return resolve(result); });
                });
            }
        };
        cortanaObject.proactiveView = cortanaObject.proactiveView || {
            invalidateCacheAsync: function () {
                return new Promise(function (resolve, reject) {
                    var result = false;
                    if (cortanaObject.invalidateCacheSync) {
                        result = cortanaObject.invalidateCacheSync();
                    }
                    completePromise(function () { return resolve(result); });
                });
            },
            perfMetrics: {
                lookup: function (perfMetricKey) {
                    var result = 0;
                    if (cortanaObject.perfMetricLookup) {
                        result = cortanaObject.perfMetricLookup(perfMetricKey);
                    }
                    return new Date(result);
                }
            }
        };
        cortanaObject.getQueryHeadersAsync = function () {
            return new Promise(function (resolve, reject) {
                var headerString = cortanaObject.getQueryHeadersSync();
                var headers = JSON.parse(headerString);
                completePromise(function () { return resolve(headers); });
            });
        };
        if (typeof cortanaObject.navigateWebViewSync === 'function') {
            cortanaObject.navigateWebViewAsync = function (uri) {
                return new Promise(function (resolve, reject) {
                    cortanaObject.navigateWebViewSync(uri);
                    completePromise(function () { return resolve(true); });
                });
            };
        }
        cortanaObject.navigateWebViewWithPostAsync = function (uri, parameters) {
            return new Promise(function (resolve, reject) {
                var postDataStringified = JSON.stringify(parameters);
                cortanaObject.navigateWebViewWithPostSync(uri, postDataStringified);
                completePromise(function () { return resolve(true); });
            });
        };
        cortanaObject.navigateWebViewBackAsync = function (frameCount) {
            return new Promise(function (resolve, reject) {
                cortanaObject.navigateWebViewBackSync(frameCount);
                completePromise(function () { return resolve(true); });
            });
        };
        cortanaObject.showWebViewAsync = function () {
            return new Promise(function (resolve, reject) {
                cortanaObject.showWebViewSync();
                completePromise(function () { return resolve(true); });
            });
        };
        cortanaObject.launchExperienceByName = function (experienceName, parameters) {
            var experienceDataStringified = JSON.stringify(parameters);
            cortanaObject.launchExperienceByNameSync(experienceName, experienceDataStringified);
        };
        var eventListenerMap = {};
        function triggerElement(element, index, array) {
            element();
        }
        ;
        cortanaObject.addEventListener = function (eventName, cb) {
            if (eventListenerMap[eventName] === undefined) {
                eventListenerMap[eventName] = [];
            }
            eventListenerMap[eventName].push(cb);
        };
        cortanaObject.triggerEventListener = function (eventName) {
            if (eventListenerMap[eventName] !== undefined) {
                eventListenerMap[eventName].forEach(triggerElement);
            }
        };
        function doneablePromise(fn) {
            var promise = new Promise(fn);
            if (typeof Promise.prototype.done !== 'function') {
                promise.done = function (onFulfilled, onRejected) {
                    promise.then(onFulfilled, onRejected);
                };
            }
            return promise;
        }
        var Screenshot = function (fileName, content, type) {
            this.fileName = fileName;
            this.contentType = type;
            var base64Content = content;
            this.getBase64ContentAsync = function () {
                return doneablePromise(function (resolve, reject) {
                    completePromise(function () { return resolve(base64Content); });
                });
            };
        };
        cortanaObject.getFeedbackFilesAsync = function () {
            return doneablePromise(function (resolve, reject) {
                var data = JSON.parse(cortanaObject.getFeedbackFilesSync());
                if (!data) {
                    completePromise(function () { return reject("Get feedback files failed."); });
                    return;
                }
                var screenshots = data.screenshots;
                var files = {};
                var i = 0;
                var iLength = 0;
                if (screenshots && screenshots.length > 0) {
                    for (i = 0, iLength = screenshots.length; i < iLength; i++) {
                        files[i] = new Screenshot(screenshots[i].fileName, screenshots[i].content, screenshots[i].type);
                    }
                }
                files['size'] = iLength;
                completePromise(function () { return resolve(files); });
            });
        };
        //TFS 5227831: [CoA] In order to support proactive peek, implement cortanaApp.logMeasure() and cortanaApp.setNonAnimatingCortanaText(…)
        cortanaObject.logMeasure = function () {
        };
        cortanaObject.setNonAnimatingCortanaText = function () {
        };
        cortanaObject.processNLCommandAsync = function (commandTaskFrame, impressionId) {
            return new Promise(function (resolve, reject) {
                var result = cortanaObject.processNLCommandSync(commandTaskFrame, impressionId);
                completePromise(function () { return resolve(result); });
            });
        };
        cortanaObject.searchResultsView = {};
        cortanaObject.searchResultsView.executeSearchAsync = function (query) {
            return new Promise(function (resolve, reject) {
                var result = cortanaObject.executeSearchSync(query);
                completePromise(function () { return resolve(result); });
            });
        };
        cortanaObject.searchResultsView.deviceSearch = {};
        cortanaObject.searchResultsView.deviceSearch.findAppsAsync = function (appIds, impressionId) {
            return new Promise(function (resolve, reject) {
                var appMapString = cortanaObject.findAppsSync(appIds, impressionId);
                var appMap;
                if (appMapString) {
                    try {
                        appMap = JSON.parse(appMapString);
                    }
                    catch (e) {
                        alert(e);
                    }
                }
                completePromise(function () { return resolve(appMap); });
            });
        };
        // SPA - Potable Cortana
        cortanaObject.spaDialogRuntime = {
            // NL APIs
            startLanguageUnderstandingFromVoiceAsync: function (cuInput) {
                return new Promise(function (resolve, reject) {
                    var result = cortanaObject.startLanguageUnderstandingFromVoiceSync(cuInput);
                    completePromise(function () { return resolve(result); });
                });
            },
            startDictationAsync: function (cuInput) {
                return new Promise(function (resolve, reject) {
                    cortanaObject.startDictationSync(cuInput);
                    completePromise(function () { return resolve(true); });
                });
            },
            endpointAudio: function (operationId) {
                cortanaObject.endpointAudio(operationId);
            },
            dialogComplete: function (spaIdentifier, completionState) {
                cortanaObject.dialogComplete(spaIdentifier, completionState);
            },
            // TTS APIs
            playEarconAsync: function (earConType) {
                return new Promise(function (resolve, reject) {
                    cortanaObject.playEarconSync(earConType);
                    completePromise(function () { return resolve(true); });
                });
            },
            // 
            speakAsync: function (ssmlData) {
                return callNativeAsync.call(null, 'speakSync', ssmlData);
            },
            // 
            stopSpeakingAsync: function () {
                return new Promise(function (resolve, reject) {
                    cortanaObject.stopSpeakingSync();
                    completePromise(function () { return resolve(true); });
                });
            },
            // UI update APIs
            // 
            updateTrex: function (trexText) {
                cortanaObject.updateTrex(trexText);
            },
            // 
            updateGui: function (uiState) {
                cortanaObject.updateGui(uiState);
            },
            changeSticMode: function (isEnabled) {
                cortanaObject.changeSticMode(isEnabled);
            },
            changeSticStateAndInputMode: function (spaSticState, spaSticInputMode) {
                cortanaObject.changeSticStateAndInputMode(spaSticState, spaSticInputMode);
            },
            addEventListener: function (eventName, handler) {
                if (!eventName) {
                    return;
                }
                addCortanaEventListener(eventName, handler);
            },
            removeEventListener: function (eventName, handler) {
                if (!eventName) {
                    return;
                }
                removeCortanaEventListener(eventName, handler);
            }
        };
        return cortanaObject;
    }
    WrapApi.wrapAndroidApiAsynchronousable = wrapAndroidApiAsynchronousable;
})(WrapApi || (WrapApi = {}));
var SearchAppWrapper = {
    CortanaApp: (_w['CortanaApp'] ? WrapApi.wrapAndroidApiAsynchronousable(_w['CortanaApp']) : _w['MockCortanaAppInstance'])
};
;///<reference path="..\Declarations\Shared.d.ts"/>
var sj_b = _d.body;
;///<reference path="queue.ts"/>
BM.trigger();
;_G.AppVer="8_1_2_5107730";
//]]>