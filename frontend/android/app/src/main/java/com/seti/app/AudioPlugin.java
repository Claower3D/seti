package com.seti.app;

import android.content.Context;
import android.media.AudioManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioPlugin")
public class AudioPlugin extends Plugin {

    private AudioManager audioManager;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    /**
     * Sets the audio mode to "in-communication" (for VoIP calls) or back to "normal".
     * Call this when a call starts/ends.
     */
    @PluginMethod
    public void setCallMode(PluginCall call) {
        boolean active = call.getBoolean("active", false);
        if (active) {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            // Default: speaker ON when call starts so user can hear right away
            audioManager.setSpeakerphoneOn(true);
        } else {
            audioManager.setSpeakerphoneOn(false);
            audioManager.setMode(AudioManager.MODE_NORMAL);
        }
        call.resolve();
    }

    /**
     * Toggles the speakerphone on or off during a call.
     */
    @PluginMethod
    public void setSpeakerOn(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        audioManager.setSpeakerphoneOn(enabled);
        call.resolve();
    }
}
