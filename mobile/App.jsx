import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator, { navigateGlobal } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { TaskProvider } from './src/context/TaskContext';
import { SyncProvider } from './src/context/SyncContext';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';
import UpdateModal from './src/components/UpdateModal';
import { checkForAppUpdate } from './src/services/updateService';
import { getInitialNotification, addNotificationClickListener } from './src/services/systemNotificationService';

function AppContent() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { addLocalNotification } = useNotifications();
  const hasCheckedRef = useRef(false);

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

  useEffect(() => {
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
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // Check for updates shortly after app launch
    const timer = setTimeout(async () => {
      const info = await checkForAppUpdate();
      if (info && info.hasUpdate && !info.isSnoozed) {
        setUpdateInfo(info);
        setShowUpdateModal(true);

        // Add real notification to In-App alerts AND Android status bar
        addLocalNotification({
          title: `Mommenttum v${info.latestVersion} Available`,
          message: 'A new release build is ready. Tap to download and install the update.',
          type: 'update',
          metadata: { version: info.latestVersion, downloadUrl: info.downloadUrl },
        });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [addLocalNotification]);

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
