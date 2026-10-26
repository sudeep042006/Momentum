import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator, { navigateGlobal } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { TaskProvider } from './src/context/TaskContext';
import { SyncProvider } from './src/context/SyncContext';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';
import UpdateModal from './src/components/UpdateModal';
import { checkForAppUpdate } from './src/services/updateService';
import {
  getInitialNotification,
  addNotificationClickListener,
  requestNotificationPermission,
} from './src/services/systemNotificationService';

function AppContent() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { addLocalNotification } = useNotifications();

  const handleNotificationAction = async (data) => {
    if (!data || !data.actionType) return;
    const { actionType, payload } = data;

    if (actionType === 'UPDATE') {
      // User tapped Update notification in status bar -> show Update Modal popup
      const info = await checkForAppUpdate({ ignoreSnooze: true });
      if (info && info.hasUpdate) {
        setUpdateInfo(info);
      } else if (payload && payload.downloadUrl) {
        setUpdateInfo({
          hasUpdate: true,
          latestVersion: payload.version || 'Latest',
          currentVersion: 'v1.0.0',
          releaseNotes: 'Performance improvements and bug fixes.',
          downloadUrl: payload.downloadUrl,
        });
      }
      setShowUpdateModal(true);
    } else if (actionType === 'MILESTONES') {
      navigateGlobal('Milestones');
    } else if (actionType === 'TASKS') {
      navigateGlobal('MainTabs');
    } else if (actionType === 'NOTIFICATIONS') {
      navigateGlobal('Notifications');
    } else {
      navigateGlobal('Notifications');
    }
  };

  const performUpdateCheck = useCallback(async (isManual = false) => {
    try {
      const info = await checkForAppUpdate({ ignoreSnooze: isManual });
      if (info && info.hasUpdate) {
        if (!info.isSnoozed || isManual) {
          setUpdateInfo(info);
          setShowUpdateModal(true);

          const verLabel = (info.latestVersion || '').startsWith('v')
            ? info.latestVersion
            : `v${info.latestVersion}`;

          // Add real notification to In-App alerts AND Android status bar
          addLocalNotification({
            title: `Momentum ${verLabel} Available`,
            message: 'A new release build is ready. Tap to download and install the update.',
            type: 'update',
            metadata: { version: info.latestVersion, downloadUrl: info.downloadUrl },
          });
        }
      }
    } catch {
      // Non-blocking fail-safe
    }
  }, [addLocalNotification]);

  useEffect(() => {
    // Proactively request notification permission on Android 13+
    requestNotificationPermission();

    // 1. Cold start: user clicked notification while app was closed
    getInitialNotification().then((data) => {
      if (data) {
        handleNotificationAction(data);
      }
    });

    // 2. Warm start: user clicked notification while app was running in background
    const sub = addNotificationClickListener((data) => {
      if (data) {
        handleNotificationAction(data);
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    // Initial check shortly after app launch
    const timer = setTimeout(() => {
      performUpdateCheck(false);
    }, 2000);

    // Periodic check every 3 minutes (catches new builds finished in GitHub Actions)
    const interval = setInterval(() => {
      performUpdateCheck(false);
    }, 3 * 60 * 1000);

    // Re-check whenever user returns from background to foreground
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        performUpdateCheck(false);
      }
    });

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [performUpdateCheck]);

  return (
    <>
      <RootNavigator />
      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        onClose={() => setShowUpdateModal(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <AuthProvider>
        <SyncProvider>
          <TaskProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </TaskProvider>
        </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
