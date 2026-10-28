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
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.util.List;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.view.WindowInsets;
import android.view.WindowInsetsController;

public class NotificationBarModule extends ReactContextBaseJavaModule {
    private static final String CHANNEL_ID = "momentum_channel_alerts";
    private static final String CHANNEL_NAME = "Momentum Alerts";
    public static final String CHANNEL_ID_TASKS = "momentum_channel_tasks";
    public static final int NOTIFICATION_ID_TASKS = 8801;
    public static final String CHANNEL_ID_TIMER = "momentum_channel_timer";
    public static final int NOTIFICATION_ID_TIMER = 8802;

    private static NotificationBarModule instance;
    private final ReactApplicationContext reactContext;
    private long currentDownloadId = -1;
    private BroadcastReceiver downloadReceiver = null;
    private volatile boolean isDownloadingApk = false;
    private File lastDownloadedApk = null;

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
                    intent.removeExtra("extra_action_type");
                }
            } catch (Exception e) {
                // Ignore if JS context not ready yet; getInitialNotification will read it
            }
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

            NotificationChannel tasksChannel = new NotificationChannel(
                CHANNEL_ID_TASKS,
                "Today's Tasks",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            tasksChannel.setDescription("Today's task checklist in your notification bar");
            tasksChannel.setShowBadge(true);

            NotificationChannel timerChannel = new NotificationChannel(
                CHANNEL_ID_TIMER,
                "Focus Timer",
                NotificationManager.IMPORTANCE_LOW
            );
            timerChannel.setDescription("Live Focus and Pomodoro countdown");
            timerChannel.setShowBadge(true);
            timerChannel.enableVibration(false);
            timerChannel.enableLights(false);

            NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
                notificationManager.createNotificationChannel(tasksChannel);
                notificationManager.createNotificationChannel(timerChannel);
            }
        }
    }

    @ReactMethod
    public void showNotification(String title, String message, double notificationId, String actionType, String payloadJson) {
        Intent intent = new Intent(reactContext, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
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

            File downloadsDir = reactContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (downloadsDir != null && !downloadsDir.exists()) {
                downloadsDir.mkdirs();
            }

            File destinationFile = new File(downloadsDir, name);
            if (destinationFile.exists()) {
                destinationFile.delete();
            }
            lastDownloadedApk = destinationFile;

            DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle("Downloading Momentum Update");
            request.setDescription("Downloading latest build...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(reactContext, Environment.DIRECTORY_DOWNLOADS, name);
            request.setMimeType("application/vnd.android.package-archive");
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);

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

                        // Check download status & resolved file path from DownloadManager
                        DownloadManager.Query q = new DownloadManager.Query();
                        q.setFilterById(downloadId);
                        Cursor c = downloadManager.query(q);
                        boolean success = false;
                        File resolvedFile = destinationFile;
                        if (c != null && c.moveToFirst()) {
                            int statusIndex = c.getColumnIndex(DownloadManager.COLUMN_STATUS);
                            if (statusIndex != -1 && c.getInt(statusIndex) == DownloadManager.STATUS_SUCCESSFUL) {
                                success = true;
                            }
                            int localUriIdx = c.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
                            if (localUriIdx != -1) {
                                String localUri = c.getString(localUriIdx);
                                if (localUri != null && !localUri.isEmpty()) {
                                    try {
                                        File dmFile = new File(Uri.parse(localUri).getPath());
                                        if (dmFile.exists()) {
                                            resolvedFile = dmFile;
                                        }
                                    } catch (Exception ignored) {}
                                }
                            }
                            c.close();
                        }

                        if ((resolvedFile != null && resolvedFile.exists()) || success) {
                            if (resolvedFile != null && resolvedFile.exists()) {
                                lastDownloadedApk = resolvedFile;
                            }
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

                            // Launch package installer on UI thread
                            File targetToInstall = (resolvedFile != null && resolvedFile.exists()) ? resolvedFile : destinationFile;
                            UiThreadUtil.runOnUiThread(() -> {
                                installApkFile(targetToInstall);
                            });
                            promise.resolve(true);
                        } else {
                            WritableMap failMap = Arguments.createMap();
                            failMap.putInt("progress", -1);
                            failMap.putString("status", "download_failed");
                            failMap.putString("error", "Download failed or file not found.");
                            try {
                                if (reactContext.hasActiveReactInstance()) {
                                    reactContext
                                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                        .emit("onDownloadProgress", failMap);
                                }
                            } catch (Exception ignored) {}
                            promise.resolve(false);
                        }
                    }
                }
            };
            downloadReceiver = onComplete;

            // ACTION_DOWNLOAD_COMPLETE is dispatched by the external Android download manager system process.
            // On Android 13+ (TIRAMISU) and Android 14+, it MUST be registered with RECEIVER_EXPORTED.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
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

                            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                                isDownloadingApk = false;
                                File resolvedFile = destinationFile;
                                int localUriIdx = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
                                if (localUriIdx != -1) {
                                    String localUri = cursor.getString(localUriIdx);
                                    if (localUri != null && !localUri.isEmpty()) {
                                        try {
                                            File dmFile = new File(Uri.parse(localUri).getPath());
                                            if (dmFile.exists()) {
                                                resolvedFile = dmFile;
                                            }
                                        } catch (Exception ignored) {}
                                    }
                                }
                                if (resolvedFile != null && resolvedFile.exists()) {
                                    lastDownloadedApk = resolvedFile;
                                }

                                WritableMap progressMap = Arguments.createMap();
                                progressMap.putInt("progress", 100);
                                progressMap.putString("status", "download_complete");
                                progressMap.putDouble("bytesDownloaded", (double) bytesDownloaded);
                                progressMap.putDouble("bytesTotal", (double) (bytesTotal > 0 ? bytesTotal : bytesDownloaded));
                                try {
                                    if (reactContext.hasActiveReactInstance()) {
                                        reactContext
                                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                            .emit("onDownloadProgress", progressMap);
                                    }
                                } catch (Exception e) {}

                                File targetToInstall = (resolvedFile != null && resolvedFile.exists()) ? resolvedFile : destinationFile;
                                UiThreadUtil.runOnUiThread(() -> {
                                    installApkFile(targetToInstall);
                                });
                            } else if (status == DownloadManager.STATUS_FAILED) {
                                isDownloadingApk = false;
                                WritableMap failMap = Arguments.createMap();
                                failMap.putInt("progress", -1);
                                failMap.putString("status", "download_failed");
                                int reasonIdx = cursor.getColumnIndex(DownloadManager.COLUMN_REASON);
                                int reason = reasonIdx != -1 ? cursor.getInt(reasonIdx) : -1;
                                failMap.putString("error", "Download failed with reason code: " + reason);
                                try {
                                    if (reactContext.hasActiveReactInstance()) {
                                        reactContext
                                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                            .emit("onDownloadProgress", failMap);
                                    }
                                } catch (Exception e) {}
                            } else if (bytesTotal > 0) {
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

    private boolean installApkFile(File file) {
        try {
            if (file == null || !file.exists()) {
                File downloadsDir = reactContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (downloadsDir != null && downloadsDir.exists()) {
                    File[] apks = downloadsDir.listFiles((dir, fName) -> fName.endsWith(".apk"));
                    if (apks != null && apks.length > 0) {
                        file = apks[0];
                        for (File a : apks) {
                            if (a.lastModified() > file.lastModified()) {
                                file = a;
                            }
                        }
                    }
                }
            }

            if (file == null || !file.exists()) {
                Log.e("NotificationBarModule", "Cannot install: APK file does not exist");
                WritableMap errMap = Arguments.createMap();
                errMap.putString("status", "error");
                errMap.putString("error", "APK file could not be found on device.");
                try {
                    if (reactContext.hasActiveReactInstance()) {
                        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onDownloadProgress", errMap);
                    }
                } catch (Exception ignored) {}
                return false;
            }

            lastDownloadedApk = file;

            // On Android 8.0+ (Oreo), check if app is permitted to install unknown apps
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!reactContext.getPackageManager().canRequestPackageInstalls()) {
                    Log.w("NotificationBarModule", "Package install permission not granted, redirecting to settings");
                    WritableMap permMap = Arguments.createMap();
                    permMap.putString("status", "permission_required");
                    permMap.putString("message", "Please allow 'Install unknown apps' for Momentum in Settings, then tap Install Update again.");
                    try {
                        if (reactContext.hasActiveReactInstance()) {
                            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("onDownloadProgress", permMap);
                        }
                    } catch (Exception ignored) {}

                    Intent permissionIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    permissionIntent.setData(Uri.parse("package:" + reactContext.getPackageName()));
                    permissionIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    Activity currentActivity = getCurrentActivity();
                    if (currentActivity != null) {
                        currentActivity.startActivity(permissionIntent);
                    } else {
                        reactContext.startActivity(permissionIntent);
                    }
                    return false;
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
            installIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

            // Explicitly grant URI permission to known package installers & resolved handlers
            String[] knownInstallers = new String[]{
                "com.google.android.packageinstaller",
                "com.android.packageinstaller",
                "com.google.android.permissioncontroller"
            };
            for (String installerPkg : knownInstallers) {
                try {
                    reactContext.grantUriPermission(installerPkg, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } catch (Exception ignored) {}
            }

            try {
                List<ResolveInfo> resInfoList = reactContext.getPackageManager().queryIntentActivities(installIntent, PackageManager.MATCH_DEFAULT_ONLY);
                for (ResolveInfo resolveInfo : resInfoList) {
                    String packageName = resolveInfo.activityInfo.packageName;
                    reactContext.grantUriPermission(packageName, contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }
            } catch (Exception ignored) {}

            Activity currentActivity = getCurrentActivity();
            if (currentActivity != null) {
                currentActivity.startActivity(installIntent);
            } else {
                reactContext.startActivity(installIntent);
            }

            WritableMap readyMap = Arguments.createMap();
            readyMap.putString("status", "installer_launched");
            try {
                if (reactContext.hasActiveReactInstance()) {
                    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onDownloadProgress", readyMap);
                }
            } catch (Exception ignored) {}

            return true;
        } catch (Exception e) {
            Log.e("NotificationBarModule", "Error launching package installer: " + e.getMessage(), e);
            WritableMap errMap = Arguments.createMap();
            errMap.putString("status", "error");
            errMap.putString("error", "Could not launch package installer: " + e.getMessage());
            try {
                if (reactContext.hasActiveReactInstance()) {
                    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onDownloadProgress", errMap);
                }
            } catch (Exception ignored) {}
            return false;
        }
    }

    @ReactMethod
    public void installDownloadedApk(Promise promise) {
        try {
            UiThreadUtil.runOnUiThread(() -> {
                try {
                    File target = lastDownloadedApk;
                    if (target == null || !target.exists()) {
                        File downloadsDir = reactContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                        if (downloadsDir != null && downloadsDir.exists()) {
                            File[] apks = downloadsDir.listFiles((dir, name) -> name.endsWith(".apk"));
                            if (apks != null && apks.length > 0) {
                                target = apks[0];
                                for (File a : apks) {
                                    if (a.lastModified() > target.lastModified()) {
                                        target = a;
                                    }
                                }
                            }
                        }
                    }

                    if (target != null && target.exists()) {
                        boolean launched = installApkFile(target);
                        if (promise != null) promise.resolve(launched);
                    } else {
                        if (promise != null) promise.reject("ERR_NO_APK", "No downloaded APK found to install");
                    }
                } catch (Exception inner) {
                    if (promise != null) promise.reject("ERR_INSTALL", inner.getMessage());
                }
            });
        } catch (Exception e) {
            if (promise != null) promise.reject("ERR_THREAD", e.getMessage());
        }
    }

    @ReactMethod
    public void canInstallUnknownApps(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                promise.resolve(reactContext.getPackageManager().canRequestPackageInstalls());
            } else {
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void openUnknownAppsSettings(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + reactContext.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                Activity currentActivity = getCurrentActivity();
                if (currentActivity != null) {
                    currentActivity.startActivity(intent);
                } else {
                    reactContext.startActivity(intent);
                }
                promise.resolve(true);
            } else {
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("ERR_SETTINGS", e.getMessage());
        }
    }

    @ReactMethod
    public void getAppVersion(Promise promise) {
        try {
            String versionName = reactContext.getPackageManager()
                .getPackageInfo(reactContext.getPackageName(), 0).versionName;
            int versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = (int) reactContext.getPackageManager()
                    .getPackageInfo(reactContext.getPackageName(), 0).getLongVersionCode();
            } else {
                versionCode = reactContext.getPackageManager()
                    .getPackageInfo(reactContext.getPackageName(), 0).versionCode;
            }
            WritableMap map = Arguments.createMap();
            map.putString("versionName", versionName != null ? versionName : "1.1");
            map.putInt("versionCode", versionCode);
            promise.resolve(map);
        } catch (Exception e) {
            WritableMap map = Arguments.createMap();
            map.putString("versionName", "1.1");
            map.putInt("versionCode", 2);
            promise.resolve(map);
        }
    }

    @ReactMethod
    public void updateWidget(String quote, String author, double streak, Promise promise) {
        try {
            MomentumWidgetProvider.updateAllWidgets(reactContext, quote, author, (int) streak);
            if (promise != null) {
                promise.resolve(true);
            }
        } catch (Exception e) {
            if (promise != null) {
                promise.reject("ERR_UPDATE_WIDGET", e.getMessage());
            }
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

    @ReactMethod
    public void showTasksNotification(String title, String summary, com.facebook.react.bridge.ReadableArray tasksList, int completedCount, int totalCount) {
        try {
            Intent intent = new Intent(reactContext, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("extra_action_type", "TASKS");
            intent.putExtra("extra_payload", "{}");

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getActivity(
                reactContext,
                NOTIFICATION_ID_TASKS,
                intent,
                flags
            );

            int iconResId = reactContext.getResources().getIdentifier("ic_launcher", "mipmap", reactContext.getPackageName());
            if (iconResId == 0) {
                iconResId = android.R.drawable.ic_dialog_info;
            }

            NotificationCompat.InboxStyle inboxStyle = new NotificationCompat.InboxStyle();
            inboxStyle.setBigContentTitle(title != null ? title : "📋 Today's Tasks");
            inboxStyle.setSummaryText(completedCount + " of " + totalCount + " Completed");

            if (tasksList != null) {
                for (int i = 0; i < tasksList.size() && i < 6; i++) {
                    com.facebook.react.bridge.ReadableMap t = tasksList.getMap(i);
                    String taskTitle = t.hasKey("title") ? t.getString("title") : "Task";
                    String status = t.hasKey("status") ? t.getString("status") : "pending";
                    boolean isDone = "completed".equalsIgnoreCase(status);
                    inboxStyle.addLine((isDone ? "✓ " : "▫ ") + taskTitle);
                }
                if (tasksList.size() > 6) {
                    inboxStyle.addLine("+ " + (tasksList.size() - 6) + " more tasks...");
                }
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, CHANNEL_ID_TASKS)
                .setSmallIcon(iconResId)
                .setContentTitle(title)
                .setContentText(summary != null ? summary : (totalCount - completedCount) + " tasks pending")
                .setStyle(inboxStyle)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setOngoing(false);

            NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.notify(NOTIFICATION_ID_TASKS, builder.build());
            }
        } catch (Exception e) {
            Log.w("NotificationBarModule", "showTasksNotification error: " + e.getMessage());
        }
    }

    @ReactMethod
    public void cancelTasksNotification() {
        try {
            NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancel(NOTIFICATION_ID_TASKS);
            }
        } catch (Exception ignored) {}
    }

    @ReactMethod
    public void showTimerNotification(String title, String summary, double targetEndTimeMillis, boolean isRunning, int currentSession, int totalSessions) {
        try {
            Intent intent = new Intent(reactContext, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("extra_action_type", "POMODORO");
            intent.putExtra("extra_payload", "{}");

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getActivity(
                reactContext,
                NOTIFICATION_ID_TIMER,
                intent,
                flags
            );

            int iconResId = reactContext.getResources().getIdentifier("ic_launcher", "mipmap", reactContext.getPackageName());
            if (iconResId == 0) {
                iconResId = android.R.drawable.ic_dialog_info;
            }

            long targetTime = (long) targetEndTimeMillis;

            NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, CHANNEL_ID_TIMER)
                .setSmallIcon(iconResId)
                .setColor(0xFF00E676)
                .setColorized(true)
                .setContentTitle(title != null ? title : "⏱️ Focus Timer")
                .setContentText(summary != null ? summary : "Session in progress")
                .setSubText("Session " + currentSession + "/" + totalSessions)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(pendingIntent)
                .setOnlyAlertOnce(true)
                .setOngoing(isRunning)
                .setAutoCancel(false)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

            if (isRunning && targetTime > System.currentTimeMillis()) {
                builder.setWhen(targetTime)
                       .setUsesChronometer(true)
                       .setChronometerCountDown(true);
            } else {
                builder.setUsesChronometer(false);
            }

            NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.notify(NOTIFICATION_ID_TIMER, builder.build());
            }
        } catch (Exception e) {
            Log.w("NotificationBarModule", "showTimerNotification error: " + e.getMessage());
        }
    }

    @ReactMethod
    public void cancelTimerNotification() {
        try {
            NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancel(NOTIFICATION_ID_TIMER);
            }
        } catch (Exception ignored) {}
    }

    @ReactMethod
    public void setKeepScreenOn(boolean keepOn) {
        UiThreadUtil.runOnUiThread(() -> {
            try {
                Activity activity = getCurrentActivity();
                if (activity != null && activity.getWindow() != null) {
                    if (keepOn) {
                        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    } else {
                        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    }
                }
            } catch (Exception e) {
                Log.w("NotificationBarModule", "setKeepScreenOn error: " + e.getMessage());
            }
        });
    }

    @ReactMethod
    public void setImmersiveMode(boolean immersive) {
        UiThreadUtil.runOnUiThread(() -> {
            try {
                Activity activity = getCurrentActivity();
                if (activity != null && activity.getWindow() != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        WindowInsetsController controller = activity.getWindow().getInsetsController();
                        if (controller != null) {
                            if (immersive) {
                                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                            } else {
                                controller.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                            }
                        }
                    } else {
                        int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
                        if (immersive) {
                            activity.getWindow().getDecorView().setSystemUiVisibility(flags);
                        } else {
                            activity.getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
                        }
                    }
                }
            } catch (Exception e) {
                Log.w("NotificationBarModule", "setImmersiveMode error: " + e.getMessage());
            }
        });
    }
}

