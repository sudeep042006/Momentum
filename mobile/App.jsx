import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { TaskProvider } from './src/context/TaskContext';
import { SyncProvider } from './src/context/SyncContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <AuthProvider>
        <SyncProvider>
          <TaskProvider>
            <RootNavigator />
          </TaskProvider>
        </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
