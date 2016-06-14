interface ISpaDialogRuntime {
    speakAsync(ssmlData: string, trackingId: number): IPromise<void>;
    updateGui(uiState: number): void;
    updateTrex(trexText: string, isFinal: boolean): void;
    changeSticMode(isEnabled: boolean): void;
    changeSticStateAndInputMode(sticState: SpaSticState, sticInputMode: SpaSticInputMode): void;
    startDictationAsync(cuInput: string): IPromise<INlProgressNotification>;
    startLanguageUnderstandingFromVoiceAsync(cuInput: string): IPromise<INlProgressNotification>;
    playEarconAsync(earConType: SpaEarConType): IPromise<void>;
    endpointAudio(operationId: string): void;
    dialogComplete(spaIdentifier: string, completionState: NlDialogCompletionState): void;
    addEventListener(eventName: string, handler: Function): void;
    addEventListener(eventName: "startspadialog", handler: (eventArgs: ISpaDialogContext) => void): void;
    addEventListener(eventName: "microphonebuttonpressed", handler: (eventArgs: any) => void): void;
    removeEventListener(eventName: string, handler: Function): void;
}