import { NativeModules, Platform, PermissionsAndroid, DeviceEventEmitter } from 'react-native';
import { sortTasksChronologically } from '../utils/timeUtils';

const { NotificationBarModule } = NativeModules;

export async function requestNotificationPermission() {
  if (Platform.OS !== 'android') return true;

  try {
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Posts an alert to Android's top system notification bar.
 * @param {string} title
 * @param {string} message
 * @param {number} id
 * @param {string} actionType - 'UPDATE' | 'MILESTONES' | 'TASKS' | 'NOTIFICATIONS'
 * @param {object} payload - Extra metadata passed when tapped
 */
export async function showSystemNotification(
  title,
  message,
  id = Math.floor(Math.random() * 100000),
  actionType = 'NOTIFICATIONS',
  payload = {}
) {
  if (Platform.OS !== 'android') return;

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    if (NotificationBarModule && typeof NotificationBarModule.showNotification === 'function') {
      const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
      NotificationBarModule.showNotification(
        title,
        message,
        id,
        actionType || 'NOTIFICATIONS',
        payloadStr
      );
    }
  } catch (err) {
    // Non-blocking fail-safe
  }
}

/**
 * Checks if the app was opened by tapping a notification while closed/killed (Cold Start)
 */
export async function getInitialNotification() {
  if (Platform.OS !== 'android' || !NotificationBarModule?.getInitialNotification) {
    return null;
  }
  try {
    const data = await NotificationBarModule.getInitialNotification();
    if (data && data.payload) {
      try {
        data.payload = JSON.parse(data.payload);
      } catch (e) {
        // Keep as string
      }
    }
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Listens for notification bar clicks while app is in background or running (Warm Start)
 */
export function addNotificationClickListener(callback) {
  if (Platform.OS !== 'android') return { remove: () => {} };

  const subscription = DeviceEventEmitter.addListener('onNotificationClicked', (data) => {
    if (data && data.payload && typeof data.payload === 'string') {
      try {
        data.payload = JSON.parse(data.payload);
      } catch (e) {
        // Keep as string
      }
    }
    if (typeof callback === 'function') {
      callback(data);
    }
  });

  return subscription;
}

export function cancelSystemNotification(id) {
  if (Platform.OS === 'android' && NotificationBarModule?.cancelNotification) {
    NotificationBarModule.cancelNotification(id);
  }
}

export function cancelAllSystemNotifications() {
  if (Platform.OS === 'android' && NotificationBarModule?.cancelAllNotifications) {
    NotificationBarModule.cancelAllNotifications();
  }
}

/**
 * Direct in-app background download & installer without web browser redirection
 */
export async function downloadAndInstallApkDirect(url, fileName) {
  if (Platform.OS !== 'android') return false;

  if (NotificationBarModule && typeof NotificationBarModule.downloadAndInstallApk === 'function') {
    try {
      await NotificationBarModule.downloadAndInstallApk(url, fileName);
      return true;
    } catch (err) {
      console.warn('Native downloadAndInstallApk failed:', err);
      return false;
    }
  }
  return false;
}

/**
 * Cancels active in-app APK download
 */
export async function cancelApkDownloadDirect() {
  if (Platform.OS !== 'android') return false;

  if (NotificationBarModule && typeof NotificationBarModule.cancelApkDownload === 'function') {
    try {
      await NotificationBarModule.cancelApkDownload();
      return true;
    } catch (err) {
      console.warn('Native cancelApkDownload failed:', err);
      return false;
    }
  }
  return false;
}

/**
 * Directly launches the system installer for the downloaded APK
 */
export async function installDownloadedApkDirect() {
  if (Platform.OS !== 'android') return false;

  if (NotificationBarModule && typeof NotificationBarModule.installDownloadedApk === 'function') {
    try {
      const res = await NotificationBarModule.installDownloadedApk();
      return res;
    } catch (err) {
      console.warn('Native installDownloadedApk failed:', err);
      return false;
    }
  }
  return false;
}

/**
 * Checks if the app is permitted to install unknown apps (Android 8+)
 */
export async function canInstallUnknownAppsDirect() {
  if (Platform.OS !== 'android') return true;

  if (NotificationBarModule && typeof NotificationBarModule.canInstallUnknownApps === 'function') {
    try {
      return await NotificationBarModule.canInstallUnknownApps();
    } catch (err) {
      return false;
    }
  }
  return true;
}

/**
 * Opens system settings page for "Install unknown apps"
 */
export async function openUnknownAppsSettingsDirect() {
  if (Platform.OS !== 'android') return false;

  if (NotificationBarModule && typeof NotificationBarModule.openUnknownAppsSettings === 'function') {
    try {
      await NotificationBarModule.openUnknownAppsSettings();
      return true;
    } catch (err) {
      console.warn('Native openUnknownAppsSettings failed:', err);
      return false;
    }
  }
  return false;
}

/**
 * Listens for in-app download progress (0 to 100%)
 */
export function addDownloadProgressListener(callback) {
  if (Platform.OS !== 'android') return { remove: () => {} };

  return DeviceEventEmitter.addListener('onDownloadProgress', (data) => {
    if (typeof callback === 'function') {
      callback(data);
    }
  });
}

/**
 * Returns native app version and build code
 */
export async function getNativeAppVersion() {
  let fallbackVersion = '1.12';
  try {
    const { CURRENT_APP_VERSION } = require('./updateService');
    if (CURRENT_APP_VERSION) {
      fallbackVersion = CURRENT_APP_VERSION.replace(/^v/i, '');
    }
  } catch {}

  if (Platform.OS !== 'android' || !NotificationBarModule) {
    return { versionName: fallbackVersion, versionCode: 12 };
  }
  try {
    return await NotificationBarModule.getAppVersion();
  } catch (err) {
    return { versionName: fallbackVersion, versionCode: 12 };
  }
}

/**
 * Updates the Android home screen widget with latest quote & streak
 */
export async function updateNativeWidget(quote, author, streak = 1) {
  if (Platform.OS !== 'android' || !NotificationBarModule) return;
  try {
    if (typeof NotificationBarModule.updateWidget === 'function') {
      await NotificationBarModule.updateWidget(quote || '', author || '', Number(streak) || 1);
    }
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Syncs the user's today tasks to the top notification bar
 */
export async function syncTasksToNotificationBar(tasks = []) {
  if (Platform.OS !== 'android' || !NotificationBarModule) return;
  try {
    if (!tasks || tasks.length === 0) {
      if (typeof NotificationBarModule.cancelTasksNotification === 'function') {
        NotificationBarModule.cancelTasksNotification();
      }
      return;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const sorted = sortTasksChronologically(tasks);
    const completedCount = sorted.filter((t) => t.status === 'completed').length;
    const totalCount = sorted.length;
    const remainingCount = totalCount - completedCount;

    const title = `📋 Today's Tasks (${completedCount}/${totalCount} Done)`;
    const summary =
      remainingCount === 0
        ? 'All tasks completed! Unstoppable momentum.'
        : `${remainingCount} task${remainingCount > 1 ? 's' : ''} remaining today`;

    // Map tasks to simple serializable objects for native code (sorted chronologically AM -> PM)
    const taskItems = sorted.slice(0, 10).map((t) => ({
      title: t.title || 'Untitled task',
      status: t.status || 'pending',
    }));

    if (typeof NotificationBarModule.showTasksNotification === 'function') {
      NotificationBarModule.showTasksNotification(
        title,
        summary,
        taskItems,
        completedCount,
        totalCount
      );
    }
  } catch (err) {
    // Non-blocking fail-safe
  }
}

/**
 * Dismisses the tasks notification from the top bar
 */
export function cancelTasksNotification() {
  if (Platform.OS !== 'android' || !NotificationBarModule) return;
  try {
    if (typeof NotificationBarModule.cancelTasksNotification === 'function') {
      NotificationBarModule.cancelTasksNotification();
    }
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Syncs the active timer / session countdown to Android's top notification bar
 */
export async function syncTimerToNotificationBar(
  title,
  summary,
  targetEndTimeMillis,
  isRunning,
  currentSession = 1,
  totalSessions = 3
) {
  if (Platform.OS !== 'android' || !NotificationBarModule) return;
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    if (typeof NotificationBarModule.showTimerNotification === 'function') {
      NotificationBarModule.showTimerNotification(
        title,
        summary,
        targetEndTimeMillis,
        Boolean(isRunning),
        currentSession,
        totalSessions
      );
    }
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Dismisses the timer notification from the top bar
 */
export function cancelTimerNotification() {
  if (Platform.OS !== 'android' || !NotificationBarModule) return;
  try {
    if (typeof NotificationBarModule.cancelTimerNotification === 'function') {
      NotificationBarModule.cancelTimerNotification();
    }
  } catch (err) {
    // Non-blocking
  }
}


