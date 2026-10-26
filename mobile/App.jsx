import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { TaskProvider } from './src/context/TaskContext';
import { SyncProvider } from './src/context/SyncContext';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';
import UpdateModal from './src/components/UpdateModal';
import { checkForAppUpdate } from './src/services/updateService';

function AppContent() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { addLocalNotification } = useNotifications();

  useEffect(() => {
    // Check for updates shortly after app launch
    const timer = setTimeout(async () => {
      const info = await checkForAppUpdate();
      if (info && info.hasUpdate) {
        setUpdateInfo(info);
        setShowUpdateModal(true);

        // Add real notification to In-App alerts AND Android status bar
        addLocalNotification({
          title: `Mommenttum v${info.latestVersion} Available`,
          message: 'A new release build is ready. Tap to download and install the update.',
          type: 'update',
          metadata: { version: info.latestVersion, downloadUrl: info.apkDownloadUrl },
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
