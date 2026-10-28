package com.mobile;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.media.AudioAttributes;
import android.media.MediaMetadata;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

public class FocusAudioModule extends ReactContextBaseJavaModule {
    private static final String TAG = "FocusAudioModule";
    private static final int REQUEST_CODE_PICK_AUDIO = 8492;
    private static final int NOTIFICATION_ID_MUSIC = 9901;
    public static final String CHANNEL_ID_MUSIC = "momentum_channel_focus_audio";

    public static final String ACTION_AUDIO_TOGGLE = "com.mobile.ACTION_AUDIO_TOGGLE";
    public static final String ACTION_AUDIO_MUTE = "com.mobile.ACTION_AUDIO_MUTE";
    public static final String ACTION_AUDIO_STOP = "com.mobile.ACTION_AUDIO_STOP";

    private static FocusAudioModule instance = null;

    private final ReactApplicationContext reactContext;
    private MediaPlayer mediaPlayer = null;
    private Promise pendingPickerPromise = null;

    private String currentTrackId = null;
    private String currentTrackTitle = "Focus Soundtrack";
    private String currentTrackCategory = "Momentum Deep Work";
    private boolean isMuted = false;
    private float currentVolume = 0.85f;
    private boolean isLooping = true;
    private boolean receiverRegistered = false;
    private MediaSession mediaSession = null;
    private Bitmap emeraldArtwork = null;

    public static void handleAudioAction(String action) {
        if (instance != null) {
            instance.handleActionInternal(action);
        }
    }

