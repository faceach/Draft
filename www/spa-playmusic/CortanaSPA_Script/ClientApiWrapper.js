/// <reference path="..\..\..\..\Threshold\src\Content\Script\Declarations\CortanaSearch.d.ts" />
/// <reference path="..\..\..\..\Threshold\src\content\script\declarations\SearchAppWrapper.d.ts" />
// constants   
var LOG_DIALOGSPA = "DialogSPA";
var ClientApiWrapper;
(function (ClientApiWrapper) {
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
        DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */, "projectedApi:" + projectedApi, impressionIdParameter);
        impressionId = impressionIdParameter;
        if (projectedApi == undefined) {
            DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */, "projectedApi", "Couldn't found ProjectedApi parameter", true);
        }
        else {
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
                DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */, "executing API:" + projectedApi, "apiContext:" + JSON.stringify(apiContext));
                try {
                    functionObject(apiContext, callback);
                }
                catch (e) {
                    // If any projected API fails, the following APIs won't be called. It post error information to server and returns error message to user.
                    DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */, "hit error:" + projectedApi, "Error on call API: " + e, true);
                    DialogSPALib.handoffDialogToCortana(2 /* Error */);
                }
            }
            else {
                DialogSPALib.logVerboseTrace("ClientApiWrapper: executeApi", 0 /* Info */, "projectedApi", "The projected API \"" + projectedApi + "\" is not wrapped or case is incorrect.\r\n Implement the wrapper in ClientAPIWrapper.ts\r\n", true);
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
        //     "microsoft.windows.photos_8wekyb3d8bbwe!app":{"exists":true,"displayName":"Photos"},
        //     "microsoft.bingmaps_8wekyb3d8bbwe!appexmaps":{"exists":false}
        //   }
        // }
        SearchAppWrapper.CortanaApp.searchResultsView.deviceSearch.findAppsAsync(apiContext.AppIds, impressionId).done(function (itemMap) {
            var existenceMap = {};
            apiContext.AppIds.forEach(function (value, index, array) {
                // null is not found, and {} is found.
                if (itemMap[value] != null) {
                    existenceMap[value] = {
                        "exists": true,
                        "displayName": itemMap[value].displayName
                    };
                }
                else {
                    existenceMap[value] = { "exists": false };
                }
            });
            var output = {};
            output.Result = existenceMap;
            callback(JSON.stringify(output), true);
        }, function (error) {
            callback(error, false);
        });
    }
    function executeSearchAsync(apiContext, callback) {
        var unresolvedAppNames = [];
        var resolvedAppNames = [];
        var resolvedApps = {};
        var complete = false;
        apiContext.UnresolvedAppNames.forEach(function (value, index, array) {
            SearchAppWrapper.CortanaApp.searchResultsView.executeSearchAsync(value).then(function (folders) {
                if (folders && folders.apps) {
                    folders.apps.getItemsAsync(0, 1).then(function (appMap) {
                        if (appMap && appMap.resultSet.length > 0) {
                            resolvedAppNames.push(value);
                            resolvedApps[value] = appMap.resultSet[0];
                        }
                        else {
                            unresolvedAppNames.push(value);
                        }
                        // If all requested app names are processed, call callback function
                        if (!complete && ((resolvedAppNames.length + unresolvedAppNames.length) == apiContext.UnresolvedAppNames.length)) {
                            complete = true;
                            var res = { Uri: apiContext.Uri, UnresolvedAppNames: unresolvedAppNames, ResolvedAppNames: resolvedAppNames, ResolvedApps: resolvedApps };
                            callback(JSON.stringify(res), true);
                        }
                    }, function (error) {
                        callback(error, false);
                    });
                }
            }, function (error) {
                callback(error, false);
            });
        });
    }
})(ClientApiWrapper || (ClientApiWrapper = {}));
