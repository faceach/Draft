var AjaxWrapperThreshold = (function() {
    function AjaxWrapperThreshold() {}
    AjaxWrapperThreshold.applyMethodThatRequiresOpened = function(xhrObject, method, originalArguments) {
        /* send and setRequestHeader can only be done on xhr requests that are currently opened: http://www.w3.org/TR/2009/WD-XMLHttpRequest-20090820/#opened-state */
        if (xhrObject.readyState == xhrObject.OPENED) {
            method.apply(xhrObject, originalArguments);
            return true;
        }
        return false;
    };
    AjaxWrapperThreshold.wrapSend = function(originalObject, originalMethod) {
        console.log('w-ajax: wrap send.');

        var wrappedMethod = function() {
            console.log('w-ajax: 1');
            var originalArguments = arguments;
            if (!AjaxWrapperThreshold.isRequestBlocked(originalObject) && originalObject.readyState == originalObject.OPENED) {
                console.log('w-ajax: 2');
                // If we're sending to bing, we need to append custom client headers.
                // Some old Threshold app webviews do not have a SearchAppWrapper.  Those can just make the XHR call directly and hope for the best.
                if (typeof ThresholdUtilities !== "undefined" && SearchAppWrapper && SearchAppWrapper.CortanaApp && AjaxWrapperThreshold.hostIsBing(originalObject.url)) {
                    console.log('w-ajax: 3');
                    ThresholdUtilities.getCortanaHeaders(function(headers) {
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
                } else {
                    console.log('w-ajax: 4');
                    if (AjaxWrapperThreshold.hostIsBing(originalObject.url)) {
                        AjaxWrapperThreshold.setFlightHeaders(originalObject);
                    }
                    AjaxWrapperThreshold.applyMethodThatRequiresOpened(originalObject, originalMethod, originalArguments);
                }
            } else {
                console.log('w-ajax: 5');
                // If we need to block the send we simulate that we did it successfully so no retries are triggered.
                Object.defineProperties(originalObject, {
                    "readyState": {
                        get: function() {
                            return 4;
                        }
                    },
                    "status": {
                        get: function() {
                            return 200;
                        }
                    },
                    "responseText": {
                        get: function() {
                            return "";
                        }
                    },
                    "responseBody": {
                        get: function() {
                            return "";
                        }
                    }
                });
                if (originalObject.onreadystatechange) {
                    originalObject.onreadystatechange.apply(originalObject, null);
                }
            }
        };
        return wrappedMethod;
    };
    AjaxWrapperThreshold.wrapOpen = function(originalObject, originalMethod) {
        console.log('w-ajax: wrap open.');

        var wrappedMethod = function() {
            console.log('w-ajax: open');
            // We always pass through open calls, but we record the url on the object.
            originalObject.url = arguments[1];
            originalMethod.apply(originalObject, arguments);
        };
        return wrappedMethod;
    };
    AjaxWrapperThreshold.wrapSetRequestHeader = function(originalObject, originalMethod) {
        return function(headerKey, headerValue) {
            var successfulApply = AjaxWrapperThreshold.applyMethodThatRequiresOpened(originalObject, originalMethod, arguments);
            if (successfulApply) {
                var originalObjectHeaders = originalObject[AjaxWrapperThreshold.headersLocation];
                if (originalObjectHeaders[headerKey]) {
                    originalObjectHeaders[headerKey].push(headerValue);
                } else {
                    originalObjectHeaders[headerKey] = [headerValue];
                }
            }
            return successfulApply;
        };
    };
    AjaxWrapperThreshold.hostIsBing = function(url) {
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
    AjaxWrapperThreshold.blockRequestWrapper = function(originalObject) {
        var _this = this;
        return function() {
            return _this.isRequestBlocked(originalObject);
        };
    };
    AjaxWrapperThreshold.isRequestBlocked = function(originalObject) {
        return typeof SearchAppWrapper !== "undefined" && SearchAppWrapper && SearchAppWrapper.CortanaApp && !SearchAppWrapper.CortanaApp.isBingEnabled && AjaxWrapperThreshold.hostIsBing(originalObject.url);
    };
    AjaxWrapperThreshold.createAjaxWrapper = function() {
        console.log('w-ajax: initial');
        var wrappedObject = new XMLHttpRequest();
        wrappedObject[this.headersLocation] = {};
        wrappedObject.send = this.wrapSend(wrappedObject, wrappedObject.send);
        wrappedObject.open = this.wrapOpen(wrappedObject, wrappedObject.open);
        wrappedObject.setRequestHeader = this.wrapSetRequestHeader(wrappedObject, wrappedObject.setRequestHeader);
        wrappedObject.isRequestBlocked = this.blockRequestWrapper(wrappedObject);
        return wrappedObject;
    };
    AjaxWrapperThreshold.setFlightHeaders = function(request) {
        // set http headers for setting external flights
        if (typeof(_CachedFlights) !== "undefined" && _CachedFlights.sort) {
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
sj_gx_1 = function() {
    console.log('w-ajax: call');
    return AjaxWrapperThreshold.createAjaxWrapper();
};


var req = sj_gx_1();
req.open("POST", "/card/suggestion", true);
req.send();