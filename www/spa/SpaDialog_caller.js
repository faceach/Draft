
/*
{
"CUServiceId": "FB31CC89-63D2-4296-A806-33DBA8DA56F2",
"ClientVersion": "3.0.150531",
"ConversationId": "cea4dc63-122c-c7bf-5b09-62c0092037f4",
"IsNewConversationId": false,
"SpeechLanguage": "en-us",
"ClientTaskFrame": null,
"QFClientContextTaskFrame": {
"Service": "IceWeatherAnswer"
}
}
*/
var cuRequestHeaders = [
    ["X-BM-Theme", "FFFFFF;08517b"],
    ["X-CU-RequestData", "%7b%22CUServiceId%22%3a%22FB31CC89-63D2-4296-A806-33DBA8DA56F2%22%2c%22ClientVersion%22%3a%223.0.150531%22%2c%22ConversationId%22%3a%22cea4dc63-122c-c7bf-5b09-62c0092037f4%22%2c%22IsNewConversationId%22%3afalse%2c%22SpeechLanguage%22%3a%22en-us%22%2c%22ClientTaskFrame%22%3anull%2c%22QFClientContextTaskFrame%22%3a%7b%22Service%22%3a%22IceWeatherAnswer%22%7d%7d"],
];
var cortanaSpaClientRequests = [
    [
        "LocalMusicResolver:ProcessNLCommandAsync",
        "{\
            "Uri\":\"action://SearchLocalMusic\",\
            "MediaType\":\"unknown\",\
            "MediaTitle\":\"poker face\",\
            "AlbumArtist\":\"lady gaga\",\
            "AlbumTitle\":null,\
            "MatchedMusicUri\":null,\
            "MusicImageUri\":null
        }"
    ],
    [
        "InstalledAppResolver:ClientApiWrapper",
        "{\
            "ProjectedApi\":\"SearchAppWrapper.CortanaApp.searchResultsView.deviceSearch.findAppsAsync\",\
            "AppIds\":[\"Microsoft.ZuneMusic_8wekyb3d8bbwe!Microsoft.ZuneMusic\"],\
            "Result\":null
        }"
    ],
];
DialogSPALib.processResolutionActions(
    cortanaSpaClientRequests,
    "https://www.bing.com/DialogPolicy?\u0026isSpeech=0",
    "6be07796-2a07-49c9-a994-1c7d7a9f62b5",
    "cea4dc63-122c-c7bf-5b09-62c0092037f4",
    "en-US",
    0,
    "TextQuery",
    cuRequestHeaders
);






ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 1 /* Disabled */ , 0 /* Standard */ );
ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 1 /* Disabled */ , (g_isSpeechInput) ? 1 /* ListeningOnly */ : 0 /* Standard */ );
ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 0 /* Standard */ );
ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 0 /* Standard */ );
ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 1 /* ListeningOnly */ );
ThresholdUtilities.wrapSynchronousApiCall(g_spaDialogRuntime, changeSticModeFunctionName, "CSI", null, 0 /* Enabled */ , 0 /* Standard */ );