var ReminderClickAction;
(function(ReminderClickAction) {
    function createReminderAction(SPAAction, ImpressionId) {
        //var remindButton = <HTMLElement>_ge('remindButton');
        //var title = <string>_ge('remindTitle').nodeValue.toString();
        //var date = <string>_ge('remindDate').nodeValue.toString();
        //var time = <string>_ge('remindTime').nodeValue.toString();
        //remindButton.onclick = ev => {
        //    SearchAppWrapper.CortanaApp.processNLCommandAsync(SPAAction, ImpressionId);
        //};
        //navigateToNewCard("PortableCortanaReminder:PortableCortanaReminderCreate",
        //    "PortableCortanaReminderCreateViewModel",
        //    "remindButton");
        SearchAppWrapper.CortanaApp.processNLCommandAsync(SPAAction, ImpressionId);
    }
    ReminderClickAction.createReminderAction = createReminderAction;

    function cancelReminderAction() {
        navigateToNewCard("PortableCortanaReminder:PortableCortanaReminderCancel", "PortableCortanaReminderCancelViewModel", "cancelButton");
    }
    ReminderClickAction.cancelReminderAction = cancelReminderAction;

    function navigateToNewCard(viewName, viewModel, containerId) {
        Sparkle.render(viewName, {
            uiCulture: SearchAppWrapper.CortanaApp.uiLanguage,
            properties: {
                ViewModel: viewModel
            },
            viewData: {}
        }, _ge(containerId));
    }
    ReminderClickAction.navigateToNewCard = navigateToNewCard;

    function openFirstTurnSearchRemindMeToLink(url) {
        var link = _ge('legacyRecourse');
        link.onclick = function(ev) {
            openUri(url);
        };
    }
    ReminderClickAction.openFirstTurnSearchRemindMeToLink = openFirstTurnSearchRemindMeToLink;

    function openUri(uri) {
        return ThresholdUtilities.wrapApiCall(SearchAppWrapper.CortanaApp.launcher, "launchUriAsync", uri, "SearchRemindMeTo", uri).then(closeCortana);
    }

    function closeCortana() {
        SearchAppWrapper.CortanaApp.dismissApp();
    }
})(ReminderClickAction || (ReminderClickAction = {}));;

ReminderClickAction.createReminderAction("{\"Condition\":\"Time\",\"Time\":{\"Uri\":\"entity://Timex3\",\"Version\":\"2.0\",\"Tid\":65535,\"Type\":\"Date\",\"Value\":\"2016-05-21T00:00:00\"},\"Title\":{\"ProfanityMasked\":\"buy milk\",\"Uri\":\"entity://TextData\",\"Value\":\"buy milk\",\"Version\":\"2.0\"},\"Uri\":\"action://Reminder/Create\",\"Version\":\"2.0\"}", "6d8e3cc8-21fc-43c2-bdba-efb6928dad44");;

SearchAppWrapper.CortanaApp.processNLCommandAsync("{\"Condition\":\"Time\",\"Time\":{\"Uri\":\"entity://Timex3\",\"Version\":\"2.0\",\"Tid\":65535,\"Type\":\"Date\",\"Value\":\"2016-05-21T00:00:00\"},\"Title\":{\"ProfanityMasked\":\"buy milk\",\"Uri\":\"entity://TextData\",\"Value\":\"buy milk\",\"Version\":\"2.0\"},\"Uri\":\"action://Reminder/Create\",\"Version\":\"2.0\"}", "3cf379e9-ddfc-4a77-8cd4-d91bb634efb9");;