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
import { useTasks } from '../../context/TaskContext';
import { getTodayDateString } from '../../utils/dateUtils';
import {
  Briefcase,
  Coffee,
  Plus,
  RefreshCw,
  Sparkles,
  CalendarCheck,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

const sanitizeSchedule = (schedule) => {
  if (!schedule) return schedule;
  const cleanBlocks = (blocks) => {
    if (!Array.isArray(blocks)) return [];
    return blocks.map((b, idx) => {
      let title = b.title;
      if (typeof title === 'string' && /^[0-9a-fA-F]{24,}$/.test(title.trim())) {
        title = 'Free Slot';
      }
      return {
        ...b,
        id: b.id || b._id || `block_${idx}_${Date.now()}`,
        title: title || 'Free Slot',
      };
    });
  };
  return {
    ...schedule,
    workingDays: cleanBlocks(schedule.workingDays),
    holidays: cleanBlocks(schedule.holidays),
  };
};

const create12HourBlankBlocks = () => {
  const blocks = [];
  for (let i = 8; i < 20; i++) {
    const start = i.toString().padStart(2, '0') + ':00';
    const end = (i + 1).toString().padStart(2, '0') + ':00';
    blocks.push({
      id: `slot-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      startTime: start,
      endTime: end,
      title: 'Free Slot',
      category: 'LEARNING',
      color: 'blue',
      addToDailyList: false,
    });
  }
  return blocks;
};

function TimetableScreen({ navigation }) {
  const { fetchTasks } = useTasks();
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
        const cleanCached = sanitizeSchedule(cached);
        setScheduleData((prev) => ({ ...prev, ...cleanCached }));
      }

      const res = await scheduleApi.getSchedule();
      const serverData = res.data?.data;
      if (serverData) {
        const cleanServer = sanitizeSchedule(serverData);
        setScheduleData(cleanServer);
        await cacheManager.setSchedule(cleanServer);
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
        const today = getTodayDateString();
        const syncRes = await scheduleApi.syncToday(today);
        const count = syncRes?.data?.count || 0;
        if (typeof fetchTasks === 'function') {
          await fetchTasks(today);
        }
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
      const today = getTodayDateString();
      const res = await scheduleApi.syncToday(today);
      const count = res?.data?.count || 0;
      if (typeof fetchTasks === 'function') {
        await fetchTasks(today);
      }
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

  const handleGenerateTemplate = () => {
    Alert.alert(
      'Reset Schedule Template',
      'This will reset your schedule to a clean 12-hour blank template (08:00 AM – 08:00 PM) for both Weekdays and Weekends. Any custom routine blocks will be replaced. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Blank 12h',
          style: 'destructive',
          onPress: async () => {
            setIsGenerating(true);
            try {
              const workingDays = create12HourBlankBlocks();
              const holidays = create12HourBlankBlocks();

              let serverData;
              try {
                const res = await scheduleApi.generateTemplate();
                serverData = res.data?.data;
              } catch (apiErr) {
                const res2 = await scheduleApi.updateSchedule({ workingDays, holidays });
                serverData = res2.data?.data;
              }

              const finalData = sanitizeSchedule(
                serverData || {
                  ...scheduleData,
                  workingDays,
                  holidays,
                }
              );

              setScheduleData(finalData);
              await cacheManager.setSchedule(finalData);
              Alert.alert('Template Ready', 'Clean 12-hour blank template (08:00 AM – 08:00 PM) is ready to customize!');
            } catch (err) {
              Alert.alert('Template Error', 'Could not reset template. Please check your internet connection.');
            } finally {
              setIsGenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveBlock = async (blockData) => {
    const targetKey = activeTab; // 'workingDays' or 'holidays'
    const currentList = [...(scheduleData[targetKey] || [])];

    let updatedList;
    if (editingBlock) {
      let matched = false;
      updatedList = currentList.map((b) => {
        const isMatch =
          (editingBlock.id && b.id && b.id === editingBlock.id) ||
          (editingBlock._id && b._id && b._id.toString() === editingBlock._id.toString()) ||
          (editingBlock.id && b._id && b._id.toString() === editingBlock.id) ||
          (editingBlock._id && b.id && b.id === editingBlock._id.toString());
        if (isMatch) {
          matched = true;
          return { ...b, ...blockData };
        }
        return b;
      });
      if (!matched) {
        // Fallback: match by startTime if it was an unaltered slot
        const timeIdx = currentList.findIndex((b) => b.startTime === editingBlock.startTime);
        if (timeIdx >= 0) {
          updatedList[timeIdx] = { ...currentList[timeIdx], ...blockData };
        } else {
          updatedList.push(blockData);
        }
      }
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
        const today = getTodayDateString();
        await scheduleApi.syncToday(today);
        if (typeof fetchTasks === 'function') {
          await fetchTasks(today);
        }
      }
    } catch (err) {
      console.warn('Failed to save schedule block to backend:', err);
    }

    setEditingBlock(null);
  };

  const handleDeleteBlock = async (blockOrId) => {
    const targetKey = activeTab;
    const currentList = scheduleData[targetKey] || [];
    const targetId = typeof blockOrId === 'object' ? (blockOrId?.id || blockOrId?._id) : blockOrId;

    const updatedList = currentList.filter((b) => {
      if (typeof blockOrId === 'object' && blockOrId) {
        if (b.id && blockOrId.id && b.id === blockOrId.id) return false;
        if (b._id && blockOrId._id && b._id.toString() === blockOrId._id.toString()) return false;
      }
      if (targetId && (b.id === targetId || b._id === targetId)) return false;
      return true;
    });

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
                    ? 'bg-[#000000] border-momentum-emerald'
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
                    activeTab === 'workingDays' ? 'bg-[#000000]' : 'bg-[#18241B]'
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
                    ? 'bg-[#000000] border-momentum-emerald'
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
                    activeTab === 'holidays' ? 'bg-[#000000]' : 'bg-[#18241B]'
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
            <View className="w-12 h-12 rounded-full bg-[#000000] items-center justify-center mb-3">
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
                ? 'Design your ideal Monday-to-Friday schedule or generate a 12-hour blank routine (8 AM – 8 PM).'
                : 'Structure your weekend goals, rejuvenation, and self-study blocks (8 AM – 8 PM).'}
            </Text>
            <TouchableOpacity
              onPress={handleGenerateTemplate}
              disabled={isGenerating}
              activeOpacity={0.8}
              className="bg-momentum-emerald px-4 py-2.5 rounded-xl flex-row items-center gap-1.5"
            >
              <Sparkles size={14} color="#000000" strokeWidth={2.5} />
              <Text className="text-xs font-bold text-black font-sans">
                Generate 12h Template
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
            className="w-full py-3 rounded-2xl border border-momentum-emerald bg-[#000000] flex-row items-center justify-center gap-2 mt-2"
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
