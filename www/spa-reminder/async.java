
        // Without a apeak finish event for now -> 5 seconds waiting for Cortana to finish speaking ssml.
        // TODO: support tts stop event
        Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                final JSONObject jsonCallback = new JSONObject();
                try {
                    jsonCallback.put("status", "resolved");
                } catch (JSONException e) {
                    Log.e(LOG_TAG, "failed to create JSON", e);
                }
                jsEventHandler.getInstance().triggerEvent(jsEventHandler.jsEvent.CALLNATIVEASYNC_SPEAKSYNC, jsonCallback);
            }
        }, 5000);


        private static final String USER_AGENT_FORMAT = "%s Cortana/7.0.0.0 VersionCode/%d ROM/%s";
