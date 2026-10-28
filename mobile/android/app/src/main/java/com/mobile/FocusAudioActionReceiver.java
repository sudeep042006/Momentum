package com.mobile;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Manifest-declared receiver ensuring notification actions (Stop, Toggle, Mute)
 * from Android SystemUI are reliably delivered and processed even when the app is backgrounded.
 */
public class FocusAudioActionReceiver extends BroadcastReceiver {
    private static final String TAG = "FocusAudioReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        Log.i(TAG, "Focus audio action received: " + intent.getAction());
        FocusAudioModule.handleAudioAction(intent.getAction());
    }
}
