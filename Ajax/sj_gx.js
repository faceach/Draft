/// <reference path='../Declarations/Threshold.Utilities.d.ts' />
/// <reference path="../../../../../Threshold/src/Content/Script/Declarations/SearchAppWrapper.d.ts" />
// BUGBUG: TFS 780914: TypeScript throws build error when two ts file declare the same variable
var _w = window, _d = document, sb_ie = window["ActiveXObject"] !== undefined, sb_i6 = sb_ie && !_w["XMLHttpRequest"], _ge = function (id) { return _d.getElementById(id); }, sb_st = function (code, delay) { return setTimeout(code, delay); }, sb_rst = sb_st, sb_ct = function (id) {
    clearTimeout(id);
}, sb_gt = function () { return new Date().getTime(); }, sj_gx;
_w["sj_ce"] = function (tagName) { return _d.createElement(tagName); };
// Under certain circumstances the clientCookies script
// fails to get added from frontdoor. Declaring sk_merge
// if it isn't already defined.
if (!_w["sk_merge"]) {
    _w["sk_merge"] = function (cookieHeader) {
        _d.cookie = cookieHeader;
    };
}
var AjaxWrapperThreshold = (function () {
    function AjaxWrapperThreshold() {
    }
    AjaxWrapperThreshold.applyMethodThatRequiresOpened = function (xhrObject, method, originalArguments) {
        /* send and setRequestHeader can only be done on xhr requests that are currently opened: http://www.w3.org/TR/2009/WD-XMLHttpRequest-20090820/#opened-state */
        if (xhrObject.readyState == xhrObject.OPENED) {
            method.apply(xhrObject, originalArguments);
            return true;
        }
        return false;
    };
    AjaxWrapperThreshold.wrapSend = function (originalObject, originalMethod) {
        var wrappedMethod = function () {
            var originalArguments = arguments;
            if (!AjaxWrapperThreshold.isRequestBlocked(originalObject) && originalObject.readyState == originalObject.OPENED) {
                // If we're sending to bing, we need to append custom client headers.
                // Some old Threshold app webviews do not have a SearchAppWrapper.  Those can just make the XHR call directly and hope for the best.
                if (typeof ThresholdUtilities !== "undefined" && SearchAppWrapper && SearchAppWrapper.CortanaApp && AjaxWrapperThreshold.hostIsBing(originalObject.url)) {
                    ThresholdUtilities.getCortanaHeaders(function (headers) {
                        if (headers) {
                            var xhrHeaders = originalObject[AjaxWrapperThreshold.headersLocation];
                            for (var headerName in headers) {
                                if (headers.hasOwnProperty(headerName) && (headerName.substring(0, 2) === "X-" || AjaxWrapperThreshold.copyableHeaders.indexOf(headerName) >= 0)) {
                                    if (!xhrHeaders[headerName]) {
                                        originalObject.setRequestHeader(headerName, headers[headerName]);
                                    }
                                }
                            }
                        }
                        AjaxWrapperThreshold.setFlightHeaders(originalObject);
                        AjaxWrapperThreshold.applyMethodThatRequiresOpened(originalObject, originalMethod, originalArguments);
                    });
                }
                else {
                    if (AjaxWrapperThreshold.hostIsBing(originalObject.url)) {
                        AjaxWrapperThreshold.setFlightHeaders(originalObject);
                    }
                    AjaxWrapperThreshold.applyMethodThatRequiresOpened(originalObject, originalMethod, originalArguments);
                }
            }
            else {
                // If we need to block the send we simulate that we did it successfully so no retries are triggered.
                Object.defineProperties(originalObject, {
                    "readyState": { get: function () {
                        return 4;
                    } },
                    "status": { get: function () {
                        return 200;
                    } },
                    "responseText": { get: function () {
                        return "";
                    } },
                    "responseBody": { get: function () {
                        return "";
                    } }
                });
                if (originalObject.onreadystatechange) {
                    originalObject.onreadystatechange.apply(originalObject, null);
                }
            }
        };
        return wrappedMethod;
    };
    AjaxWrapperThreshold.wrapOpen = function (originalObject, originalMethod) {
        var wrappedMethod = function () {
            // We always pass through open calls, but we record the url on the object.
            originalObject.url = arguments[1];
            originalMethod.apply(originalObject, arguments);
        };
        return wrappedMethod;
    };
    AjaxWrapperThreshold.wrapSetRequestHeader = function (originalObject, originalMethod) {
        return function (headerKey, headerValue) {
            var successfulApply = AjaxWrapperThreshold.applyMethodThatRequiresOpened(originalObject, originalMethod, arguments);
            if (successfulApply) {
                var originalObjectHeaders = originalObject[AjaxWrapperThreshold.headersLocation];
                if (originalObjectHeaders[headerKey]) {
                    originalObjectHeaders[headerKey].push(headerValue);
                }
                else {
                    originalObjectHeaders[headerKey] = [headerValue];
                }
            }
            return successfulApply;
        };
    };
    AjaxWrapperThreshold.hostIsBing = function (url) {
        // Assume it's Bing if we can't prove otherwise
        var returnValue = true;
        AjaxWrapperThreshold.testAnchor.href = url;
        var hostName = AjaxWrapperThreshold.testAnchor.hostname;
        if (hostName && hostName.indexOf(".") > 0) {
            var matchedAnyHost = false;
            for (var i in this.bingHosts) {
                if (hostName.indexOf(this.bingHosts[i]) > 0) {
                    matchedAnyHost = true;
                    break;
                }
            }
            if (!matchedAnyHost) {
                returnValue = false;
            }
        }
        return returnValue;
    };
    AjaxWrapperThreshold.blockRequestWrapper = function (originalObject) {
        var _this = this;
        return function () {
            return _this.isRequestBlocked(originalObject);
        };
    };
    AjaxWrapperThreshold.isRequestBlocked = function (originalObject) {
        return typeof SearchAppWrapper !== "undefined" && SearchAppWrapper && SearchAppWrapper.CortanaApp && !SearchAppWrapper.CortanaApp.isBingEnabled && AjaxWrapperThreshold.hostIsBing(originalObject.url);
    };
    AjaxWrapperThreshold.createAjaxWrapper = function () {
        var wrappedObject = new XMLHttpRequest();
        wrappedObject[this.headersLocation] = {};
        wrappedObject.send = this.wrapSend(wrappedObject, wrappedObject.send);
        wrappedObject.open = this.wrapOpen(wrappedObject, wrappedObject.open);
        wrappedObject.setRequestHeader = this.wrapSetRequestHeader(wrappedObject, wrappedObject.setRequestHeader);
        wrappedObject.isRequestBlocked = this.blockRequestWrapper(wrappedObject);
        return wrappedObject;
    };
    AjaxWrapperThreshold.setFlightHeaders = function (request) {
        // set http headers for setting external flights
        if (typeof (_CachedFlights) !== "undefined" && _CachedFlights.sort) {
            var headersSet = request[AjaxWrapperThreshold.headersLocation];
            if (!headersSet[AjaxWrapperThreshold.externalExpType]) {
                request.setRequestHeader(AjaxWrapperThreshold.externalExpType, "JointCoord");
            }
            if (!headersSet[AjaxWrapperThreshold.externalExp]) {
                request.setRequestHeader(AjaxWrapperThreshold.externalExp, _CachedFlights.sort().join(","));
            }
        }
    };
    AjaxWrapperThreshold.bingHosts = [".bing.com", ".staging-bing-int.com", ".working-bing-int.com", ".bing-int.com", ".bing-exp.com"];
    AjaxWrapperThreshold.testAnchor = document.createElement("a");
    AjaxWrapperThreshold.externalExpType = "X-MSEdge-ExternalExpType";
    AjaxWrapperThreshold.externalExp = "X-MSEdge-ExternalExp";
    AjaxWrapperThreshold.headersLocation = "headers";
    AjaxWrapperThreshold.copyableHeaders = ["Authorization"];
    return AjaxWrapperThreshold;
})();
sj_gx = function () { return AjaxWrapperThreshold.createAjaxWrapper(); };
