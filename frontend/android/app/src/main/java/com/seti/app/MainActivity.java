package com.seti.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    private static final int CALL_PERMISSIONS_REQUEST = 101;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register native AudioPlugin before bridge initializes
        registerPlugin(AudioPlugin.class);
        super.onCreate(savedInstanceState);

        // Proactively request all call-related permissions at app start.
        // This ensures the mic/camera dialog appears before the first call,
        // so getUserMedia() never silently fails.
        requestCallPermissions();

        // Override WebChromeClient to auto-grant WebRTC media requests from the WebView.
        // Without this, the WebView can silently deny microphone/camera access even
        // if Android OS has already granted the permissions to the app.
        this.bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Grant all requested resources (microphone, camera, etc.) to the WebView.
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });
    }

    /**
     * Requests all permissions required for VoIP audio/video calls.
     * Called once at app start so permissions are ready before any call.
     */
    private void requestCallPermissions() {
        // Build the list of required permissions depending on API level
        String[] basePermissions = {
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA,
            Manifest.permission.MODIFY_AUDIO_SETTINGS,
            Manifest.permission.READ_PHONE_STATE,
        };

        String[] extraPermissions;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+: need POST_NOTIFICATIONS
            extraPermissions = new String[]{
                Manifest.permission.POST_NOTIFICATIONS
            };
        } else {
            extraPermissions = new String[]{};
        }

        // Merge arrays
        String[] allPermissions = new String[basePermissions.length + extraPermissions.length];
        System.arraycopy(basePermissions, 0, allPermissions, 0, basePermissions.length);
        System.arraycopy(extraPermissions, 0, allPermissions, basePermissions.length, extraPermissions.length);

        // Only request those not yet granted
        java.util.List<String> toRequest = new java.util.ArrayList<>();
        for (String perm : allPermissions) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                toRequest.add(perm);
            }
        }

        if (!toRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                toRequest.toArray(new String[0]),
                CALL_PERMISSIONS_REQUEST
            );
        }
    }
}
