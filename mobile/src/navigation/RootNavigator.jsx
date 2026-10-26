import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';

export const navigationRef = createNavigationContainerRef();

export function navigateGlobal(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-momentum-bg items-center justify-center">
        <ActivityIndicator size="small" color="#00E676" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <DrawerNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
