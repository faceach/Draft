///<reference path="..\..\..\..\Shared\Content\Content\Script\Declarations\Shared.d.ts" />
///<reference path="..\..\..\..\Threshold\src\Content\Script\Declarations\SearchAppWrapper.d.ts" />
var ClientResolutionRequested;
(function (ClientResolutionRequested) {
    function executeResolutionActions(projectedApis, callBackUrl, taskFrameId, sessionId, impressionId, locale, turnCount, cuRequestHeaders) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: executeResolutionActions (prepare calls)", 0 /* Info */, "projectedApi:" + projectedApiContext, "callBackUrl: " + callBackUrl + ", cuRequestHeaders: " + JSON.stringify(cuRequestHeaders));
        if (projectedApis.length == 0) {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: no projected API found.", 0 /* Info */, "projectedApi:" + projectedApiContext, "no projected API found.", true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */);
            return;
        }
        var index = 0;
        var resolverName = projectedApis[index][0];
        var projectedApiContext = projectedApis[index][1];
        var results = {};
        var callback = function (response, isSuccess) {
            // if it's success, return response. If failed, return error object in response.
            if (isSuccess) {
                DialogSPALib.logVerboseTrace("ClientResolutionRequested: " + resolverName, 0 /* Info */, "projectedApi:" + projectedApiContext, "resolverName: " + resolverName + ", callbackUrl: " + callBackUrl + ", clientResponse: " + response);
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
                }
                else {
                    sendResolutionResultsToTCP(results, callBackUrl, taskFrameId, locale, sessionId, turnCount, cuRequestHeaders);
                }
            }
            else {
                // If any projected API fails, the following APIs won't be called. It post error information to server and returns error message to user.
                DialogSPALib.logVerboseTrace("ClientResolutionRequested: " + resolverName, 0 /* Info */, "projectedApi:" + projectedApiContext, "processNLCommandAsync() failed callbackUrl: " + callBackUrl + ", error: " + response, true);
                DialogSPALib.handoffDialogToCortana(2 /* Error */);
            }
        };
        // init first call
        executeResolutionAction(resolverName, projectedApiContext, callback, impressionId);
    }
    ClientResolutionRequested.executeResolutionActions = executeResolutionActions;
    function executeResolutionAction(resolverName, projectedApiContext, callback, impressionId) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: executeResolutionAction (calling one)", 0 /* Info */, "projectedApi:" + projectedApiContext, "resolverName: " + resolverName);
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
            }
            catch (error) {
                // prevent the projectedApi is not a json object for some legacy reason.
                DialogSPALib.logVerboseTrace("ClientResolutionRequested: executeResolutionAction", 0 /* Info */, "projectedApi: " + projectedApiContext, "JSON.parse EXCEPTION: " + error.message + ", resolverName: " + resolverName, true);
                DialogSPALib.handoffDialogToCortana(2 /* Error */);
            }
            ClientApiWrapper.executeApi(apiContext, function (projectedAPIOutput, isSuccess) {
                callback(projectedAPIOutput, isSuccess);
            }, impressionId);
        }
        else {
            SearchAppWrapper.CortanaApp.processNLCommandAsync(projectedApiContext, impressionId).done(function (clientResponse) {
                callback(clientResponse, true);
            }, function (error) {
                callback(error, false);
            });
        }
    }
    function sendResolutionResultsToTCP(clientResponse, callBackUrl, taskFrameId, locale, sessionId, turnCount, cuRequestHeaders) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: sendResolutionResultsToTCP", 0 /* Info */, "clientResponse:" + clientResponse, "callbackUrl: " + callBackUrl + ", turnCount: " + turnCount + ", cuRequestHeaders: " + JSON.stringify(cuRequestHeaders));
        try {
            ajaxRequestWrapper(callBackUrl, function (url, onComplete) {
                callEndPoint(url, taskFrameId, locale, sessionId, false, clientResponse, turnCount, cuRequestHeaders, onComplete);
            }, function (innerHtml) { return render(innerHtml); }, true);
        }
        catch (err) {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: sendResolutionResultsToTCP", 0 /* Info */, "clientResponse:" + clientResponse, "EXCEPTION: " + err.message + ", callbackUrl: " + callBackUrl + ", turnCount: " + turnCount, true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */);
        }
    }
    function CallEndPointGet(url, impressionId, turnCount, cuRequestHeaders, onSuccess) {
        if (!onSuccess) {
            return;
        }
        ajaxRequestWrapper(url, function (reqUrl, callback) { return CallEndPointGetInternal(reqUrl, impressionId, turnCount, cuRequestHeaders, callback); }, onSuccess, true);
    }
    ClientResolutionRequested.CallEndPointGet = CallEndPointGet;
    function CallEndPointGetInternal(url, impressionId, turnCount, cuRequestHeaders, onSuccess) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet", 0 /* Info */, "url:" + url, "turnCount: " + turnCount + ", cuRequestHeaders" + JSON.stringify(cuRequestHeaders));
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
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    onSuccess(xmlhttp.responseText);
                    // if returned length is 0, it should be invalid status. Report it to server side.
                    if (xmlhttp.responseText.length == 0) {
                        DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGetInternal", 0 /* Info */, "url:" + url, "ClientResolutionRequested CallEndPointGetInternal() return 0 length content. There may be errors on server side.", true);
                    }
                }
                else {
                    DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet - HTTP error", 0 /* Info */, "url:" + url + "; http error code: " + xmlhttp.status, "ClientResolutionRequested callEndPointGet() failed turnCount: " + turnCount, true);
                    DialogSPALib.handoffDialogToCortana(2 /* Error */);
                }
            }
        };
        xmlhttp.onerror = function () {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: CallEndPointGet", 0 /* Info */, "url:" + url, "ClientResolutionRequested callEndPointGet() failed turnCount: " + turnCount, true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */);
        };
        xmlhttp.send();
    }
    function ajaxRequestWrapper(url, makeRequestFunc, onSuccess, shouldAddJsonParameter) {
        if (!onSuccess) {
            return;
        }
        var ajaxProvider = require("ajax.cortanaprovider");
        if (ajaxProvider) {
            ajaxProvider.navigate(url, function (renderUrl, callback, addJsonParamaeters) {
                var requestUrl = shouldAddJsonParameter ? addJsonParamaeters(url) : url;
                var onComplete = function (response) {
                    onSuccess(shouldAddJsonParameter ? "" : response);
                    callback(shouldAddJsonParameter ? response : "", shouldAddJsonParameter);
                };
                makeRequestFunc(requestUrl, onComplete);
            });
        }
        else {
            makeRequestFunc(url, onSuccess);
        }
    }
    function callEndPoint(url, taskFrameId, locale, sessionId, isSpeech, response, turnCount, cuRequestHeaders, onSuccess) {
        DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint", 0 /* Info */, "url:" + url, "turnCount: " + turnCount + ", isSpeech: " + isSpeech);
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
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    onSuccess(xmlhttp.responseText);
                    // if returned length is 0, it should be invalid status. Report it to server side.
                    if (xmlhttp.responseText.length == 0) {
                        DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint", 0 /* Info */, "url:" + url, "ClientResolutionRequested callEndPoint() return 0 length content. There may be errors on server side.", true);
                    }
                }
                else {
                    // request completed with failure error code
                    DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint - HTTP error", 0 /* Info */, "url:" + url + "; http error code: " + xmlhttp.status, "ClientResolutionRequested callEndPoint() failed turnCount: " + turnCount + ", isSpeech: " + isSpeech, true);
                    DialogSPALib.handoffDialogToCortana(2 /* Error */);
                }
            }
        };
        xmlhttp.onerror = function () {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: callEndPoint", 0 /* Info */, "url:" + url, "ClientResolutionRequested callEndPoint() failed turnCount: " + turnCount + ", isSpeech: " + isSpeech, true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */);
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
            DialogSPALib.handoffDialogToCortana(2 /* Error */);
        }
        if (container) {
            container.innerHTML = innerHtml;
        }
        else {
            DialogSPALib.logVerboseTrace("ClientResolutionRequested: render", 0 /* Info */, "render()", "innerHTML b_container not found", true);
            DialogSPALib.handoffDialogToCortana(2 /* Error */);
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
})(ClientResolutionRequested || (ClientResolutionRequested = {}));
