import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import SyncStatusBar from '../../components/SyncStatusBar';
import { milestoneApi } from '../../api/milestoneApi';
import { cacheManager } from '../../storage/cacheManager';
import { networkMonitor } from '../../sync/networkMonitor';
import { syncQueue } from '../../storage/syncQueue';
import {
  Target,
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  X,
  Clock,
  Flag,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function MilestonesScreen({ navigation }) {
  const [milestones, setMilestones] = useState([]);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null); // Filter by selected calendar date or null for all
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newCategory, setNewCategory] = useState('DEVELOPMENT');

  const fetchMilestones = useCallback(async () => {
    try {
      const cached = await cacheManager.getMilestones();
      if (cached && Array.isArray(cached)) {
        setMilestones(cached);
      }

      const isOnline = await networkMonitor.checkConnection();
      if (isOnline) {
        const res = await milestoneApi.getMilestones();
        const serverData = res.data?.data || [];
        setMilestones(serverData);
        await cacheManager.setMilestones(serverData);
      }
    } catch {
      // Keep cached milestones if offline or error occurs
    }
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMilestones();
    setRefreshing(false);
  };

  const handleToggle = async (item) => {
    const updated = milestones.map((m) =>
      m._id === item._id ? { ...m, isCompleted: !m.isCompleted } : m
    );
    setMilestones(updated);
    await cacheManager.setMilestones(updated);

    const isOnline = await networkMonitor.checkConnection();
    if (isOnline) {
      await milestoneApi.toggleMilestone(item._id).catch(async () => {
        await syncQueue.enqueue({
          endpoint: `/api/milestones/${item._id}/toggle`,
          method: 'PUT',
        });
      });
    } else {
      await syncQueue.enqueue({
        endpoint: `/api/milestones/${item._id}/toggle`,
        method: 'PUT',
      });
    }
  };

  const handleDelete = async (id) => {
    const updated = milestones.filter((m) => m._id !== id);
    setMilestones(updated);
    await cacheManager.setMilestones(updated);

    const isOnline = await networkMonitor.checkConnection();
    if (isOnline) {
      await milestoneApi.deleteMilestone(id).catch(async () => {
        await syncQueue.enqueue({
          endpoint: `/api/milestones/${id}`,
          method: 'DELETE',
        });
      });
    } else {
      await syncQueue.enqueue({
        endpoint: `/api/milestones/${id}`,
        method: 'DELETE',
      });
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const tempId = `local_ms_${Date.now()}`;
    const payload = {
      title: newTitle.trim(),
      targetDate: newTargetDate.trim() || new Date().toISOString().split('T')[0],
      category: newCategory,
      isCompleted: false,
    };
    const newMs = { _id: tempId, ...payload, createdAt: new Date().toISOString() };
    const updated = [newMs, ...milestones];
    setMilestones(updated);
    await cacheManager.setMilestones(updated);

    setNewTitle('');
    setNewTargetDate('');
    setIsModalOpen(false);

    const isOnline = await networkMonitor.checkConnection();
    if (isOnline) {
      try {
        const res = await milestoneApi.createMilestone(payload);
        if (res.data?.data) {
          const reconciled = updated.map((m) => (m._id === tempId ? res.data.data : m));
          setMilestones(reconciled);
          await cacheManager.setMilestones(reconciled);
        }
      } catch {
        await syncQueue.enqueue({
          endpoint: '/api/milestones',
          method: 'POST',
          payload,
        });
      }
    } else {
      await syncQueue.enqueue({
        endpoint: '/api/milestones',
        method: 'POST',
        payload,
      });
    }
  };

  // Calendar calculations for current month
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Map of dates in this month that have milestones
  const milestoneDateMap = useMemo(() => {
    const map = new Map();
    milestones.forEach((m) => {
      if (m.targetDate) {
        const datePart = m.targetDate.split('T')[0];
        const existing = map.get(datePart) || [];
        existing.push(m);
        map.set(datePart, existing);
      }
    });
    return map;
  }, [milestones]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
    setSelectedDateStr(null);
  };

  // Filtered milestones based on selected calendar date
  const displayMilestones = useMemo(() => {
    if (selectedDateStr) {
      return milestones.filter((m) => m.targetDate && m.targetDate.startsWith(selectedDateStr));
    }
    return milestones;
  }, [milestones, selectedDateStr]);

  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const totalCount = milestones.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View className="flex-1 bg-momentum-bg">
      <AppHeader navigation={navigation} />
      <SyncStatusBar />

      <FlatList
        data={displayMilestones}
        keyExtractor={(item) => item._id}
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
            {/* Header Title & + New Goal Button */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-2xl font-bold text-white tracking-tight"
                >
                  Milestones
                </Text>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-xs text-momentum-textSecondary mt-0.5"
                >
                  Quarterly roadmaps and target deadlines.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsModalOpen(true)}
                activeOpacity={0.8}
                delayPressIn={0}
                className="bg-momentum-emerald px-3.5 py-1.5 rounded-xl flex-row items-center gap-1.5"
              >
                <Plus size={14} color="#000000" strokeWidth={3} />
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-xs font-bold text-black font-sans"
                >
                  New Goal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Overall Progress Bar */}
            <View className="p-3.5 rounded-2xl bg-momentum-card border border-momentum-border mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Flag size={15} color={colors.emerald.bright} />
                  <Text
                    numberOfLines={1}
                    allowFontScaling={false}
                    className="text-xs font-bold text-white"
                  >
                    Goal Completion Rate
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  className="text-xs font-mono font-bold text-momentum-emerald"
                >
                  {completedCount}/{totalCount} • {progressPct}%
                </Text>
              </View>

              {/* Progress Track */}
              <View className="w-full h-2 rounded-full bg-[#111713] overflow-hidden">
                <View
                  style={{ width: `${progressPct}%` }}
                  className="h-full bg-momentum-emerald rounded-full"
                />
              </View>
            </View>

            {/* Calendar Structure Card */}
            <View className="p-4 rounded-2xl bg-momentum-card border border-momentum-border mb-4">
              {/* Calendar Month Navigation */}
              <View className="flex-row items-center justify-between mb-3.5 pb-2 border-b border-momentum-border">
                <View className="flex-row items-center gap-2">
                  <CalendarIcon size={16} color={colors.emerald.bright} />
                  <Text
                    numberOfLines={1}
                    allowFontScaling={false}
                    className="text-sm font-bold text-white tracking-tight"
                  >
                    {monthName}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1.5">
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    delayPressIn={0}
                    className="w-7 h-7 rounded-lg bg-momentum-surface border border-momentum-border items-center justify-center"
                  >
                    <ChevronLeft size={13} color={colors.text.secondary} />
                  </TouchableOpacity>

                  {selectedDateStr && (
                    <TouchableOpacity
                      onPress={() => setSelectedDateStr(null)}
                      className="px-2 py-1 rounded-lg bg-[#0D241C] border border-[#15422B]"
                    >
                      <Text
                        numberOfLines={1}
                        allowFontScaling={false}
                        className="text-[9px] font-mono font-bold text-momentum-emerald"
                      >
                        Show All
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handleNextMonth}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    delayPressIn={0}
                    className="w-7 h-7 rounded-lg bg-momentum-surface border border-momentum-border items-center justify-center"
                  >
                    <ChevronRight size={13} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Weekday Row */}
              <View className="flex-row justify-between mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <Text
                    key={i}
                    allowFontScaling={false}
                    className="w-8 text-center text-[10px] font-mono font-semibold text-momentum-textMuted"
                  >
                    {d}
                  </Text>
                ))}
              </View>

              {/* Day Grid */}
              <View className="flex-row flex-wrap">
                {/* Empty padding slots before first day */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <View key={`empty-${i}`} className="w-[14.28%] h-8" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum
                    .toString()
                    .padStart(2, '0')}`;
                  const hasMilestone = milestoneDateMap.has(dateStr);
                  const isSelected = selectedDateStr === dateStr;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <TouchableOpacity
                      key={dateStr}
                      onPress={() => setSelectedDateStr(isSelected ? null : dateStr)}
                      activeOpacity={0.7}
                      delayPressIn={0}
                      className="w-[14.28%] h-8 items-center justify-center relative"
                    >
                      <View
                        className={`w-7 h-7 rounded-xl items-center justify-center ${
                          isSelected
                            ? 'bg-momentum-emerald'
                            : isToday
                            ? 'border border-momentum-emerald bg-[#0D241C]'
                            : hasMilestone
                            ? 'bg-[#0D241C] border border-[#1B472A]'
                            : 'bg-transparent'
                        }`}
                      >
                        <Text
                          allowFontScaling={false}
                          className={`text-[11px] font-mono ${
                            isSelected
                              ? 'text-black font-bold'
                              : isToday
                              ? 'text-momentum-emerald font-bold'
                              : hasMilestone
                              ? 'text-white font-bold'
                              : 'text-momentum-textSecondary'
                          }`}
                        >
                          {dayNum}
                        </Text>
                      </View>

                      {/* Milestone indicator dot */}
                      {hasMilestone && !isSelected && (
                        <View className="absolute bottom-0 w-1 h-1 rounded-full bg-momentum-emerald" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section Subheader */}
            <View className="flex-row items-center justify-between mt-1 mb-3">
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                className="text-xs font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary"
              >
                {selectedDateStr ? `Goals Due on ${selectedDateStr}` : 'All Roadmap Targets'}
              </Text>
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                className="text-[10px] font-mono text-momentum-textMuted"
              >
                {displayMilestones.length} item{displayMilestones.length === 1 ? '' : 's'}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const isDone = item.isCompleted;
          // Days remaining calculation
          const target = new Date(item.targetDate);
          const diffDays = Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24));
          const dueText =
            diffDays < 0
              ? 'Overdue'
              : diffDays === 0
              ? 'Due today'
              : `${diffDays} days left`;

          return (
            <View
              className={`p-4 mb-3 rounded-2xl bg-momentum-card border transition-all ${
                isDone ? 'border-momentum-border/60 opacity-60' : 'border-momentum-border'
              }`}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-start gap-3.5 flex-1 mr-2">
                  {/* Completion toggle */}
                  <TouchableOpacity
                    onPress={() => handleToggle(item)}
                    activeOpacity={0.7}
                    delayPressIn={0}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: isDone ? colors.emerald.bright : '#090D0A',
                      borderWidth: isDone ? 0 : 1.2,
                      borderColor: '#243629',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    {isDone && <Check size={13} color="#000000" strokeWidth={3} />}
                  </TouchableOpacity>

                  <View className="flex-1">
                    <Text
                      allowFontScaling={false}
                      className={`text-sm font-bold leading-tight ${
                        isDone ? 'line-through text-momentum-textMuted' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </Text>

                    {/* Metadata: Category pill + Target date + Days left */}
                    <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                      <View className="px-2 py-0.5 rounded-md bg-[#0D241C]">
                        <Text
                          allowFontScaling={false}
                          className="text-[9px] font-mono font-bold text-momentum-emerald uppercase"
                        >
                          {item.category || 'DEVELOPMENT'}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <CalendarIcon size={11} color={colors.text.muted} />
                        <Text
                          allowFontScaling={false}
                          className="text-[10px] font-mono text-momentum-textSecondary ml-1"
                        >
                          {item.targetDate}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Clock size={11} color={colors.text.muted} />
                        <Text
                          allowFontScaling={false}
                          className={`text-[10px] font-mono ml-1 ${
                            diffDays < 0 ? 'text-red-400 font-bold' : 'text-momentum-textSecondary'
                          }`}
                        >
                          {dueText}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Delete button */}
                <TouchableOpacity
                  onPress={() => handleDelete(item._id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  delayPressIn={0}
                  className="w-8 h-8 rounded-xl items-center justify-center bg-momentum-surface border border-momentum-border/60"
                >
                  <Trash2 size={14} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-12 px-6 rounded-2xl bg-momentum-card border border-momentum-border/60 mt-2">
            <View className="w-12 h-12 rounded-2xl bg-[#0D241C] border border-[#1B472A] items-center justify-center mb-3">
              <Target size={22} color={colors.emerald.bright} />
            </View>
            <Text
              allowFontScaling={false}
              className="text-sm font-bold text-white mb-1"
            >
              {selectedDateStr ? 'No Milestones for Selected Date' : 'No Milestones Set'}
            </Text>
            <Text
              allowFontScaling={false}
              className="text-xs text-momentum-textMuted text-center max-w-[260px] leading-relaxed"
            >
              {selectedDateStr
                ? 'Tap "Show All" or choose another date on the calendar.'
                : 'Define your long-term goals and target dates to track progress.'}
            </Text>
          </View>
        }
      />

      {/* New Milestone Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsModalOpen(false)}
            className="flex-1 bg-black/80 justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              className="bg-momentum-card border-t border-momentum-borderLight rounded-t-3xl p-6 pb-8"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text
                  allowFontScaling={false}
                  className="text-base font-bold text-white tracking-tight"
                >
                  New Milestone Target
                </Text>
                <TouchableOpacity
                  onPress={() => setIsModalOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="p-1 -mr-1"
                >
                  <X size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Target milestone (e.g. Launch Beta)"
                placeholderTextColor={colors.text.muted}
                autoFocus
                className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3 text-sm text-white mb-3"
              />

              <Text
                allowFontScaling={false}
                className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5"
              >
                Target Date (YYYY-MM-DD)
              </Text>
              <TextInput
                value={newTargetDate}
                onChangeText={setNewTargetDate}
                placeholder="2026-11-30"
                placeholderTextColor={colors.text.muted}
                className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-2.5 text-xs text-white font-mono mb-4"
              />

              <TouchableOpacity
                onPress={handleCreate}
                disabled={!newTitle.trim()}
                activeOpacity={0.8}
                delayPressIn={0}
                className={`w-full py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                  newTitle.trim() ? 'bg-momentum-emerald' : 'bg-momentum-emerald/30'
                }`}
              >
                <Plus size={16} color="#000000" strokeWidth={3} />
                <Text
                  allowFontScaling={false}
                  className="text-sm font-bold text-black font-sans"
                >
                  Add Milestone
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
