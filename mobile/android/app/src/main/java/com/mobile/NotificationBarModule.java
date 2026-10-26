package com.mobile;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class NotificationBarModule extends ReactContextBaseJavaModule {
    private static final String CHANNEL_ID = "momentum_channel_alerts";
    private static final String CHANNEL_NAME = "Momentum Alerts";
    private final ReactApplicationContext reactContext;

    public NotificationBarModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        createNotificationChannel();
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
    public void showNotification(String title, String message, double notificationId) {
        Intent intent = new Intent(reactContext, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

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
