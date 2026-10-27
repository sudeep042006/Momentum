import { NativeModules, Platform, PermissionsAndroid, DeviceEventEmitter } from 'react-native';

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
