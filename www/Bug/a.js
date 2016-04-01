/// <reference path="..\Declarations\Shared.d.ts"/>
/// <reference path="..\Declarations\Promise.d.ts"/>
/// <reference path="..\Declarations\Threshold.Utilities.d.ts"/>
/// <reference path="..\..\..\..\..\Threshold\Src\Content\Script\Declarations\SearchAppWrapper.d.ts"/>
var FailedPromise = (function () {
    function FailedPromise() {
        this.isActive = true;
        this.operation = null;
    }
    FailedPromise.prototype.then = function (onComplete, onError, onProgress) {
        this.handleError(onError);
        return this;
    };
    FailedPromise.prototype.done = function (onComplete, onError, onProgress) {
        this.handleError(onError);
    };
    FailedPromise.prototype.handleError = function (onError) {
        if (this.isActive) {
            if (onError) {
                _w.setImmediate(function () { return onError(null); });
            }
        }
    };
    FailedPromise.prototype.cancel = function () {
        this.isActive = false;
    };
    return FailedPromise;
})();
var ThresholdUtilitiesM2 = (function () {
    function ThresholdUtilitiesM2() {
        this.regExes = {};
        this.guidCleaner = /[-{}]/g;
        this.ampersandSanitizer = /&+$|((\?|&|#)&+)/g;
        this.isFirstPageStart = true;
        this.startTime = (_w.performance) ? _w.performance.timing.navigationStart : si_ST;
        this.apiSequenceNumber = 0;
        this.headersAsyncPromise = null;
        this.headersCallComplete = false;
        this.cortanaHeaders = null;
        this.themeColor = null;
        this.headersCallTimeout = 3000;
        this.headersCallbacks = [];
        // list contains supported RTL languages by Win10
        this.rtlLangs = ["ar", "dv", "fa", "he", "ku-arab", "pa-arab", "prs", "ps", "sd-arab", "syr", "ug", "ur", "qps-plocm"];
        sj_evt.bind("ajax.threshold.pageStart", sj_dm(this, this.onPageStart), 1);
    }
    ThresholdUtilitiesM2.prototype.getUrlParameter = function (url, parameterName) {
        var parameterValue = null;
        var regex = this.getParameterRegex(parameterName);
        // Match the last parameter value if there are multiples.
        // Some of our test code can keep appending parameters before and after the hash.
        var nextMatch;
        var match;
        var i = 0;
        while (nextMatch = regex.exec(url)) {
            match = nextMatch;
        }
        if (match && match.length >= 2) {
            parameterValue = match[1];
        }
        else if (parameterName === "mock") {
            // The mock parameter is often unnamed, so it's special and a bit harder to find
            parameterValue = this.getMockParameter(url);
        }
        return parameterValue;
    };
    // if parameterValue is null then it will remove  parameterName from url
    ThresholdUtilitiesM2.prototype.setUrlParameter = function (url, parameterName, parameterValue) {
        var finishedUrl = url;
        var match = this.getParameterRegex(parameterName).exec(url);
        var token = "&";
        if (match) {
            token = match[0].substring(0, 1);
            var insertStart = match.index;
            var insertEnd = match.index + match[0].length;
            // We matched an existing parameter so we either need to change the value or remove it
            finishedUrl = url.substring(0, insertStart);
            if (parameterValue) {
                finishedUrl += token + parameterName + "=" + parameterValue;
            }
            finishedUrl += url.substring(insertEnd);
        }
        else if (parameterValue) {
            // No matching parameter was found so we're going to have to add it to the end
            // But we only add something if we've been given a value
            // /devicecontent urls default to providing a hash
            // everything else expects a ?
            var isDeviceContent = this.getRegex("devicecontent");
            if (isDeviceContent.test(url)) {
                // We assume everything should be after the hash if there isn't one
                if (url.indexOf("#") < 0) {
                    token = "#";
                }
            }
            else {
                if (url.indexOf("?") < 0) {
                    token = "?";
                }
            }
            finishedUrl = url + token + parameterName + "=" + parameterValue;
        }
        return finishedUrl;
    };
    ThresholdUtilitiesM2.prototype.getDecodedQuery = function (url) {
        var source = url;
        if (!source) {
            source = _w.location.href;
        }
        var baseQuery = this.getUrlParameter(source, "q");
        if (baseQuery) {
            // process unique characters that the server otherwise would handle
            baseQuery = decodeURIComponent(baseQuery.replace(this.getRegex("\\+"), " ")).trim();
        }
        return baseQuery;
    };
    ThresholdUtilitiesM2.prototype.getUrlReadyQuery = function (query) {
        return encodeURIComponent(query).replace(this.getRegex("%20"), "+");
    };
    ThresholdUtilitiesM2.prototype.recordApiTimeDetail = function (metricLabel, methodName, timingHandle) {
        var measurementTime = new Date();
        if (metricLabel) {
            _G.ApiTimes = _G.ApiTimes || {};
            _G.ApiTimes[metricLabel] = measurementTime.getTime() - this.startTime;
        }
        if (!timingHandle) {
            timingHandle = {
                time: measurementTime,
                label: metricLabel || methodName,
                sequence: this.apiSequenceNumber++
            };
        }
        else {
            // Return new handle with the new time to preserve old timestamp
            // if caller holds a reference to the old timing handle and wants that time value.
            var h = {};
            for (var k in timingHandle) {
                if (timingHandle.hasOwnProperty(k)) {
                    h[k] = timingHandle[k];
                }
            }
            timingHandle = h;
            timingHandle.time = measurementTime;
        }
        var msWriteProfilerMark = _w.msWriteProfilerMark;
        var markLabel = timingHandle.sequence + "," + (metricLabel || timingHandle.label);
        if (msWriteProfilerMark) {
            // There is a 32 character limit for profile mark labels, any extra will be truncated.
            msWriteProfilerMark(markLabel);
        }
        if (_w.performance && performance.mark) {
            performance.mark(markLabel);
        }
        return timingHandle;
    };
    ThresholdUtilitiesM2.prototype.recordApiTime = function (metricLabel) {
        this.recordApiTimeDetail(metricLabel);
        return null;
    };
    ThresholdUtilitiesM2.prototype.uploadApiTimes = function (metricLabel) {
        var apiTimes = _G.ApiTimes;
        this.recordApiTime(metricLabel);
        if (apiTimes && typeof Log2 !== "undefined" && Log2) {
            Log2.LogEvent("CPT2", { "wt": apiTimes }, null, null, null, null, null, null);
            _G.ApiTimes = {};
        }
    };
    ThresholdUtilitiesM2.prototype.wrapSynchronousApiCall = function (o, methodName, instrumentationKey, scope) {
        var _this = this;
        var args = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            args[_i - 4] = arguments[_i];
        }
        var apiStart = this.recordApiTimeDetail((instrumentationKey) ? instrumentationKey + "S" : null, methodName);
        var returnValue;
        var instrumentApiCall = function (state, error) {
            var apiEnd = _this.recordApiTimeDetail((instrumentationKey) ? instrumentationKey + state : null, methodName, apiStart);
            var errorString = (error) ? " exception: " + error["stack"] : "";
            _this.recordApiString("ApiEnd " + state + " \t\"" + ((scope) ? scope : "") + "\"\t" + methodName + "(" + args.join(", ") + ")\t" + (apiEnd.time.getTime() - apiStart.time.getTime()) + "ms elapsed" + errorString);
        };
        try {
            returnValue = o[methodName].apply(o, args);
            instrumentApiCall("C");
        }
        catch (ex) {
            instrumentApiCall("E", ex);
            SharedLogHelper.LogError("Exception", "Failed while calling overrideMethod: " + methodName, ex);
            returnValue = null;
        }
        return returnValue;
    };
    ThresholdUtilitiesM2.prototype.wrapApiCall = function (o, methodName, instrumentationKey, scope) {
        var args = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            args[_i - 4] = arguments[_i];
        }
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        // Shove in default values for timeout and callback.  As is the TS compiler is actually passing an array to the callee which won't resolve properly in the subsequent call.
        args.splice(4, 0, 0, null);
        return this.wrapApiCallWithTimeout.apply(this, args);
    };
    ThresholdUtilitiesM2.prototype.wrapApiCallWithTimeout = function (o, methodName, instrumentationKey, scope, timeout, failureCallback) {
        var args = [];
        for (var _i = 6; _i < arguments.length; _i++) {
            args[_i - 6] = arguments[_i];
        }
        if (_w["SearchAppWrapperLogging"]) {
            return o[methodName].apply(o, args);
        }
        else {
            var thresholdUtilities = this;
            var apiStart = this.recordApiTimeDetail((instrumentationKey) ? instrumentationKey + "S" : null, methodName);
            var timeoutId;
            var returnValue;
            var instrumentApiCall = function (state, error) {
                var stackProperty = "stack";
                var apiEnd = thresholdUtilities.recordApiTimeDetail((instrumentationKey) ? instrumentationKey + state : null, methodName, apiStart);
                var errorString = (error && error[stackProperty]) ? " exception: " + error[stackProperty] : "";
                if (error && errorString === "") {
                    errorString = " Windows error: " + error.message;
                }
                thresholdUtilities.recordApiString("ApiEnd " + state + " \t\"" + ((scope) ? scope : "") + "\"\t" + methodName + "(" + args.join(", ") + ")\t" + (apiEnd.time.getTime() - apiStart.time.getTime()) + "ms elapsed" + errorString);
            };
            try {
                returnValue = o[methodName].apply(o, args);
                this.recordApiTimeDetail((instrumentationKey) ? instrumentationKey + "P" : null, methodName);
                if (timeout && timeout > 0) {
                    timeoutId = sb_st(function () {
                        if (returnValue && returnValue.cancel) {
                            returnValue.cancel();
                        }
                        instrumentApiCall("T");
                        if (failureCallback) {
                            failureCallback(null);
                        }
                    }, timeout);
                }
                returnValue.then(function (r) {
                    if (timeoutId) {
                        sb_ct(timeoutId);
                    }
                    instrumentApiCall("C");
                    return r;
                }, function (r) {
                    if (timeoutId) {
                        sb_ct(timeoutId);
                    }
                    instrumentApiCall("E", r);
                    SharedLogHelper.LogError("Exception", "Failed in overrideMethod callback: " + methodName, r);
                    if (failureCallback) {
                        failureCallback(null);
                    }
                } /* Trigger the failure if the error callback on the promise returns */);
            }
            catch (ex) {
                if (timeoutId) {
                    sb_ct(timeoutId);
                }
                instrumentApiCall("E", ex);
                SharedLogHelper.LogError("Exception", "Failed while calling overrideMethod: " + methodName, ex);
                var failedPromise = new FailedPromise();
                returnValue = failedPromise.then(null, failureCallback);
            }
            return returnValue;
        }
    };
    ThresholdUtilitiesM2.prototype.cleanGuid = function (guid) {
        var returnValue = guid;
        if (returnValue) {
            returnValue = returnValue.replace(this.guidCleaner, "");
        }
        return returnValue;
    };
    ThresholdUtilitiesM2.prototype.parseJSON = function (jsonString) {
        var jsonObject;
        var exception = null;
        // Avoid unnecessary exception handling by checking for obvious failures first
        if (jsonString) {
            try {
                jsonObject = JSON.parse(jsonString);
            }
            catch (e) {
                exception = e;
            }
        }
        if (!jsonObject) {
            console.log("Unable to parse JSON input: " + jsonString + ((exception) ? ".  Exception: " + exception : ""));
        }
        return jsonObject;
    };
    // Because of the async nature of Cortana methods, this has to be callback-driven as well
    // The method calls callback if the API call returns within *timeout* ms from being called
    ThresholdUtilitiesM2.prototype.getCortanaHeaders = function (callback, timeout) {
        var thresholdUtilities = this;
        if (this.headersCallComplete) {
            callback(this.cortanaHeaders);
            return;
        }
        if (!this.headersAsyncPromise) {
            var timeoutHandle = null;
            var cancelCallback = false;
            function resetTimeout() {
                if (timeoutHandle) {
                    sb_ct(timeoutHandle);
                    timeoutHandle = null;
                }
                thresholdUtilities.headersCallComplete = true;
            }
            function invokeCallbacks(headers) {
                if (!cancelCallback) {
                    var callbacks = thresholdUtilities.headersCallbacks;
                    var callbackCount = callbacks.length;
                    for (var i = 0; i < callbackCount; i++) {
                        callbacks[i](headers);
                    }
                }
            }
            function onHeadersCallSuccess(headers) {
                resetTimeout();
                thresholdUtilities.cortanaHeaders = headers;
                invokeCallbacks(headers);
            }
            function onHeadersCallError(err) {
                resetTimeout();
                invokeCallbacks(null);
                // BUGBUG: Add error logging as per TFS 1489906
            }
            timeoutHandle = sb_st(function () {
                invokeCallbacks(null);
                cancelCallback = true;
            }, this.headersCallTimeout);
            this.headersAsyncPromise = this.wrapApiCall(SearchAppWrapper.CortanaApp, "getQueryHeadersAsync", "GQH_", "getQueryHeaders").then(onHeadersCallSuccess, onHeadersCallError);
        }
        this.headersCallbacks.push(callback);
    };
    ThresholdUtilitiesM2.prototype.getThemeColor = function (callback, timeout) {
        var _this = this;
        var thresholdUtilities = this;
        if (this.themeColor === null) {
            this.getCortanaHeaders(function (headers) {
                processColorFromHeaders(headers);
                callback(_this.themeColor);
            });
        }
        else {
            callback(this.themeColor);
        }
        function processColorFromHeaders(headers) {
            if (this.themeColor == null && headers) {
                var value = headers["X-BM-Theme"];
                if (value) {
                    var accentColor = value.split(";")[1];
                    if (accentColor && accentColor != this._accentColor) {
                        thresholdUtilities.themeColor = "#" + accentColor;
                    }
                }
            }
        }
    };
    ThresholdUtilitiesM2.prototype.isRightToLeftLanguage = function (lang) {
        return this.rtlLangs.some(function (el) {
            lang = lang.toLocaleLowerCase();
            return lang == el || lang.indexOf(el + '-') == 0;
        });
    };
    ThresholdUtilitiesM2.prototype.setBodyLangAttributes = function (lang) {
        _d.body.setAttribute("dir", this.isRightToLeftLanguage(lang) ? "rtl" : "ltr");
        _d.body.setAttribute("lang", lang);
    };
    ThresholdUtilitiesM2.prototype.getEmptyTaskFrame = function (rawQuery) {
        return {
            CustomTaskFrame: true,
            Status: "InProgress",
            Uri: "",
            TypeId: "b89d219d-7b61-48e7-8f3c-367e4a0e631b",
            RawTextQuery: {
                Uri: "entity://TextData",
                TypeId: "ae77cbd2-cf71-438c-95b4-d3b86dc4a60e",
                State: "Filled",
                Source: "Unknown",
                ClientUpdate: false,
                Value: rawQuery,
                ProfanityMasked: rawQuery
            }
        };
    };
    ThresholdUtilitiesM2.prototype.recordApiString = function (debugString) {
        ThresholdDiagnostics.recordApiString(debugString);
    };
    ThresholdUtilitiesM2.prototype.pushOntoArray = function (mainArray, additionalContent) {
        if (mainArray && additionalContent) {
            for (var i in additionalContent) {
                mainArray.push(additionalContent[i]);
            }
        }
    };
    ThresholdUtilitiesM2.prototype.navigateTo = function (url, instItem) {
        var link = sj_ce("a", "b_hide");
        link.href = url;
        link.setAttribute("data-h", instItem.GetNamespacedKValue());
        _d.body.appendChild(link);
        link.click();
    };
    ThresholdUtilitiesM2.prototype.getParameterRegex = function (parameterName) {
        return this.getRegex("[?&#]" + parameterName.toLowerCase() + "=([^&#]*)");
    };
    ThresholdUtilitiesM2.prototype.getRegex = function (expression, caseSensitive, notGlobal) {
        var regex = this.regExes[expression];
        if (!regex) {
            regex = new RegExp(expression, ((notGlobal) ? "" : "g") + ((caseSensitive) ? "" : "i"));
            this.regExes[expression] = regex;
        }
        // Reset the match iterator
        regex.lastIndex = 0;
        return regex;
    };
    ThresholdUtilitiesM2.prototype.getMockParameter = function (url) {
        var mockParameter = null;
        var hashString = null;
        var hashIndex = url.indexOf("#");
        if (hashIndex > 0 && hashIndex < url.length - 1) {
            var parameters = url.substr(hashIndex + 1).split("&");
            // Find the one 
            var unlabeledParameters = parameters.filter(this.unlabeledParameterFilter);
            if (unlabeledParameters.length > 0) {
                mockParameter = unlabeledParameters[0];
            }
        }
        return mockParameter;
    };
    ThresholdUtilitiesM2.prototype.unlabeledParameterFilter = function (value) {
        return value.indexOf("=") < 0;
    };
    ThresholdUtilitiesM2.prototype.clearLocalCache = function () {
        this.cortanaHeaders = null;
        this.themeColor = null;
        this.headersAsyncPromise = null;
        this.headersCallComplete = false;
        this.headersCallbacks = [];
    };
    ThresholdUtilitiesM2.prototype.onPageStart = function (eventArgs) {
        console.log("onPageStart");
        if (!this.isFirstPageStart && eventArgs[1]) {
            this.startTime = eventArgs[1];
            this.clearLocalCache();
        }
        this.isFirstPageStart = false;
        sj_evt.fire("ajax.postload");
    };
    return ThresholdUtilitiesM2;
})();
_w["ThresholdUtilities"] = new ThresholdUtilitiesM2();
sj_evt.bind("threshold.pageUnload", function () {
    sj_evt.fire("unload");
}, 0);

