package com.mobile;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class NotificationBarModule extends ReactContextBaseJavaModule {
    private static final String CHANNEL_ID = "momentum_channel_alerts";
    private static final String CHANNEL_NAME = "Momentum Alerts";
    private static NotificationBarModule instance;
    private final ReactApplicationContext reactContext;

    public NotificationBarModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        instance = this;
        createNotificationChannel();
    }

    public static void handleNotificationIntent(Intent intent) {
        if (intent == null || instance == null) return;

        if (intent.hasExtra("extra_action_type")) {
            String actionType = intent.getStringExtra("extra_action_type");
            String payload = intent.getStringExtra("extra_payload");

            WritableMap params = Arguments.createMap();
            params.putString("actionType", actionType != null ? actionType : "NOTIFICATIONS");
            params.putString("payload", payload != null ? payload : "{}");

            try {
                if (instance.reactContext.hasActiveReactInstance()) {
                    instance.reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onNotificationClicked", params);
                }
            } catch (Exception e) {
                // Ignore if JS context not ready yet
            }

            // Clear to avoid handling again
            intent.removeExtra("extra_action_type");
        }
    }

    @Override
    public String getName() {
        return "NotificationBarModule";
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Momentum App Updates and Alerts");
            channel.enableVibration(true);
            channel.enableLights(true);

            NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @ReactMethod
    public void showNotification(String title, String message, double notificationId, String actionType, String payloadJson) {
        Intent intent = new Intent(reactContext, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("extra_action_type", actionType != null ? actionType : "NOTIFICATIONS");
        intent.putExtra("extra_payload", payloadJson != null ? payloadJson : "{}");

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
            reactContext,
            (int) notificationId,
            intent,
            flags
        );

        int iconResId = reactContext.getResources().getIdentifier("ic_launcher", "mipmap", reactContext.getPackageName());
        if (iconResId == 0) {
            iconResId = android.R.drawable.ic_dialog_info;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setSmallIcon(iconResId)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL);

        NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify((int) notificationId, builder.build());
        }
    }

    @ReactMethod
    public void getInitialNotification(Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity != null) {
                Intent intent = currentActivity.getIntent();
                if (intent != null && intent.hasExtra("extra_action_type")) {
                    String actionType = intent.getStringExtra("extra_action_type");
                    String payload = intent.getStringExtra("extra_payload");

                    WritableMap params = Arguments.createMap();
                    params.putString("actionType", actionType != null ? actionType : "NOTIFICATIONS");
                    params.putString("payload", payload != null ? payload : "{}");

                    intent.removeExtra("extra_action_type");
                    promise.resolve(params);
                    return;
                }
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.resolve(null);
        }
    }

    @ReactMethod
    public void cancelNotification(double notificationId) {
        NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel((int) notificationId);
        }
    }

    @ReactMethod
    public void cancelAllNotifications() {
        NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancelAll();
        }
    }
}