    public void handleActionInternal(String action) {
        if (action == null) return;
        try {
            if (ACTION_AUDIO_TOGGLE.equals(action)) {
                if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                    mediaPlayer.pause();
                    emitState();
                    showOrUpdateMusicNotification(false);
                } else if (mediaPlayer != null) {
                    float vol = isMuted ? 0.0f : currentVolume;
                    mediaPlayer.setVolume(vol, vol);
                    mediaPlayer.start();
                    emitState();
                    showOrUpdateMusicNotification(true);
                }
            } else if (ACTION_AUDIO_MUTE.equals(action)) {
                isMuted = !isMuted;
                if (mediaPlayer != null) {
                    float vol = isMuted ? 0.0f : currentVolume;
                    mediaPlayer.setVolume(vol, vol);
                }
                emitState();
                showOrUpdateMusicNotification(mediaPlayer != null && mediaPlayer.isPlaying());
            } else if (ACTION_AUDIO_STOP.equals(action)) {
                stopInternal();
                emitState();
            }
        } catch (Exception e) {
            Log.w(TAG, "handleActionInternal error: " + e.getMessage());
        }
    }

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == REQUEST_CODE_PICK_AUDIO) {
                if (pendingPickerPromise == null) return;

                if (resultCode == Activity.RESULT_OK && data != null && data.getData() != null) {
                    Uri sourceUri = data.getData();
                    try {
                        // Persist permission if possible on Android 7+
                        try {
                            reactContext.getContentResolver().takePersistableUriPermission(
                                sourceUri,
                                Intent.FLAG_GRANT_READ_URI_PERMISSION
                            );
                        } catch (Exception ignored) {}

                        // Read metadata name
                        String displayName = "Custom Track";
                        long fileSize = 0;
                        try (Cursor cursor = reactContext.getContentResolver().query(sourceUri, null, null, null, null)) {
                            if (cursor != null && cursor.moveToFirst()) {
                                int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                                int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                                if (nameIndex != -1) {
                                    String n = cursor.getString(nameIndex);
                                    if (n != null && !n.trim().isEmpty()) {
                                        displayName = n;
                                    }
                                }
                                if (sizeIndex != -1) {
                                    fileSize = cursor.getLong(sizeIndex);
                                }
                            }
                        } catch (Exception e) {
                            Log.w(TAG, "Failed reading display name: " + e.getMessage());
                        }

                        // Copy to app private filesDir/custom_music to guarantee persistent access
                        File customMusicDir = new File(reactContext.getFilesDir(), "custom_music");
                        if (!customMusicDir.exists()) {
                            customMusicDir.mkdirs();
                        }

                        String safeName = displayName.replaceAll("[^a-zA-Z0-9._-]", "_");
                        if (!safeName.toLowerCase().endsWith(".mp3") &&
                            !safeName.toLowerCase().endsWith(".wav") &&
                            !safeName.toLowerCase().endsWith(".ogg") &&
                            !safeName.toLowerCase().endsWith(".m4a")) {
                            safeName += ".mp3";
                        }

                        File destFile = new File(customMusicDir, "track_" + System.currentTimeMillis() + "_" + safeName);
                        try (InputStream in = reactContext.getContentResolver().openInputStream(sourceUri);
                             OutputStream out = new FileOutputStream(destFile)) {
                            byte[] buffer = new byte[8192];
                            int read;
                            while ((read = in.read(buffer)) != -1) {
                                out.write(buffer, 0, read);
                            }
                        }

                        WritableMap res = Arguments.createMap();
                        res.putString("uri", destFile.getAbsolutePath());
                        res.putString("name", displayName.replaceFirst("[.][^.]+$", ""));
                        res.putString("fileName", destFile.getName());
                        res.putDouble("size", destFile.length());
                        pendingPickerPromise.resolve(res);

                    } catch (Exception err) {
                        Log.e(TAG, "Error copying picked audio", err);
                        pendingPickerPromise.reject("ERR_PICK", "Failed copying selected audio: " + err.getMessage());
                    } finally {
                        pendingPickerPromise = null;
                    }
                } else {
                    // Cancelled by user
                    pendingPickerPromise.reject("CANCELLED", "Audio picker was cancelled");
                    pendingPickerPromise = null;
                }
            }
        }
    };

    private final BroadcastReceiver audioActionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null || intent.getAction() == null) return;
            handleActionInternal(intent.getAction());
        }
    };

    public FocusAudioModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        instance = this;
        reactContext.addActivityEventListener(activityEventListener);
        createMusicNotificationChannel();
        com.facebook.react.bridge.UiThreadUtil.runOnUiThread(this::initMediaSession);
        registerAudioReceiver();
    }

    private Bitmap createEmeraldArtwork() {
        try {
            int size = 256;
            Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);

            // Dark AMOLED emerald background #021207
            Paint bgPaint = new Paint();
            bgPaint.setColor(0xFF021207);
            canvas.drawRect(0, 0, size, size, bgPaint);

            // Glowing emerald soundwaves #00E676
            Paint wavePaint = new Paint();
            wavePaint.setColor(0xFF00E676);
            wavePaint.setStrokeWidth(14);
            wavePaint.setStrokeCap(Paint.Cap.ROUND);
            wavePaint.setAntiAlias(true);

            int midY = size / 2;
            int[] heights = {45, 85, 125, 95, 50};
            int startX = 58;
            int step = 35;
            for (int i = 0; i < heights.length; i++) {
                int h = heights[i];
                canvas.drawLine(startX + (i * step), midY - (h / 2), startX + (i * step), midY + (h / 2), wavePaint);
            }

            return bitmap;
        } catch (Exception e) {
            return null;
        }
    }

    private void initMediaSession() {
        if (mediaSession != null) return;
        try {
            mediaSession = new MediaSession(reactContext, "MomentumFocusAudio");
            mediaSession.setCallback(new MediaSession.Callback() {
                @Override
                public void onPlay() {
                    if (mediaPlayer != null && !mediaPlayer.isPlaying()) {
                        float vol = isMuted ? 0.0f : currentVolume;
                        mediaPlayer.setVolume(vol, vol);
                        mediaPlayer.start();
                        emitState();
                        showOrUpdateMusicNotification(true);
                    }
                }

                @Override
                public void onPause() {
                    if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                        mediaPlayer.pause();
                        emitState();
                        showOrUpdateMusicNotification(false);
                    }
                }

                @Override
                public void onStop() {
                    stopInternal();
                    emitState();
                    cancelMusicNotification();
                }

                @Override
                public void onSeekTo(long pos) {
                    if (mediaPlayer != null) {
                        mediaPlayer.seekTo((int) pos);
                        updatePlaybackState(mediaPlayer.isPlaying());
                    }
                }
            });
            mediaSession.setActive(true);
            emeraldArtwork = createEmeraldArtwork();
        } catch (Exception e) {
            Log.w(TAG, "initMediaSession error: " + e.getMessage());
        }
    }

    private void updatePlaybackState(boolean isPlaying) {
        if (mediaSession == null) return;
        try {
            long actions = PlaybackState.ACTION_PLAY
                | PlaybackState.ACTION_PAUSE
                | PlaybackState.ACTION_STOP
                | PlaybackState.ACTION_PLAY_PAUSE
                | PlaybackState.ACTION_SEEK_TO;

            int state = isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED;
            long position = mediaPlayer != null ? mediaPlayer.getCurrentPosition() : 0;

            PlaybackState playbackState = new PlaybackState.Builder()
                .setActions(actions)
                .setState(state, position, 1.0f)
                .build();
            mediaSession.setPlaybackState(playbackState);

            MediaMetadata.Builder meta = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, currentTrackTitle != null ? currentTrackTitle : "Focus Soundtrack")
                .putString(MediaMetadata.METADATA_KEY_ARTIST, "Momentum Soundscape")
                .putString(MediaMetadata.METADATA_KEY_ALBUM, currentTrackCategory != null ? currentTrackCategory : "Lofi Ambient")
                .putLong(MediaMetadata.METADATA_KEY_DURATION, mediaPlayer != null ? mediaPlayer.getDuration() : -1);

            if (emeraldArtwork != null) {
                meta.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, emeraldArtwork);
                meta.putBitmap(MediaMetadata.METADATA_KEY_ART, emeraldArtwork);
            }

            mediaSession.setMetadata(meta.build());
        } catch (Exception e) {
            Log.w(TAG, "updatePlaybackState error: " + e.getMessage());
        }
    }

    private void registerAudioReceiver() {
        if (!receiverRegistered) {
            try {
                IntentFilter filter = new IntentFilter();
                filter.addAction(ACTION_AUDIO_TOGGLE);
                filter.addAction(ACTION_AUDIO_MUTE);
                filter.addAction(ACTION_AUDIO_STOP);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    reactContext.registerReceiver(audioActionReceiver, filter, Context.RECEIVER_EXPORTED);
                } else {
                    reactContext.registerReceiver(audioActionReceiver, filter);
                }
                receiverRegistered = true;
            } catch (Exception e) {
                Log.w(TAG, "registerAudioReceiver error: " + e.getMessage());
            }
        }
    }

    private void unregisterAudioReceiver() {
        if (receiverRegistered) {
            try {
                reactContext.unregisterReceiver(audioActionReceiver);
            } catch (Exception ignored) {}
            receiverRegistered = false;
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        unregisterAudioReceiver();
        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
            } catch (Exception ignored) {}
            mediaSession = null;
        }
        stopInternal();
    }

    private void createMusicNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID_MUSIC,
                "Momentum Focus Audio",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active focus music playback with controls in the notification bar");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            channel.enableVibration(false);

            NotificationManager nm = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void showOrUpdateMusicNotification(boolean isPlaying) {
        try {
            NotificationManager nm = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            updatePlaybackState(isPlaying);

            // Clicking notification brings MainActivity to front and opens Pomodoro screen safely
            Intent openIntent = new Intent(reactContext, MainActivity.class);
            openIntent.setAction(Intent.ACTION_MAIN);
            openIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            openIntent.putExtra("extra_action_type", "POMODORO");
            openIntent.putExtra("extra_payload", "{}");

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent openPending = PendingIntent.getActivity(reactContext, 201, openIntent, flags);

            // Action: Play / Pause toggle
            Intent toggleIntent = new Intent(reactContext, FocusAudioActionReceiver.class);
            toggleIntent.setAction(ACTION_AUDIO_TOGGLE);
            PendingIntent togglePending = PendingIntent.getBroadcast(reactContext, 202, toggleIntent, flags);

            // Action: Mute / Unmute
            Intent muteIntent = new Intent(reactContext, FocusAudioActionReceiver.class);
            muteIntent.setAction(ACTION_AUDIO_MUTE);
            PendingIntent mutePending = PendingIntent.getBroadcast(reactContext, 203, muteIntent, flags);

            // Action: Stop
            Intent stopIntent = new Intent(reactContext, FocusAudioActionReceiver.class);
            stopIntent.setAction(ACTION_AUDIO_STOP);
            PendingIntent stopPending = PendingIntent.getBroadcast(reactContext, 204, stopIntent, flags);

            // Dismiss Intent: cleanly stop when user dismisses paused notification
            Intent deleteIntent = new Intent(reactContext, FocusAudioActionReceiver.class);
            deleteIntent.setAction(ACTION_AUDIO_STOP);
            PendingIntent deletePending = PendingIntent.getBroadcast(reactContext, 205, deleteIntent, flags);

            int iconResId = reactContext.getResources().getIdentifier("ic_launcher", "mipmap", reactContext.getPackageName());
            if (iconResId == 0) {
                iconResId = android.R.drawable.ic_media_play;
            }

            String statusText = isMuted 
                ? "🔇 Muted • Tap to unmute" 
                : (isPlaying ? "▶ Focusing • " + currentTrackCategory : "⏸ Paused • Momentum");

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(reactContext, CHANNEL_ID_MUSIC);
            } else {
                builder = new Notification.Builder(reactContext);
            }

            Notification.MediaStyle mediaStyle = new Notification.MediaStyle();
            if (mediaSession != null) {
                mediaStyle.setMediaSession(mediaSession.getSessionToken());
            }
            mediaStyle.setShowActionsInCompactView(0, 1, 2);

            builder.setStyle(mediaStyle)
                .setSmallIcon(iconResId)
                .setColor(0xFF00E676)
                .setColorized(true)
                .setContentTitle(currentTrackTitle != null ? currentTrackTitle : "Focus Soundtrack")
                .setContentText(statusText)
                .setSubText("Momentum Live Audio")
                .setContentIntent(openPending)
                .setDeleteIntent(deletePending)
                .setOngoing(isPlaying)
                .setAutoCancel(!isPlaying)
                .setVisibility(Notification.VISIBILITY_PUBLIC);

            if (emeraldArtwork != null) {
                builder.setLargeIcon(emeraldArtwork);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                builder.setCategory(Notification.CATEGORY_TRANSPORT);
            }

            // Action 0: Play / Pause
            Notification.Action toggleAction = new Notification.Action.Builder(
                android.R.drawable.ic_media_play,
                isPlaying ? "Pause" : "Play",
                togglePending
            ).build();
            builder.addAction(toggleAction);

            // Action 1: Mute / Unmute
            Notification.Action muteAction = new Notification.Action.Builder(
                android.R.drawable.ic_lock_silent_mode,
                isMuted ? "Unmute" : "Mute",
                mutePending
            ).build();
            builder.addAction(muteAction);

            // Action 2: Stop
            Notification.Action stopAction = new Notification.Action.Builder(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Stop",
                stopPending
            ).build();
            builder.addAction(stopAction);

            nm.notify(NOTIFICATION_ID_MUSIC, builder.build());
        } catch (Exception e) {
            Log.w(TAG, "showOrUpdateMusicNotification error: " + e.getMessage());
        }
    }

    private void cancelMusicNotification() {
        try {
            NotificationManager nm = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(NOTIFICATION_ID_MUSIC);
            }
        } catch (Exception ignored) {}
    }

    @NonNull
    @Override
    public String getName() {
        return "FocusAudioModule";
    }

    private void emitState() {
        try {
            if (reactContext.hasActiveReactInstance()) {
                WritableMap map = Arguments.createMap();
                boolean isPlaying = mediaPlayer != null && mediaPlayer.isPlaying();
                map.putBoolean("isPlaying", isPlaying);
                map.putBoolean("isMuted", isMuted);
                map.putDouble("volume", currentVolume);
                map.putString("currentTrack", currentTrackId);
                map.putBoolean("isLooping", isLooping);
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onAudioStateChanged", map);
            }
        } catch (Exception e) {
            Log.w(TAG, "emitState error: " + e.getMessage());
        }
    }

    @ReactMethod
    public void playTrack(String trackSource, boolean loop, Promise promise) {
        try {
            if (trackSource == null || trackSource.trim().isEmpty()) {
                promise.reject("ERR_PARAM", "trackSource is required");
                return;
            }

            stopInternal();
            isLooping = loop;
            currentTrackId = trackSource;

            if (trackSource.startsWith("raw:")) {
                String rawName = trackSource.substring(4);
                int resId = reactContext.getResources().getIdentifier(rawName, "raw", reactContext.getPackageName());
                if (resId == 0) {
                    promise.reject("ERR_NOT_FOUND", "Resource raw/" + rawName + " not found");
                    return;
                }
                mediaPlayer = MediaPlayer.create(reactContext, resId);
            } else {
                File file = new File(trackSource);
                if (!file.exists() && !trackSource.startsWith("content://") && !trackSource.startsWith("http")) {
                    promise.reject("ERR_NOT_FOUND", "Audio file does not exist: " + trackSource);
                    return;
                }

                mediaPlayer = new MediaPlayer();
                mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                );

                if (file.exists()) {
                    try (FileInputStream fis = new FileInputStream(file)) {
                        mediaPlayer.setDataSource(fis.getFD());
                    }
                } else {
                    mediaPlayer.setDataSource(reactContext, Uri.parse(trackSource));
                }
                mediaPlayer.prepare();
            }

            if (mediaPlayer == null) {
                promise.reject("ERR_PLAYER", "Failed to initialize MediaPlayer");
                return;
            }

            mediaPlayer.setLooping(isLooping);
            float vol = isMuted ? 0.0f : currentVolume;
            mediaPlayer.setVolume(vol, vol);

            mediaPlayer.setOnCompletionListener(mp -> {
                if (!isLooping) {
                    emitState();
                }
            });

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error: what=" + what + ", extra=" + extra);
                stopInternal();
                emitState();
                return true;
            });

            mediaPlayer.start();
            emitState();
            showOrUpdateMusicNotification(true);

            WritableMap res = Arguments.createMap();
            res.putBoolean("success", true);
            res.putString("trackId", currentTrackId);
            res.putInt("duration", mediaPlayer.getDuration());
            promise.resolve(res);

        } catch (Exception e) {
            Log.e(TAG, "playTrack error", e);
            stopInternal();
            promise.reject("ERR_PLAY", e.getMessage());
        }
    }

    @ReactMethod
    public void playTrackWithMetadata(String trackSource, boolean loop, String title, String category, Promise promise) {
        if (title != null && !title.trim().isEmpty()) {
            this.currentTrackTitle = title;
        }
        if (category != null && !category.trim().isEmpty()) {
            this.currentTrackCategory = category;
        }
        playTrack(trackSource, loop, promise);
    }

    @ReactMethod
    public void setNotificationMetadata(String title, String category, Promise promise) {
        if (title != null && !title.trim().isEmpty()) {
            this.currentTrackTitle = title;
        }
        if (category != null && !category.trim().isEmpty()) {
            this.currentTrackCategory = category;
        }
        if (mediaPlayer != null) {
            showOrUpdateMusicNotification(mediaPlayer.isPlaying());
        }
        if (promise != null) {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void pauseTrack(Promise promise) {
        try {
            if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
                emitState();
                showOrUpdateMusicNotification(false);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERR_PAUSE", e.getMessage());
        }
    }

    @ReactMethod
    public void resumeTrack(Promise promise) {
        try {
            if (mediaPlayer != null && !mediaPlayer.isPlaying()) {
                float vol = isMuted ? 0.0f : currentVolume;
                mediaPlayer.setVolume(vol, vol);
                mediaPlayer.start();
                emitState();
                showOrUpdateMusicNotification(true);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERR_RESUME", e.getMessage());
        }
    }

    @ReactMethod
    public void stopTrack(Promise promise) {
        try {
            stopInternal();
            emitState();
            cancelMusicNotification();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERR_STOP", e.getMessage());
        }
    }

    private void stopInternal() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }

        if (mediaSession != null) {
            try {
                PlaybackState playbackState = new PlaybackState.Builder()
                    .setActions(0)
                    .setState(PlaybackState.STATE_STOPPED, 0, 0f)
                    .build();
                mediaSession.setPlaybackState(playbackState);
                mediaSession.setActive(false);
            } catch (Exception ignored) {}
        }

        cancelMusicNotification();
        currentTrackId = null;
    }

    @ReactMethod
    public void setVolume(double volume, Promise promise) {
        try {
            currentVolume = (float) Math.max(0.0, Math.min(1.0, volume));
            if (mediaPlayer != null) {
                float vol = isMuted ? 0.0f : currentVolume;
                mediaPlayer.setVolume(vol, vol);
            }
            emitState();
            promise.resolve(currentVolume);
        } catch (Exception e) {
            promise.reject("ERR_VOL", e.getMessage());
        }
    }

    @ReactMethod
    public void setMuted(boolean muted, Promise promise) {
        try {
            isMuted = muted;
            if (mediaPlayer != null) {
                float vol = isMuted ? 0.0f : currentVolume;
                mediaPlayer.setVolume(vol, vol);
            }
            emitState();
            showOrUpdateMusicNotification(mediaPlayer != null && mediaPlayer.isPlaying());
            promise.resolve(isMuted);
        } catch (Exception e) {
            promise.reject("ERR_MUTE", e.getMessage());
        }
    }

    @ReactMethod
    public void toggleMute(Promise promise) {
        setMuted(!isMuted, promise);
    }

    @ReactMethod
    public void getPlaybackState(Promise promise) {
        try {
            WritableMap map = Arguments.createMap();
            boolean isPlaying = mediaPlayer != null && mediaPlayer.isPlaying();
            map.putBoolean("isPlaying", isPlaying);
            map.putBoolean("isMuted", isMuted);
            map.putDouble("volume", currentVolume);
            map.putString("currentTrack", currentTrackId);
            map.putBoolean("isLooping", isLooping);
            map.putInt("position", mediaPlayer != null ? mediaPlayer.getCurrentPosition() : 0);
            map.putInt("duration", mediaPlayer != null ? mediaPlayer.getDuration() : 0);
            promise.resolve(map);
        } catch (Exception e) {
            promise.reject("ERR_STATE", e.getMessage());
        }
    }

    @ReactMethod
    public void pickAudioFromDevice(Promise promise) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("ERR_ACTIVITY", "Current activity is null");
            return;
        }

        if (pendingPickerPromise != null) {
            pendingPickerPromise.reject("ERR_BUSY", "Another file picker operation is in progress");
            pendingPickerPromise = null;
        }

        pendingPickerPromise = promise;

        try {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("audio/*");
            String[] mimeTypes = {
                "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg",
                "audio/aac", "audio/m4a", "audio/x-wav", "audio/flac"
            };
            intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
            currentActivity.startActivityForResult(intent, REQUEST_CODE_PICK_AUDIO);
        } catch (Exception e) {
            Log.w(TAG, "ACTION_OPEN_DOCUMENT failed, attempting ACTION_GET_CONTENT fallback", e);
            try {
                Intent fallback = new Intent(Intent.ACTION_GET_CONTENT);
                fallback.setType("audio/*");
                currentActivity.startActivityForResult(fallback, REQUEST_CODE_PICK_AUDIO);
            } catch (Exception fallbackErr) {
                pendingPickerPromise.reject("ERR_INTENT", "Cannot launch audio picker: " + fallbackErr.getMessage());
                pendingPickerPromise = null;
            }
        }
    }

    @ReactMethod
    public void listCustomAudio(Promise promise) {
        try {
            File customMusicDir = new File(reactContext.getFilesDir(), "custom_music");
            WritableArray array = Arguments.createArray();

            if (customMusicDir.exists() && customMusicDir.isDirectory()) {
                File[] files = customMusicDir.listFiles();
                if (files != null) {
                    for (File f : files) {
                        if (f.isFile() && f.length() > 0) {
                            WritableMap item = Arguments.createMap();
                            item.putString("uri", f.getAbsolutePath());
                            item.putString("fileName", f.getName());
                            // Prettify clean display name
                            String cleanName = f.getName().replaceFirst("^track_\\d+_", "").replaceFirst("[.][^.]+$", "").replace("_", " ");
                            item.putString("name", cleanName);
                            item.putDouble("size", f.length());
                            array.pushMap(item);
                        }
                    }
                }
            }
            promise.resolve(array);
        } catch (Exception e) {
            promise.reject("ERR_LIST", e.getMessage());
        }
    }

    @ReactMethod
    public void deleteCustomAudio(String filePath, Promise promise) {
        try {
            if (filePath == null) {
                promise.resolve(false);
                return;
            }
            File f = new File(filePath);
            if (f.exists()) {
                boolean deleted = f.delete();
                promise.resolve(deleted);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERR_DEL", e.getMessage());
        }
    }
}
