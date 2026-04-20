package com.seti.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioPlugin")
public class AudioPlugin extends Plugin {

    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest; // API 26+

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    /**
     * Activates or deactivates VoIP call audio mode.
     * - active=true  → MODE_IN_COMMUNICATION + request audio focus + speaker ON
     * - active=false → MODE_NORMAL + abandon audio focus + speaker OFF
     */
    @PluginMethod
    public void setCallMode(PluginCall call) {
        boolean active = call.getBoolean("active", false);

        if (active) {
            requestAudioFocus();
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.setSpeakerphoneOn(true);
        } else {
            audioManager.setSpeakerphoneOn(false);
            audioManager.setMode(AudioManager.MODE_NORMAL);
            abandonAudioFocus();
        }

        call.resolve();
    }

    /**
     * Switches the speakerphone on or off during an active call.
     */
    @PluginMethod
    public void setSpeakerOn(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        audioManager.setSpeakerphoneOn(enabled);
        call.resolve();
    }

    // ─── Audio Focus ──────────────────────────────────────────────────────────

    @SuppressWarnings("deprecation")
    private void requestAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // API 26+ — use AudioFocusRequest
            AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();

            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(playbackAttributes)
                .setAcceptsDelayedFocusGain(false)
                .setOnAudioFocusChangeListener(focusChange -> {
                    // Handle focus change if needed (e.g., incoming phone call)
                })
                .build();

            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            // Legacy API
            audioManager.requestAudioFocus(
                null,
                AudioManager.STREAM_VOICE_CALL,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            );
        }
    }

    @SuppressWarnings("deprecation")
    private void abandonAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioFocusRequest = null;
        } else {
            audioManager.abandonAudioFocus(null);
        }
    }
}
