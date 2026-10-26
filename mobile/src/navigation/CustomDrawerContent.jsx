import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  BookOpen,
  Calendar,
  User,
  CheckSquare,
  Clock,
  Users,
  Target,
  BarChart2,
  Cpu,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  X,
  Bell,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useNotifications } from '../context/NotificationContext';
import { colors } from '../theme/colors';

export default function CustomDrawerContent({ navigation, state }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  
  let unreadCount = 0;
  try {
    const notifContext = useNotifications();
    unreadCount = notifContext?.unreadCount || 0;
  } catch {
    unreadCount = 0;
  }

  const name = user?.name || user?.user_metadata?.name || 'Sudeep Kuralkar';
  const handle = user?.username || user?.user_metadata?.username || '@sudeepkuralkar';
  const profilePic = user?.profilePic || user?.user_metadata?.profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const navigateToTab = (tabName) => {
    navigation.navigate('MainTabs', { screen: tabName });
    navigation.closeDrawer();
  };

  const navigateToScreen = (screenName, params = {}) => {
    navigation.navigate(screenName, params);
    navigation.closeDrawer();
  };

  const [modalInfo, setModalInfo] = useState(null);

  const handleLogout = () => {
    setModalInfo({
      title: 'Sign Out',
      icon: LogOut,
      message: 'Are you sure you want to sign out of Mommenttum? Your local offline changes are safely stored on device.',
      isConfirm: true,
      isDestructive: true,
      confirmText: 'Sign Out',
      onConfirm: async () => {
        navigation.closeDrawer();
        if (logout) await logout();
      },
    });
  };

  const currentTab = state?.routes[0]?.state?.routes[state?.routes[0]?.state?.index || 0]?.name || 'Home';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#060806',
        paddingTop: Math.max(insets.top, 14),
        paddingBottom: Math.max(insets.bottom, 14),
      }}
    >
      {/* Drawer Header */}
      <View className="flex-row items-center justify-between px-5 pb-4 border-b border-momentum-border">
        <View className="flex-row items-center gap-2.5">
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M2 13h4l3-8 4 16 3-8h6"
              stroke="#00E676"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <View>
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-[13px] font-black text-white tracking-widest"
            >
              MOMMENTTUM
            </Text>
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-[7.5px] font-mono tracking-widest text-[#5E6D62] font-semibold"
            >
              DISCIPLINE EQUALS FREEDOM.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.closeDrawer()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="p-1 -mr-1"
        >
          <X size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-3 py-3" showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <TouchableOpacity
          onPress={() => navigateToTab('Profile')}
          activeOpacity={0.8}
          className="flex-row items-center justify-between p-3 rounded-2xl bg-momentum-card border border-momentum-border mb-4"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-11 h-11 rounded-full bg-[#0D241C] border border-[#1B3624] items-center justify-center overflow-hidden">
              {profilePic ? (
                <Image source={{ uri: profilePic }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-sm font-bold text-momentum-emerald font-mono">
                  {initials}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                className="text-xs font-bold text-white tracking-tight"
              >
                {name}
              </Text>
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                className="text-[10px] font-mono text-momentum-textSecondary"
              >
                {handle}
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-momentum-emerald" />
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-[9.5px] text-momentum-textSecondary"
                >
                  Developer
                </Text>
              </View>
            </View>
          </View>

          <ChevronRight size={15} color={colors.text.muted} />
        </TouchableOpacity>

        {/* Primary Tabs */}
        <TouchableOpacity
          onPress={() => navigateToTab('Home')}
          className={`flex-row items-center gap-3 px-3 py-2.5 rounded-xl mb-1 ${
            currentTab === 'Home' ? 'bg-[#0D261C]' : 'bg-transparent'
          }`}
        >
          <Home
            size={17}
            color={currentTab === 'Home' ? colors.emerald.bright : colors.text.secondary}
          />
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            className={`text-xs font-semibold ${
              currentTab === 'Home' ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
            }`}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateToTab('Journal')}
          className={`flex-row items-center gap-3 px-3 py-2.5 rounded-xl mb-1 ${
            currentTab === 'Journal' ? 'bg-[#0D261C]' : 'bg-transparent'
          }`}
        >
          <BookOpen
            size={17}
            color={currentTab === 'Journal' ? colors.emerald.bright : colors.text.secondary}
          />
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            className={`text-xs font-semibold ${
              currentTab === 'Journal' ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
            }`}
          >
            Journal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateToTab('Schedule')}
          className={`flex-row items-center gap-3 px-3 py-2.5 rounded-xl mb-1 ${
            currentTab === 'Schedule' ? 'bg-[#0D261C]' : 'bg-transparent'
          }`}
        >
          <Calendar
            size={17}
            color={currentTab === 'Schedule' ? colors.emerald.bright : colors.text.secondary}
          />
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            className={`text-xs font-semibold ${
              currentTab === 'Schedule' ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
            }`}
          >
            Schedule
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateToTab('Profile')}
          className={`flex-row items-center gap-3 px-3 py-2.5 rounded-xl mb-4 ${
            currentTab === 'Profile' ? 'bg-[#0D261C]' : 'bg-transparent'
          }`}
        >
          <User
            size={17}
            color={currentTab === 'Profile' ? colors.emerald.bright : colors.text.secondary}
          />
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            className={`text-xs font-semibold ${
              currentTab === 'Profile' ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
            }`}
          >
            Profile
          </Text>
        </TouchableOpacity>

        {/* CORE FEATURES */}
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          className="text-[9.5px] font-mono uppercase tracking-wider font-semibold text-momentum-textMuted px-3 mb-1.5"
        >
          Core Features
        </Text>

        <TouchableOpacity
          onPress={() => navigateToTab('Home')}
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <CheckSquare size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              Tasks
            </Text>
          </View>
          <ChevronRight size={14} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateToTab('Schedule')}
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Clock size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              Schedule
            </Text>
          </View>
          <ChevronRight size={14} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateToScreen('Community')}
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-4"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Users size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              Users & Community
            </Text>
          </View>
          <ChevronRight size={14} color={colors.text.muted} />
        </TouchableOpacity>

        {/* PRODUCTIVITY TOOLS */}
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          className="text-[9.5px] font-mono uppercase tracking-wider font-semibold text-momentum-textMuted px-3 mb-1.5"
        >
          Productivity Tools
        </Text>

        <TouchableOpacity
          onPress={() => navigateToScreen('Milestones')}
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Target size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              Milestones
            </Text>
          </View>
          <ChevronRight size={14} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigateToScreen('ModulePlaceholder', {
              title: 'Analytics',
              description: 'In-depth velocity forecasting and productivity trends.',
            })
          }
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <BarChart2 size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              Analytics
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="px-2 py-0.5 rounded-md bg-[#162019]">
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                className="text-[8.5px] font-mono text-momentum-textMuted"
              >
                Coming Soon
              </Text>
            </View>
            <ChevronRight size={14} color={colors.text.muted} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigateToScreen('ModulePlaceholder', {
              title: 'Integrations',
              description: 'GitHub pull request sync, calendar exports, and webhooks.',
            })
          }
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-4"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Cpu size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              Integrations
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="px-2 py-0.5 rounded-md bg-[#162019]">
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                className="text-[8.5px] font-mono text-momentum-textMuted"
              >
                Coming Soon
              </Text>
            </View>
            <ChevronRight size={14} color={colors.text.muted} />
          </View>
        </TouchableOpacity>

        {/* SETTINGS & SUPPORT */}
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          className="text-[9.5px] font-mono uppercase tracking-wider font-semibold text-momentum-textMuted px-3 mb-1.5"
        >
          Settings & Support
        </Text>

        <TouchableOpacity
          onPress={() => navigateToScreen('Notifications')}
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Bell size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              Notifications
            </Text>
          </View>
          {unreadCount > 0 ? (
            <View className="px-2 py-0.5 rounded-md bg-[#00E676]/20 border border-[#00E676]/40">
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                className="text-[9px] font-mono font-bold text-[#00E676]"
              >
                {unreadCount} NEW
              </Text>
            </View>
          ) : (
            <ChevronRight size={14} color={colors.text.muted} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateToScreen('Settings')}
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Settings size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              Settings
            </Text>
          </View>
          <ChevronRight size={14} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setModalInfo({
              title: 'Help & Feedback',
              icon: HelpCircle,
              message:
                'Need help or want to share feedback?\n\nReach out to the Mommenttum developer support:\n• Email: support@momentum.dev\n• GitHub: github.com/sudeep042006/Momentum\n\nWe respond quickly to keep your streak and workflow uninterrupted.',
              confirmText: 'Got It',
            })
          }
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <HelpCircle size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              Help & Feedback
            </Text>
          </View>
          <ChevronRight size={14} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setModalInfo({
              title: 'About Mommenttum',
              icon: Info,
              message:
                'Mommenttum v1.0.0\nDeveloper Productivity Architecture\n\nBuilt for high-performance software engineers to master daily discipline, time blocking, journaling, and roadmap milestones with local-first offline resilience.\n\n"Discipline Equals Freedom."',
              confirmText: 'Understood',
            })
          }
          className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-4"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Info size={16} color={colors.text.secondary} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs text-momentum-textSecondary flex-1"
            >
              About
            </Text>
          </View>
          <ChevronRight size={14} color={colors.text.muted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Footer Logout */}
      <View className="p-3 border-t border-momentum-border">
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          className="flex-row items-center justify-between px-3.5 py-3 rounded-xl bg-[#1C0D0D] border border-[#3A1818]"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <LogOut size={16} color="#ef4444" />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs font-semibold text-red-400"
            >
              Logout
            </Text>
          </View>
          <ChevronRight size={14} color="#7F2D2D" />
        </TouchableOpacity>
      </View>

      {/* Custom Momentum UI Information / Confirmation Modal (Dark rectangle, green border, whitish text) */}
      <Modal
        visible={!!modalInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalInfo(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.82)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: '#0D120F',
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: '#00E676',
              padding: 22,
              shadowColor: '#00E676',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {modalInfo?.icon && (
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#132A1C',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <modalInfo.icon size={20} color="#00E676" />
                </View>
              )}
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>
                {modalInfo?.title}
              </Text>
            </View>

            {/* Whitish Description Text */}
            <Text style={{ fontSize: 13, color: '#D1DDD6', lineHeight: 20, marginBottom: 20 }}>
              {modalInfo?.message}
            </Text>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              {modalInfo?.isConfirm && (
                <TouchableOpacity
                  onPress={() => setModalInfo(null)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: '#18241B',
                  }}
                >
                  <Text style={{ color: '#8FA396', fontSize: 13, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (modalInfo?.onConfirm) modalInfo.onConfirm();
                  setModalInfo(null);
                }}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: modalInfo?.isDestructive ? '#EF4444' : '#00E676',
                }}
              >
                <Text
                  style={{
                    color: modalInfo?.isDestructive ? '#FFFFFF' : '#000000',
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  {modalInfo?.confirmText || 'Got It'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
