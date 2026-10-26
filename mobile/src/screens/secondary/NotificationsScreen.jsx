import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import SyncStatusBar from '../../components/SyncStatusBar';
import UpdateModal from '../../components/UpdateModal';
import { checkForAppUpdate } from '../../services/updateService';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  Target,
  Sparkles,
  Flame,
  CheckCircle2,
  Info,
  Clock,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function NotificationsScreen({ navigation }) {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (item) => {
    if (!item.isRead) {
      markAsRead(item._id || item.id);
    }

    if (item.type === 'update') {
      // User tapped update alert -> open the Update Modal!
      const info = await checkForAppUpdate({ ignoreSnooze: true });
      if (info && info.hasUpdate) {
        setUpdateInfo(info);
      } else if (item.metadata?.downloadUrl) {
        setUpdateInfo({
          hasUpdate: true,
          latestVersion: item.metadata.version || 'Latest',
          currentVersion: 'v1.0.0',
          releaseNotes: item.message || 'Performance improvements and bug fixes.',
          downloadUrl: item.metadata.downloadUrl,
        });
      }
      setShowUpdateModal(true);
    } else if (item.type === 'milestone') {
      navigation?.navigate?.('Milestones');
    } else if (item.type === 'task' || item.type === 'streak') {
      navigation?.navigate?.('MainTabs', { screen: 'Home' });
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'milestone':
        return <Target size={18} color="#00E676" />;
      case 'update':
        return <Sparkles size={18} color="#A78BFA" />;
      case 'streak':
        return <Flame size={18} color="#F59E0B" />;
      case 'task':
        return <CheckCircle2 size={18} color="#00E676" />;
      default:
        return <Bell size={18} color="#00E676" />;
    }
  };

  const renderNotificationItem = ({ item }) => {
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleNotificationPress(item)}
        className={`mb-3 p-4 rounded-xl border ${
          isUnread
            ? 'bg-[#0E1611] border-[#00E676]/40'
            : 'bg-momentum-card border-momentum-border'
        }`}
        style={{
          borderLeftWidth: isUnread ? 4 : 1,
          borderLeftColor: isUnread ? '#00E676' : '#18241B',
        }}
      >
        <View className="flex-row items-start justify-between gap-3">
          {/* Icon Badge */}
          <View
            className={`w-9 h-9 rounded-lg items-center justify-center ${
              isUnread ? 'bg-[#00E676]/15' : 'bg-[#141E17]'
            }`}
          >
            {getNotificationIcon(item.type)}
          </View>

          {/* Text Content */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className={`text-[14px] font-bold ${
                  isUnread ? 'text-white' : 'text-[#D1D5DB]'
                }`}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {isUnread && (
                <View className="w-2 h-2 rounded-full bg-[#00E676] ml-2" />
              )}
            </View>

            <Text className="text-[12.5px] text-[#8E9F92] leading-5 mb-2.5">
              {item.message}
            </Text>

            {/* Bottom Meta */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Clock size={11} color="#5E6D62" />
                <Text className="text-[11px] font-mono text-[#5E6D62]">
                  {formatTimestamp(item.createdAt)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => deleteNotification(item._id || item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-1"
                activeOpacity={0.6}
              >
                <Trash2 size={13} color="#5E6D62" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <View className="w-16 h-16 rounded-full bg-[#0D241C] border border-[#243629] items-center justify-center mb-4">
        <Bell size={28} color="#00E676" />
      </View>
      <Text className="text-base font-bold text-white mb-2 text-center tracking-tight">
        You're All Caught Up
      </Text>
      <Text className="text-[13px] text-[#5E6D62] text-center max-w-[280px] leading-5">
        No active notifications. When milestone deadlines approach, streak alerts trigger, or app updates arrive, they will appear here in real time.
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-momentum-bg">
      <AppHeader navigation={navigation} title="Notifications" />
      <SyncStatusBar />

      {/* Action / Counter Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-momentum-border bg-[#080D09]">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-mono font-bold tracking-widest text-white uppercase">
            ALERTS
          </Text>
          {unreadCount > 0 ? (
            <View className="px-2 py-0.5 rounded-full bg-[#00E676]/20 border border-[#00E676]/40">
              <Text className="text-[10px] font-mono font-bold text-[#00E676]">
                {unreadCount} UNREAD
              </Text>
            </View>
          ) : (
            <View className="px-2 py-0.5 rounded-full bg-[#18241B]">
              <Text className="text-[10px] font-mono text-[#5E6D62]">
                0 UNREAD
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#142318] border border-[#233B2A]"
            >
              <CheckCheck size={13} color="#00E676" />
              <Text className="text-[11px] font-medium text-[#00E676]">
                Mark read
              </Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowClearConfirm(true)}
              activeOpacity={0.7}
              className="p-1.5 rounded-lg bg-[#18241B]"
            >
              <Trash2 size={14} color="#8E9F92" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item, index) => item._id || item.id || `notif_${index}`}
        renderItem={renderNotificationItem}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
          flexGrow: notifications.length === 0 ? 1 : undefined,
        }}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00E676"
            colors={['#00E676']}
          />
        }
      />

      {/* Clear All Confirmation Modal */}
      <Modal
        visible={showClearConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearConfirm(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-5">
          <View className="w-full max-w-sm bg-[#0D120F] border border-[#18241B] rounded-2xl p-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-white">
                Clear All Notifications?
              </Text>
              <TouchableOpacity
                onPress={() => setShowClearConfirm(false)}
                className="p-1"
              >
                <X size={18} color="#8E9F92" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-[#8E9F92] leading-5 mb-5">
              This will remove all current alerts. Genuine future reminders and updates will continue to arrive automatically.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#243629] items-center"
              >
                <Text className="text-xs font-bold text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowClearConfirm(false);
                  clearAll();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/50 items-center"
              >
                <Text className="text-xs font-bold text-red-400">Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* In-App Update Modal for Update Alerts */}
      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        onClose={() => setShowUpdateModal(false)}
      />
    </View>
  );
}
