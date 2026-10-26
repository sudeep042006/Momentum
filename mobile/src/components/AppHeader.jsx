import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Bell, ArrowLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { colors } from '../theme/colors';

export default function AppHeader({ navigation, title, onProfilePress, onNotificationPress }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  let unreadCount = 0;
  try {
    const notifContext = useNotifications();
    unreadCount = notifContext?.unreadCount || 0;
  } catch {
    unreadCount = 0;
  }

  const name = user?.name || user?.user_metadata?.name || 'Sudeep';
  const profilePic = user?.profilePic || user?.user_metadata?.profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Android punch hole & camera cutout safety:
  // Front camera punch holes on modern devices (Samsung, OnePlus, Asus, Xiaomi)
  // are typically 30-40dp from the top. Using at least 52dp on Android ensures
  // the entire navbar is strictly below the camera view.
  const statusBarHeight = StatusBar.currentHeight || 0;
  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top + 8, statusBarHeight + 14, 52)
    : Math.max(insets.top, 44);

  return (
    <View
      style={{
        paddingTop: topPadding,
      }}
      className="bg-momentum-bg border-b border-momentum-border px-4 pb-3"
    >
      <View className="flex-row items-center justify-between">
        {/* Left: Either Back Button + Title OR Hamburger + ECG Pulse Logo */}
        {title ? (
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => navigation?.goBack?.()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-1 -ml-1"
            >
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text className="text-base font-bold text-white tracking-tight">
              {title}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2.5">
            <TouchableOpacity
              onPress={() => navigation?.openDrawer?.()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-1 -ml-1"
            >
              <Menu size={22} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>

            {/* Green Pulse ECG Logo */}
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M2 13h4l3-8 4 16 3-8h6"
                stroke="#00E676"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>

            <View className="ml-0.5">
              <Text className="text-[13px] font-black text-white tracking-widest">
                MOMMENTTUM
              </Text>
              <Text className="text-[7.5px] font-mono tracking-widest text-[#5E6D62] font-semibold mt-0.5">
                DISCIPLINE EQUALS FREEDOM.
              </Text>
            </View>
          </View>
        )}

        {/* Right: Notifications Bell + Avatar */}
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => {
              if (typeof onNotificationPress === 'function') {
                onNotificationPress();
              } else {
                navigation?.navigate?.('Notifications');
              }
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="relative p-1"
          >
            <Bell size={20} color="#FFFFFF" strokeWidth={2} />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full bg-momentum-emerald items-center justify-center px-1 border border-[#060806]">
                <Text className="text-[9.5px] font-black text-black leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (typeof onProfilePress === 'function') {
                onProfilePress();
              } else {
                navigation?.navigate?.('MainTabs', { screen: 'Profile' });
              }
            }}
            activeOpacity={0.8}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#243629] items-center justify-center bg-[#0D241C]"
          >
            {profilePic ? (
              <Image source={{ uri: profilePic }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Text className="text-[11px] font-bold text-momentum-emerald font-mono">
                {initials || 'SK'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
