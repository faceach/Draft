    //region Potable Cortana APIs
    // NL APIs
    /*
    HRESULT StartLanguageUnderstanding(
            [in] HSTRING cuInput,
            [out] HSTRING* operationId,
            [out, retval] Windows.Foundation.IAsyncOperationWithProgress<UINT32, INlProgressNotification*> **operation);
    */
    @JavascriptInterface
    public void startLanguageUnderstanding(final String cuInput) {
        Log.d(LOG_TAG, String.format("javascript interface. CU input: %s", cuInput));
    }
    /*
    HRESULT StartDictation(
            [in] HSTRING cuInput,
            [out] HSTRING* operationId,
            [out, retval] Windows.Foundation.IAsyncOperationWithProgress<UINT32, INlProgressNotification*> **operation);
    */
    @JavascriptInterface
    public void startDictation(final String cuInput) {
        Log.d(LOG_TAG, String.format("javascript interface. CU input: %s", cuInput));
    }
    /*
    HRESULT EndpointAudio([in] HSTRING operationId);
    */
    @JavascriptInterface
    public void endpointAudio(final String operationId) {
        Log.d(LOG_TAG, String.format("javascript interface. End point audio: %s", operationId));
    }
    /*
    HRESULT DialogComplete([in] NlDialogCompletionState completionState);
    */
    @JavascriptInterface
    public void dialogComplete(final int completionState) {
        Log.d(LOG_TAG, String.format("javascript interface. Dialog complete: %s", completionState));
    }

    // TTS APIs
    /*
    HRESULT PlayEarconAsync(
            [in] Windows.Media.Speech.Internal.EarConType earConType,
            [out, retval] Windows.Foundation.IAsyncAction** operation);
    */
    @JavascriptInterface
    public void playEarconSync(final String earConType) {
        Log.d(LOG_TAG, String.format("javascript interface. cu input: %s", earConType));
    }
    /*
    HRESULT SpeakAsync(
            [in] HSTRING ssmlData,
            [in] UINT32 trackingId,
            [out, retval] Windows.Foundation.IAsyncAction **action);
    */
    @JavascriptInterface
    public boolean speakSync(final String ssmlData) {
        Log.d(LOG_TAG, String.format("javascript interface. Speak SSML: %s", ssmlData));
        speak(ssmlData);
        return true;
    }
    /*
    HRESULT StopSpeakingAsync([out, retval] Windows.Foundation.IAsyncAction **action);
    */
    @JavascriptInterface
    public void stopSpeakingSync() {
        Log.d(LOG_TAG, String.format("javascript interface. Stop speaking"));
    }

    // UI update APIs
    /*
    HRESULT TrexUpdate([in] HSTRING trexText);
    */
    @JavascriptInterface
    public void trexUpdate(final String trexText) {
        Log.d(LOG_TAG, String.format("javascript interface. Update search input text: %s", trexText));
    }
    /*
    HRESULT PersonaUpdate([in] PersonaState personaState);
    */
    @JavascriptInterface
    public void personaUpdate(final String personaState) {
        Log.d(LOG_TAG, String.format("javascript interface. Persona state: %s", personaState));
    }
    //endregion
