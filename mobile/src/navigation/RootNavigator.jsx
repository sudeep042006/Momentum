import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';

export const navigationRef = createNavigationContainerRef();

let pendingNavigation = null;

export function navigateGlobal(name, params) {
  if (navigationRef.isReady()) {
    try {
      navigationRef.navigate(name, params);
    } catch (e) {
      pendingNavigation = { name, params };
    }
  } else {
    pendingNavigation = { name, params };
  }
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated && pendingNavigation && navigationRef.isReady()) {
      const target = pendingNavigation;
      pendingNavigation = null;
      setTimeout(() => {
        try {
          navigationRef.navigate(target.name, target.params);
        } catch (e) {
          console.warn('Deferred navigateGlobal error:', e);
        }
      }, 100);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (!isLoading && isAuthenticated && pendingNavigation) {
          try {
            navigationRef.navigate(pendingNavigation.name, pendingNavigation.params);
          } catch (e) {
            console.warn('Deferred navigateGlobal error:', e);
          }
          pendingNavigation = null;
        }
      }}
    >
      {isLoading ? (
        <View className="flex-1 bg-black items-center justify-center" style={{ backgroundColor: '#000000' }}>
          <ActivityIndicator size="small" color="#00E676" />
        </View>
      ) : isAuthenticated ? (
        <DrawerNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
