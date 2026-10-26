import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import SyncStatusBar from '../../components/SyncStatusBar';
import EmptyState from '../../components/EmptyState';
import ContributionHeatmap from '../home/components/ContributionHeatmap';
import { authApi } from '../../api/authApi';
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  X,
  Calendar,
  Flame,
  CheckCircle,
  Target,
  Award,
  BookOpen,
  Lock,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function CommunityScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [followingMap, setFollowingMap] = useState({});
  const searchTimeoutRef = useRef(null);

  const fetchUsers = async (searchQuery = '') => {
    setIsLoading(true);
    try {
      const res = await authApi.searchUsers(searchQuery);
      const data = res.data?.data;
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real users on mount
  useEffect(() => {
    fetchUsers('');
  }, []);

  // Search as user types with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = query.trim();
    setIsLoading(true);

    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers(trimmed);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  const handleOpenProfile = async (user) => {
    setSelectedUser(user);
    setPublicProfile(null);
    setIsLoadingProfile(true);

    try {
      const target = user.user || user._id || user.name;
      const res = await authApi.getPublicProfile(target);
      if (res.data?.data) {
        setPublicProfile(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to load public profile:', e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const toggleFollow = async (user) => {
    const id = user.user || user._id || user.username || user.name;
    const isNowFollowing = !followingMap[id];
    setFollowingMap((prev) => ({ ...prev, [id]: isNowFollowing }));

    try {
      const target = user.username || user.name || user.user || user._id;
      if (isNowFollowing) {
        await authApi.followUser(target).catch(() => {});
      } else {
        await authApi.unfollowUser(target).catch(() => {});
      }
    } catch {
      // Keep optimistic state
    }
  };

  const displayUser = publicProfile?.profile || selectedUser;
  const stats = publicProfile?.stats || {};
  const heatmap = publicProfile?.heatmap || [];
  const badges = publicProfile?.badges || [];
  const publicJournals = publicProfile?.journals || [];

  return (
    <View className="flex-1 bg-momentum-bg">
      <AppHeader navigation={navigation} title="Community" />
      <SyncStatusBar />

      {/* Search Input Bar */}
      <View className="p-4 pb-2">
        <View className="flex-row items-center bg-momentum-card border border-momentum-border rounded-xl px-3.5 py-2.5">
          <Search size={16} color={colors.emerald.bright} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search builders by name or tagline..."
            placeholderTextColor={colors.text.disabled}
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 text-xs text-momentum-textPrimary ml-2 py-0"
          />
          {isLoading ? (
            <ActivityIndicator size="small" color="#00E676" />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={15} color="#5E6D62" />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text className="text-[10px] text-momentum-textMuted mt-1.5 ml-1">
          {query ? `Showing results for "${query}"` : 'Community builders • Tap any profile to view consistency & streaks'}
        </Text>
      </View>

      {/* Developers List */}
      <FlatList
        data={results}
        keyExtractor={(item) => item._id || item.user || item.username || item.name}
        contentContainerStyle={{ padding: 16, paddingTop: 6, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const userKey = item.user || item._id || item.username || item.name;
          const isFollowing = !!followingMap[userKey];
          const initials = item.name
            ? item.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()
            : 'U';

          return (
            <TouchableOpacity
              onPress={() => handleOpenProfile(item)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-momentum-card border border-momentum-border"
            >
              {/* Left: Avatar + Details */}
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View className="w-10 h-10 rounded-full bg-[#0D241C] border border-[#183B25] items-center justify-center overflow-hidden">
                  {item.profilePic ? (
                    <Image source={{ uri: item.profilePic }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Text className="text-xs font-bold text-momentum-emerald font-mono">
                      {initials}
                    </Text>
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold text-white" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-[11px] text-momentum-emerald font-mono">
                    @{item.username || item.name?.toLowerCase().replace(/\s+/g, '')}
                  </Text>
                  <Text className="text-[11px] text-momentum-textSecondary mt-0.5" numberOfLines={1}>
                    {item.tagline || 'Builder • Learner • Thinker'}
                  </Text>
                </View>
              </View>

              {/* Right: Follow Button */}
              <TouchableOpacity
                onPress={() => toggleFollow(item)}
                activeOpacity={0.8}
                className={`p-2 rounded-xl border ${
                  isFollowing
                    ? 'bg-[#0D241C] border-momentum-emerald'
                    : 'bg-momentum-surface border-momentum-border'
                }`}
              >
                {isFollowing ? (
                  <UserCheck size={16} color={colors.emerald.bright} />
                ) : (
                  <UserPlus size={16} color="#8FA396" />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={Users}
              title={query ? 'No builders found' : 'No Community Members Yet'}
              description={
                query
                  ? `No builders found matching "${query}". Try searching another name.`
                  : 'Start connecting with peers as other developers register on Mommenttum.'
              }
            />
          ) : null
        }
      />

      {/* User Profile Detail Modal (Consistency & Streaks, No Private Tasks) */}
      <Modal
        visible={!!selectedUser}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View className="flex-1 bg-black/85 justify-end">
          <View className="bg-[#0D120F] border-t-2 border-momentum-emerald rounded-t-3xl max-h-[88%] p-5 pb-8">
            {/* Top Bar with Title and Close Button */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Flame size={18} color="#00E676" />
                <Text className="text-sm font-bold text-white tracking-tight">
                  Builder Consistency Profile
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedUser(null)}
                className="w-7 h-7 rounded-full bg-[#18241B] items-center justify-center"
              >
                <X size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Avatar & Info Card */}
              <View className="bg-momentum-card border border-momentum-border rounded-2xl p-4 mb-4 items-center">
                <View className="w-16 h-16 rounded-full bg-[#06170d] border-2 border-momentum-emerald items-center justify-center overflow-hidden mb-2.5">
                  {displayUser?.profilePic ? (
                    <Image source={{ uri: displayUser.profilePic }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Text className="text-xl font-bold text-momentum-emerald font-mono">
                      {displayUser?.name
                        ? displayUser.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()
                        : 'U'}
                    </Text>
                  )}
                </View>

                <Text className="text-base font-bold text-white text-center">
                  {displayUser?.name}
                </Text>
                <Text className="text-xs font-semibold text-momentum-emerald font-mono mt-0.5">
                  @{displayUser?.username || displayUser?.name?.toLowerCase().replace(/\s+/g, '')}
                </Text>
                <Text className="text-xs text-momentum-textSecondary text-center mt-2 px-2">
                  "{displayUser?.tagline || 'Builder • Learner • Thinker'}"
                </Text>

                {/* Follow Button */}
                <TouchableOpacity
                  onPress={() => toggleFollow(displayUser)}
                  activeOpacity={0.8}
                  className={`w-full mt-3.5 py-2.5 rounded-xl border flex-row items-center justify-center gap-2 ${
                    followingMap[displayUser?.user || displayUser?._id || displayUser?.username || displayUser?.name]
                      ? 'bg-[#18241B] border-momentum-emerald'
                      : 'bg-momentum-emerald border-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      followingMap[displayUser?.user || displayUser?._id || displayUser?.username || displayUser?.name]
                        ? 'text-momentum-emerald'
                        : 'text-black'
                    }`}
                  >
                    {followingMap[displayUser?.user || displayUser?._id || displayUser?.username || displayUser?.name]
                      ? 'Following ✓'
                      : '+ Follow Builder'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingProfile ? (
                <View className="py-12 items-center justify-center">
                  <ActivityIndicator size="small" color="#00E676" />
                  <Text className="text-xs text-momentum-textSecondary mt-2">
                    Loading consistency & streak data...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Streak & Consistency Metric Cards */}
                  <View className="flex-row gap-2.5 mb-4">
                    {/* Current Streak */}
                    <View className="flex-1 bg-momentum-card border border-momentum-border rounded-xl p-3 items-center">
                      <Flame size={18} color="#F59E0B" />
                      <Text className="text-base font-bold text-white font-mono mt-1">
                        {stats.currentStreak || 0}
                      </Text>
                      <Text className="text-[10px] text-momentum-textSecondary uppercase tracking-wider font-semibold">
                        Day Streak
                      </Text>
                    </View>

                    {/* Tasks Completed */}
                    <View className="flex-1 bg-momentum-card border border-momentum-border rounded-xl p-3 items-center">
                      <CheckCircle size={18} color="#00E676" />
                      <Text className="text-base font-bold text-white font-mono mt-1">
                        {stats.totalCompleted || 0}
                      </Text>
                      <Text className="text-[10px] text-momentum-textSecondary uppercase tracking-wider font-semibold">
                        Completed
                      </Text>
                    </View>

                    {/* Consistency Rate */}
                    <View className="flex-1 bg-momentum-card border border-momentum-border rounded-xl p-3 items-center">
                      <Target size={18} color="#38BDF8" />
                      <Text className="text-base font-bold text-white font-mono mt-1">
                        {stats.avgCompletion || 0}%
                      </Text>
                      <Text className="text-[10px] text-momentum-textSecondary uppercase tracking-wider font-semibold">
                        Consistency
                      </Text>
                    </View>
                  </View>

                  {/* Public Heatmap */}
                  <View className="mb-2">
                    <ContributionHeatmap heatmapData={heatmap} showLegend={true} />
                  </View>

                  {/* Badges Earned */}
                  {badges.length > 0 && (
                    <View className="bg-momentum-card border border-momentum-border rounded-2xl p-3.5 mb-4">
                      <View className="flex-row items-center gap-2 mb-2.5">
                        <Award size={15} color={colors.emerald.bright} />
                        <Text className="text-xs font-bold text-white">
                          Unlocked Badges ({badges.length})
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap gap-2">
                        {badges.map((b, idx) => (
                          <View
                            key={b._id || idx}
                            className="bg-[#09150D] border border-momentum-emerald/40 px-2.5 py-1.5 rounded-lg flex-row items-center gap-1.5"
                          >
                            <Award size={12} color="#00E676" />
                            <Text className="text-[11px] font-semibold text-white">
                              {b.title || b.name || 'Consistency Master'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Public Notes (If any shared notes exist) */}
                  {publicJournals.length > 0 && (
                    <View className="bg-momentum-card border border-momentum-border rounded-2xl p-3.5 mb-4">
                      <View className="flex-row items-center gap-2 mb-2.5">
                        <BookOpen size={15} color={colors.emerald.bright} />
                        <Text className="text-xs font-bold text-white">
                          Public Shared Notes ({publicJournals.length})
                        </Text>
                      </View>
                      {publicJournals.map((j, idx) => (
                        <View key={j._id || idx} className="p-2.5 rounded-xl bg-momentum-surface mb-2 border border-momentum-border">
                          {j.title ? (
                            <Text className="text-xs font-bold text-white mb-0.5">{j.title}</Text>
                          ) : null}
                          <Text className="text-[11px] text-momentum-textSecondary" numberOfLines={2}>
                            {j.content}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Privacy Assurance Banner */}
                  <View className="p-3 rounded-xl bg-[#08120B] border border-momentum-border flex-row items-center gap-2 mb-4">
                    <Lock size={13} color="#8FA396" />
                    <Text className="text-[10px] text-momentum-textSecondary flex-1 leading-4">
                      Personal task details are strictly private to this user. Only overall consistency, streaks, and public milestones are displayed.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
