import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { TaskProvider } from './src/context/TaskContext';
import { SyncProvider } from './src/context/SyncContext';
import UpdateModal from './src/components/UpdateModal';
import { checkForAppUpdate } from './src/services/updateService';

export default function App() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    // Check for updates shortly after app launch
    const timer = setTimeout(async () => {
      const info = await checkForAppUpdate();
      if (info && info.hasUpdate) {
        setUpdateInfo(info);
        setShowUpdateModal(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <AuthProvider>
        <SyncProvider>
          <TaskProvider>
            <RootNavigator />
            <UpdateModal
              visible={showUpdateModal}
              updateInfo={updateInfo}
              onClose={() => setShowUpdateModal(false)}
            />
          </TaskProvider>
        </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
