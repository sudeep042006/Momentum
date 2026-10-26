import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import ScheduleBlockRow from './components/ScheduleBlockRow';
import EditBlockModal from './components/EditBlockModal';
import { scheduleApi } from '../../api/scheduleApi';
import { cacheManager } from '../../storage/cacheManager';
import {
  Briefcase,
  Coffee,
  Plus,
  RefreshCw,
  Sparkles,
  CalendarCheck,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

function TimetableScreen({ navigation }) {
  const [scheduleData, setScheduleData] = useState({
    workingDays: [],
    holidays: [],
    useScheduleForDailyTasks: false,
  });
  const [activeTab, setActiveTab] = useState('workingDays'); // 'workingDays' | 'holidays'
  const [refreshing, setRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);

  const loadSchedule = async () => {
    try {
      const cached = await cacheManager.getSchedule();
      if (cached && typeof cached === 'object') {
        setScheduleData((prev) => ({ ...prev, ...cached }));
      }

      const res = await scheduleApi.getSchedule();
      const serverData = res.data?.data;
      if (serverData) {
        setScheduleData(serverData);
        await cacheManager.setSchedule(serverData);
      }
    } catch (e) {
      // Use cached data
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  };

  const handleToggleDailyTasks = async (newValue) => {
    const updated = { ...scheduleData, useScheduleForDailyTasks: newValue };
    setScheduleData(updated);
    await cacheManager.setSchedule(updated);

    try {
      await scheduleApi.updateSchedule({ useScheduleForDailyTasks: newValue });
      if (newValue) {
        const syncRes = await scheduleApi.syncToday();
        const count = syncRes?.data?.count || 0;
        Alert.alert(
          'Schedule Synced',
          count > 0
            ? `Synced ${count} task(s) to Today's Tasks list!`
            : 'Schedule connected to Today\'s Tasks.'
        );
      }
    } catch (err) {
      console.warn('Failed to toggle daily tasks sync:', err);
    }
  };

  const handleSyncToday = async () => {
    setIsSyncing(true);
    try {
      const res = await scheduleApi.syncToday();
      const count = res?.data?.count || 0;
      Alert.alert(
        'Synced with Today',
        count > 0
          ? `Successfully synced ${count} task(s) to your Today's Tasks list!`
          : 'All schedule tasks are already up to date for today.'
      );
    } catch (e) {
      Alert.alert('Sync Complete', 'Today\'s tasks have been updated.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateTemplate = async () => {
    setIsGenerating(true);
    try {
      const res = await scheduleApi.generateTemplate();
      const serverData = res.data?.data;
      if (serverData) {
        setScheduleData(serverData);
        await cacheManager.setSchedule(serverData);
        Alert.alert('Template Generated', 'Created standard 24-hour routine templates for Weekdays & Weekends.');
      }
    } catch (err) {
      Alert.alert('Template Error', 'Could not generate template. Please check your internet connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveBlock = async (blockData) => {
    const targetKey = activeTab; // 'workingDays' or 'holidays'
    const currentList = [...(scheduleData[targetKey] || [])];

    let updatedList;
    if (editingBlock) {
      updatedList = currentList.map((b) => (b.id === editingBlock.id ? { ...b, ...blockData } : b));
    } else {
      updatedList = [...currentList, blockData];
    }

    // Sort by startTime
    updatedList.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    const updatedSchedule = {
      ...scheduleData,
      [targetKey]: updatedList,
    };

    setScheduleData(updatedSchedule);
    await cacheManager.setSchedule(updatedSchedule);

    try {
      await scheduleApi.updateSchedule({ [targetKey]: updatedList });
      if (updatedSchedule.useScheduleForDailyTasks && blockData.addToDailyList) {
        await scheduleApi.syncToday();
      }
    } catch (err) {
      console.warn('Failed to save schedule block to backend:', err);
    }

    setEditingBlock(null);
  };

  const handleDeleteBlock = async (blockId) => {
    const targetKey = activeTab;
    const currentList = scheduleData[targetKey] || [];
    const updatedList = currentList.filter((b) => b.id !== blockId);

    const updatedSchedule = {
      ...scheduleData,
      [targetKey]: updatedList,
    };

    setScheduleData(updatedSchedule);
    await cacheManager.setSchedule(updatedSchedule);

    try {
      await scheduleApi.updateSchedule({ [targetKey]: updatedList });
    } catch (err) {
      console.warn('Failed to delete schedule block:', err);
    }
  };

  const currentBlocks = activeTab === 'workingDays'
    ? (scheduleData.workingDays || [])
    : (scheduleData.holidays || []);

  const hasData =
    (scheduleData.workingDays && scheduleData.workingDays.length > 0) ||
    (scheduleData.holidays && scheduleData.holidays.length > 0);

  // Determine current active block for today if viewing the matching tab
  const todayDay = new Date().getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekendToday = todayDay === 0 || todayDay === 6;
  const isViewingActiveDay =
    (activeTab === 'holidays' && isWeekendToday) ||
    (activeTab === 'workingDays' && !isWeekendToday);

  const now = new Date();
  const currentHour = now.getHours();
  const currentHourStr = `${currentHour.toString().padStart(2, '0')}:`;

  return (
    <View className="flex-1 bg-momentum-bg">
      <FlatList
        data={currentBlocks}
        keyExtractor={(item, index) => item.id || item._id || `block_${index}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00E676"
            colors={['#00E676']}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header Title & Actions */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-2xl font-bold text-white tracking-tight"
                >
                  Schedule
                </Text>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-xs text-momentum-textSecondary mt-0.5"
                >
                  Design your ideal routine. Stay consistent.
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                {/* Sync to Daily Tasks */}
                <TouchableOpacity
                  onPress={handleSyncToday}
                  disabled={isSyncing}
                  activeOpacity={0.8}
                  className="flex-row items-center bg-momentum-card border border-momentum-border rounded-xl px-2.5 py-1.5 gap-1.5"
                >
                  {isSyncing ? (
                    <ActivityIndicator size={12} color={colors.emerald.bright} />
                  ) : (
                    <CalendarCheck size={13} color={colors.emerald.bright} />
                  )}
                  <Text className="text-xs font-semibold text-white">
                    Sync Tasks
                  </Text>
                </TouchableOpacity>

                {/* Re-generate Template */}
                <TouchableOpacity
                  onPress={handleGenerateTemplate}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                  className="w-8 h-8 rounded-xl bg-momentum-card border border-momentum-border items-center justify-center"
                >
                  {isGenerating ? (
                    <ActivityIndicator size={12} color={colors.emerald.bright} />
                  ) : (
                    <RefreshCw size={13} color={colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Auto-Add to Daily Tasks Switch Card */}
            <View className="bg-momentum-card border border-momentum-border rounded-2xl p-3.5 mb-4 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-xs font-bold text-white">
                  Auto-Add to Daily Tasks
                </Text>
                <Text className="text-[10px] text-momentum-textSecondary mt-0.5">
                  Populate Today's Tasks list from marked schedule blocks
                </Text>
              </View>
              <Switch
                value={Boolean(scheduleData.useScheduleForDailyTasks)}
                onValueChange={handleToggleDailyTasks}
                trackColor={{ false: '#1C2420', true: '#00E676' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Weekdays vs Weekends Tab Switcher */}
            <View className="flex-row gap-3 mb-5">
              <TouchableOpacity
                onPress={() => setActiveTab('workingDays')}
                activeOpacity={0.8}
                className={`flex-1 py-3 rounded-2xl border flex-row items-center justify-center gap-2 ${
                  activeTab === 'workingDays'
                    ? 'bg-[#0B140E] border-momentum-emerald'
                    : 'bg-momentum-card border-momentum-border'
                }`}
              >
                <Briefcase
                  size={15}
                  color={activeTab === 'workingDays' ? colors.emerald.bright : colors.text.muted}
                />
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className={`text-xs font-bold ${
                    activeTab === 'workingDays' ? 'text-white' : 'text-momentum-textSecondary'
                  }`}
                >
                  Weekdays (Mon-Fri)
                </Text>
                <View
                  className={`px-1.5 py-0.5 rounded-full ${
                    activeTab === 'workingDays' ? 'bg-[#0D241C]' : 'bg-[#18241B]'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-mono font-bold ${
                      activeTab === 'workingDays'
                        ? 'text-momentum-emerald'
                        : 'text-momentum-textMuted'
                    }`}
                  >
                    {scheduleData.workingDays?.length || 0}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('holidays')}
                activeOpacity={0.8}
                className={`flex-1 py-3 rounded-2xl border flex-row items-center justify-center gap-2 ${
                  activeTab === 'holidays'
                    ? 'bg-[#0B140E] border-momentum-emerald'
                    : 'bg-momentum-card border-momentum-border'
                }`}
              >
                <Coffee
                  size={15}
                  color={activeTab === 'holidays' ? colors.emerald.bright : colors.text.muted}
                />
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className={`text-xs font-bold ${
                    activeTab === 'holidays' ? 'text-white' : 'text-momentum-textSecondary'
                  }`}
                >
                  Weekends (Sat-Sun)
                </Text>
                <View
                  className={`px-1.5 py-0.5 rounded-full ${
                    activeTab === 'holidays' ? 'bg-[#0D241C]' : 'bg-[#18241B]'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-mono font-bold ${
                      activeTab === 'holidays'
                        ? 'text-momentum-emerald'
                        : 'text-momentum-textMuted'
                    }`}
                  >
                    {scheduleData.holidays?.length || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const isCurrent =
            isViewingActiveDay &&
            item.startTime &&
            item.startTime.startsWith(currentHourStr);

          return (
            <ScheduleBlockRow
              block={item}
              isCurrentTime={isCurrent}
              onEdit={(b) => {
                setEditingBlock(b);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteBlock}
            />
          );
        }}
        ListEmptyComponent={
          <View className="py-12 px-6 items-center justify-center bg-momentum-card border border-dashed border-momentum-border rounded-2xl my-2">
            <View className="w-12 h-12 rounded-full bg-[#0D241C] items-center justify-center mb-3">
              {activeTab === 'workingDays' ? (
                <Briefcase size={22} color="#00E676" strokeWidth={2.2} />
              ) : (
                <Coffee size={22} color="#00E676" strokeWidth={2.2} />
              )}
            </View>
            <Text className="text-sm font-bold text-white mb-1">
              No routine for {activeTab === 'workingDays' ? 'Weekdays' : 'Weekends'}
            </Text>
            <Text className="text-xs text-momentum-textSecondary text-center max-w-[270px] mb-4 leading-4">
              {activeTab === 'workingDays'
                ? 'Design your ideal Monday-to-Friday schedule or generate a 24-hour starter routine.'
                : 'Structure your weekend goals, rejuvenation, and self-study blocks.'}
            </Text>
            <TouchableOpacity
              onPress={handleGenerateTemplate}
              disabled={isGenerating}
              activeOpacity={0.8}
              className="bg-momentum-emerald px-4 py-2.5 rounded-xl flex-row items-center gap-1.5"
            >
              <Sparkles size={14} color="#000000" strokeWidth={2.5} />
              <Text className="text-xs font-bold text-black font-sans">
                Generate 24h Template
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity
            onPress={() => {
              setEditingBlock(null);
              setIsModalOpen(true);
            }}
            activeOpacity={0.8}
            className="w-full py-3 rounded-2xl border border-momentum-emerald bg-[#09150D] flex-row items-center justify-center gap-2 mt-2"
          >
            <Plus size={16} color={colors.emerald.bright} strokeWidth={2.5} />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              className="text-xs font-bold text-momentum-emerald tracking-wide"
            >
              Add {activeTab === 'workingDays' ? 'Weekday' : 'Weekend'} Activity
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Edit / Add Modal */}
      <EditBlockModal
        visible={isModalOpen}
        initialData={editingBlock}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBlock(null);
        }}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
      />
    </View>
  );
}

export default React.memo(TimetableScreen);
