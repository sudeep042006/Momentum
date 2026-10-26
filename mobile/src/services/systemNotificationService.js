import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

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

export async function showSystemNotification(title, message, id = Math.floor(Math.random() * 100000)) {
  if (Platform.OS !== 'android') return;

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    if (NotificationBarModule && typeof NotificationBarModule.showNotification === 'function') {
      NotificationBarModule.showNotification(title, message, id);
    }
  } catch (err) {
    // Non-blocking fail-safe
  }
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
