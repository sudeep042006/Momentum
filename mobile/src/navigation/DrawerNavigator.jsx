import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabNavigator from './BottomTabNavigator';
import MilestonesScreen from '../screens/secondary/MilestonesScreen';
import CommunityScreen from '../screens/secondary/CommunityScreen';
import SettingsScreen from '../screens/secondary/SettingsScreen';
import ModulePlaceholderScreen from '../screens/secondary/ModulePlaceholderScreen';
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#060806',
          width: 300,
          borderRightWidth: 1,
          borderRightColor: '#18241B',
        },
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="MainTabs" component={BottomTabNavigator} />
      <Drawer.Screen name="Milestones" component={MilestonesScreen} />
      <Drawer.Screen name="Community" component={CommunityScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="ModulePlaceholder" component={ModulePlaceholderScreen} />
    </Drawer.Navigator>
  );
}
