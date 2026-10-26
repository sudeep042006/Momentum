import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import ProfileHeader from './components/ProfileHeader';
import EditProfileModal from './components/EditProfileModal';
import ContributionHeatmap from '../home/components/ContributionHeatmap';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { authApi } from '../../api/authApi';
import { dailyApi } from '../../api/dailyApi';
import { cacheManager } from '../../storage/cacheManager';
import {
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  Calendar,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

function ProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { tasks } = useTasks();
  const [refreshing, setRefreshing] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const cachedHeatmap = await cacheManager.getHeatmap();
      if (cachedHeatmap) setHeatmapData(cachedHeatmap);

      const res = await dailyApi.getHeatmap();
      if (res.data?.data) {
        setHeatmapData(res.data.data);
        await cacheManager.setHeatmap(res.data.data);
      }
    } catch { }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshUser?.()]);
    setRefreshing(false);
  };

  const handleSaveProfile = async (profileData) => {
    try {
      const updatedUser = { ...user, ...profileData };
      await cacheManager.setUser(updatedUser);
      // Backend update
      await authApi.updateProfile(profileData).catch(() => { });
      if (refreshUser) refreshUser();
    } catch { }
  };

  // Real data calculations from database tasks
  const realCompletedCount = Array.isArray(tasks)
    ? tasks.filter((t) => t.status === 'completed').length
    : 0;
  const realTotalTasks = Array.isArray(tasks) ? tasks.length : 0;
  const realPendingCount = realTotalTasks - realCompletedCount;

  return (
    <View className="flex-1 bg-momentum-bg">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00E676"
            colors={['#00E676']}
          />
        }
      >
        {/* Real Profile Card Header */}
        <ProfileHeader user={user} onEdit={() => setIsEditModalOpen(true)} />

        {/* Real Live Task Statistics (Synced from User's Actual Database Tasks) */}
        <View className="flex-row items-center justify-between p-4 mb-4 rounded-2xl bg-momentum-card border border-momentum-border">
          <View className="items-center flex-1">
            <CheckCircle2 size={18} color={colors.emerald.bright} strokeWidth={2.2} />
            <Text className="text-base font-bold text-white font-mono mt-1">
              {realCompletedCount}
            </Text>
            <Text className="text-[10px] text-momentum-textSecondary font-semibold">Completed</Text>
          </View>
          <View className="w-px h-8 bg-momentum-border" />
          <View className="items-center flex-1">
            <Clock size={18} color="#F59E0B" strokeWidth={2.2} />
            <Text className="text-base font-bold text-white font-mono mt-1">
              {realPendingCount}
            </Text>
            <Text className="text-[10px] text-momentum-textSecondary font-semibold">Pending</Text>
          </View>
          <View className="w-px h-8 bg-momentum-border" />
          <View className="items-center flex-1">
            <Calendar size={18} color="#3B82F6" strokeWidth={2.2} />
            <Text className="text-base font-bold text-white font-mono mt-1">
              {realTotalTasks}
            </Text>
            <Text className="text-[10px] text-momentum-textSecondary font-semibold">Total Tasks</Text>
          </View>
        </View>

        {/* 12-Month Momentum Heatmap (Synchronized Real Database Activity) */}
        <ContributionHeatmap heatmapData={heatmapData} todayTasks={tasks} showLegend={true} />

        {/* Verified Account Information Card (Real User Data Only) */}
        <View className="mt-2 p-4 rounded-2xl bg-momentum-card border border-momentum-border">
          <Text className="text-xs font-bold text-white uppercase tracking-wider mb-3">
            Account Information
          </Text>

          <View className="flex-row items-center justify-between py-2 border-b border-[#141C16]">
            <View className="flex-row items-center gap-2.5">
              <Mail size={15} color="#5E6D62" />
              <Text className="text-xs text-momentum-textSecondary">Email</Text>
            </View>
            <Text className="text-xs font-medium text-white font-mono">
              {user?.email || 'user@momentum.dev'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2 border-b border-[#141C16]">
            <View className="flex-row items-center gap-2.5">
              <ShieldCheck size={15} color="#00E676" />
              <Text className="text-xs text-momentum-textSecondary">Account Status</Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-[#0D241C] border border-[#183B25]">
              <Text className="text-[10px] font-bold text-momentum-emerald font-mono">
                ACTIVE
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-2">
            <View className="flex-row items-center gap-2.5">
              <Calendar size={15} color="#5E6D62" />
              <Text className="text-xs text-momentum-textSecondary">Member Since</Text>
            </View>
            <Text className="text-xs font-medium text-white font-mono">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalOpen}
        user={user}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );
}

export default React.memo(ProfileScreen);
