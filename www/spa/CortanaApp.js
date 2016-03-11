// ------------------------------------------------------------------------------
// <copyright file="SearchAppAndroid.ts" company="Microsoft Corporation">
//     Copyright (c) Microsoft Corporation. All Rights Reserved.
//     Information Contained Herein is Proprietary and Confidential.
// </copyright>
// ------------------------------------------------------------------------------
/// <reference path="Declarations\CortanaSearch.d.ts" />
/// <reference path="..\..\..\..\Shared\Content\Content\Script\Declarations\Promise.Mock.d.ts" />
/// <reference path="..\..\..\..\Shared\Content\Content\Script\Declarations\Threshold.Utilities.d.ts" />
var WrapApi;
(function (WrapApi) {
    // This method clones an object while providing a wrapMethod bridges between one implementation of a function and another.
    // We use it to make sure the object we get back from Cortana API calls can fall back to our mock implementations if Cortana APIs fail or are not implemented.
    function wrapAndroidApi(cortanaObject) {
        if (cortanaObject) {
            // we don't implement the following as QF and device search are not part of CoA
            // searchResultsView: ISearchResultsView;
            // searchBox: ISearchBox;
            cortanaObject.isCortanaEnabled = cortanaObject.getIsCortanaEnabled();
            cortanaObject.isBingEnabled = cortanaObject.getIsBingEnabled();
            cortanaObject.isMobile = cortanaObject.getIsMobile();
            cortanaObject.region = cortanaObject.getRegion(); // The country code for the current region  
            cortanaObject.uiLanguage = cortanaObject.getUiLanguage(); // the language code for localized resources  
            cortanaObject.sessionId = cortanaObject.getSessionId(); // Logged in the Client to identify App open -> App close "sessions"  
            cortanaObject.impressionId = cortanaObject.getImpressionId(); // Produced by the client & logged by the server to identify each Keystroke  
            cortanaObject.launcher = cortanaObject.launcher || {
                launchUriAsync: function (uri, options) {
                    return new Promise(function (resolve, reject) {
                        var result = cortanaObject.launchUriSync(uri, options);
                        resolve(result);
                    });
                },
                launchRAFAsync: function (rawQuery, formCode) {
                    cortanaObject.launchRAFSync(rawQuery, formCode);
                },
                startPhoneCallAsync: function (phoneNumber, displayName) {
                    return new Promise(function (resolve, reject) {
                        cortanaObject.startPhoneCallSync(phoneNumber, displayName);
                        resolve(true);
                    });
                },
                navigateReactiveViewAsync: function (rawQuery, formCode) {
                    return new Promise(function (resolve, reject) {
                        var result = false;
                        if (cortanaObject.navigateReactiveViewSync) {
                            result = cortanaObject.navigateReactiveViewSync(rawQuery, formCode);
                        }
                        resolve(result);
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
                        resolve(result);
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
                    resolve(headers);
                });
            };
            if (typeof cortanaObject.navigateWebViewSync === 'function') {
                cortanaObject.navigateWebViewAsync = function (uri) {
                    return new Promise(function (resolve, reject) {
                        cortanaObject.navigateWebViewSync(uri);
                        resolve(true);
                    });
                };
            }
            cortanaObject.navigateWebViewWithPostAsync = function (uri, parameters) {
                return new Promise(function (resolve, reject) {
                    var postDataStringified = JSON.stringify(parameters);
                    cortanaObject.navigateWebViewWithPostSync(uri, postDataStringified);
                    resolve(true);
                });
            };
            cortanaObject.navigateWebViewBackAsync = function (frameCount) {
                return new Promise(function (resolve, reject) {
                    cortanaObject.navigateWebViewBackSync(frameCount);
                    resolve(true);
                });
            };
            cortanaObject.showWebViewAsync = function () {
                return new Promise(function (resolve, reject) {
                    cortanaObject.showWebViewSync();
                    resolve(true);
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
                        resolve(base64Content);
                    });
                };
            };
            cortanaObject.getFeedbackFilesAsync = function () {
                return doneablePromise(function (resolve, reject) {
                    var data = JSON.parse(cortanaObject.getFeedbackFilesSync());
                    if (!data) {
                        reject("Get feedback files failed.");
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
                    resolve(files);
                });
            };

            // SPA - Potable Cortana
            cortanaObject.spaDialogRuntime = cortanaObject.spaDialogRuntime || {
                // NL APIs
                // Doing
                startLanguageUnderstandingFromVoiceAsync: function (cuInput) {
                    cortanaObject.startLanguageUnderstandingFromVoiceSync(cuInput);
                },
                startDictationAsync: function (cuInput) {
                    cortanaObject.startDictationSync(cuInput);
                },
                endpointAudio: function (operationId) {
                    cortanaObject.endpointAudio(operationId);
                },
                dialogComplete: function (completionState) {
                    cortanaObject.dialogComplete(completionState);
                },
                // TTS APIs
                playEarconAsync: function (earConType) {
                    return new Promise(function (resolve, reject) {
                        cortanaObject.playEarconSync(earConType);
                        resolve(true);
                    });
                },
                // Done
                speakAsync: function (ssmlData) {
                    return new Promise(function (resolve, reject) {
                        cortanaObject.speakSync(ssmlData);
                        resolve(true);
                    });
                },
                // Done
                stopSpeakingAsync: function () {
                    return new Promise(function (resolve, reject) {
                        cortanaObject.stopSpeakingSync();
                        resolve(true);
                    });
                },
                // UI update APIs
                // Doing
                updateTrex: function (trexText) {
                    cortanaObject.updateTrex(trexText);
                },
                // Doing
                updateGui: function (uiState) {
                    cortanaObject.updateGui(uiState);
                },
                changeSticMode: function(isEnabled) {
                    cortanaObject.changeSticMode(isEnabled);
                }
            };

            return cortanaObject;
        }
    }
    WrapApi.wrapAndroidApi = wrapAndroidApi;
})(WrapApi || (WrapApi = {}));
var SearchAppWrapper = {
    CortanaApp: (_w['CortanaApp'] ? WrapApi.wrapAndroidApi(_w['CortanaApp']) : _w['MockCortanaAppInstance'])
};
