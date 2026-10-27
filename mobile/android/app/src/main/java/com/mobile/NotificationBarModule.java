package com.mobile;

import android.app.Activity;
import android.app.DownloadManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import android.provider.Settings;

public class NotificationBarModule extends ReactContextBaseJavaModule {
    private static final String CHANNEL_ID = "momentum_channel_alerts";
    private static final String CHANNEL_NAME = "Momentum Alerts";
    private static NotificationBarModule instance;
    private final ReactApplicationContext reactContext;
    private long currentDownloadId = -1;
    private BroadcastReceiver downloadReceiver = null;
    private volatile boolean isDownloadingApk = false;

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
    public void downloadAndInstallApk(String url, String fileName, Promise promise) {
        try {
            DownloadManager downloadManager = (DownloadManager) reactContext.getSystemService(Context.DOWNLOAD_SERVICE);
            if (downloadManager == null) {
                promise.reject("ERR_NO_DOWNLOAD_MANAGER", "DownloadManager service not available");
                return;
            }

            // Cleanup any existing active download listener
            if (downloadReceiver != null) {
                try {
                    reactContext.unregisterReceiver(downloadReceiver);
                } catch (Exception ignored) {}
                downloadReceiver = null;
            }

            Uri uri = Uri.parse(url);
            String name = (fileName != null && !fileName.isEmpty()) ? fileName : "Momentum-Update.apk";
            if (!name.endsWith(".apk")) {
                name += ".apk";
            }

            File destinationFile = new File(reactContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), name);
            if (destinationFile.exists()) {
                destinationFile.delete();
            }

            DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle("Downloading Momentum Update");
            request.setDescription("Downloading latest build...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationUri(Uri.fromFile(destinationFile));
            request.setMimeType("application/vnd.android.package-archive");

            long downloadId = downloadManager.enqueue(request);
            currentDownloadId = downloadId;
            isDownloadingApk = true;

            // Register completion broadcast receiver
            BroadcastReceiver onComplete = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (id == downloadId) {
                        try {
                            reactContext.unregisterReceiver(this);
                        } catch (Exception e) {}
                        downloadReceiver = null;
                        currentDownloadId = -1;
                        isDownloadingApk = false;

                        // Notify JS that download finished
                        WritableMap doneMap = Arguments.createMap();
                        doneMap.putInt("progress", 100);
                        doneMap.putString("status", "download_complete");
                        try {
                            if (reactContext.hasActiveReactInstance()) {
                                reactContext
                                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                    .emit("onDownloadProgress", doneMap);
                            }
                        } catch (Exception ignored) {}

                        // Launch package installer directly inside the app
                        installApkFile(destinationFile);
                        promise.resolve(true);
                    }
                }
            };
            downloadReceiver = onComplete;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_NOT_EXPORTED);
            } else {
                reactContext.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
            }

            // Progress tracking thread
            new Thread(() -> {
                while (isDownloadingApk) {
                    DownloadManager.Query q = new DownloadManager.Query();
                    q.setFilterById(downloadId);
                    Cursor cursor = downloadManager.query(q);
                    if (cursor != null && cursor.moveToFirst()) {
                        int bytesDownloadedIndex = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                        int bytesTotalIndex = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
                        int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);

                        if (bytesDownloadedIndex != -1 && bytesTotalIndex != -1) {
                            long bytesDownloaded = cursor.getLong(bytesDownloadedIndex);
                            long bytesTotal = cursor.getLong(bytesTotalIndex);
                            int status = cursor.getInt(statusIndex);

                            if (status == DownloadManager.STATUS_SUCCESSFUL || status == DownloadManager.STATUS_FAILED) {
                                isDownloadingApk = false;
                            }

                            if (bytesTotal > 0) {
                                int progress = (int) ((bytesDownloaded * 100L) / bytesTotal);
                                WritableMap progressMap = Arguments.createMap();
                                progressMap.putInt("progress", progress);
                                progressMap.putDouble("bytesDownloaded", (double) bytesDownloaded);
                                progressMap.putDouble("bytesTotal", (double) bytesTotal);

                                try {
                                    if (reactContext.hasActiveReactInstance()) {
                                        reactContext
                                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                            .emit("onDownloadProgress", progressMap);
                                    }
                                } catch (Exception e) {}
                            }
                        }
                        cursor.close();
                    } else {
                        isDownloadingApk = false;
                    }

                    try {
                        Thread.sleep(300);
                    } catch (InterruptedException e) {
                        isDownloadingApk = false;
                    }
                }
            }).start();

        } catch (Exception e) {
            isDownloadingApk = false;
            currentDownloadId = -1;
            promise.reject("ERR_DOWNLOAD", e.getMessage());
        }
    }

    @ReactMethod
    public void cancelApkDownload(Promise promise) {
        try {
            isDownloadingApk = false;
            if (currentDownloadId != -1) {
                DownloadManager downloadManager = (DownloadManager) reactContext.getSystemService(Context.DOWNLOAD_SERVICE);
                if (downloadManager != null) {
                    downloadManager.remove(currentDownloadId);
                }
                currentDownloadId = -1;
            }
            if (downloadReceiver != null) {
                try {
                    reactContext.unregisterReceiver(downloadReceiver);
                } catch (Exception ignored) {}
                downloadReceiver = null;
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERR_CANCEL_DOWNLOAD", e.getMessage());
        }
    }

    private void installApkFile(File file) {
        try {
            if (file == null || !file.exists()) {
                return;
            }

            // On Android 8.0+ (Oreo), check if app is permitted to install unknown apps
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!reactContext.getPackageManager().canRequestPackageInstalls()) {
                    Intent permissionIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    permissionIntent.setData(Uri.parse("package:" + reactContext.getPackageName()));
                    permissionIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    reactContext.startActivity(permissionIntent);
                    return;
                }
            }

            Uri contentUri = FileProvider.getUriForFile(
                reactContext,
                reactContext.getPackageName() + ".provider",
                file
            );

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(contentUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            reactContext.startActivity(installIntent);
        } catch (Exception e) {
            e.printStackTrace();
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
