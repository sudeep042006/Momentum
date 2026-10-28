import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, Text, RefreshControl } from 'react-native';
import TodayHeader from './components/TodayHeader';
import DailyQuoteCard from './components/DailyQuoteCard';
import QuoteSetupModal from './components/QuoteSetupModal';
import ContributionHeatmap from './components/ContributionHeatmap';
import TaskRow from './components/TaskRow';
import AddTaskModal from './components/AddTaskModal';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { dailyApi } from '../../api/dailyApi';
import { quoteApi } from '../../api/quoteApi';
import { cacheManager } from '../../storage/cacheManager';
import { localStorage } from '../../storage/localStorage';
import { updateNativeWidget } from '../../services/systemNotificationService';
import { useAudio } from '../../context/AudioContext';
import { useTimer } from '../../context/TimerContext';
import { sortTasksChronologically } from '../../utils/timeUtils';
import { Plus, CheckSquare, Timer, Play } from 'lucide-react-native';

const DAILY_QUOTE_CACHE_KEY = 'momentum_daily_quote_cache';
const DAILY_QUOTE_TIME_KEY = 'momentum_daily_quote_last_time';

function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { tasks, isLoading, fetchTasks, addTask, toggleTask, deleteTask } = useTasks();
  let activeTrack = null;
  try {
    const audioContext = useAudio();
    activeTrack = audioContext?.activeTrack;
  } catch {
    activeTrack = null;
  }

  let timerContext = null;
  try {
    timerContext = useTimer();
  } catch {
    timerContext = null;
  }
  const isTimerRunning = Boolean(timerContext?.isRunning);
  const timerSession = timerContext?.currentSession || 1;
  const timerTotalSessions = timerContext?.totalSessions || 3;
  const timerTimeLeft = timerContext?.timeLeft || 0;
  const timerIsBreak = Boolean(timerContext?.isBreak);
  const timerMins = Math.floor(timerTimeLeft / 60);
  const timerSecs = timerTimeLeft % 60;
  const timerFormatted = `${timerMins < 10 ? '0' + timerMins : timerMins}:${timerSecs < 10 ? '0' + timerSecs : timerSecs}`;
  const [heatmapData, setHeatmapData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuoteSetup, setShowQuoteSetup] = useState(false);
  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);
  const [quoteData, setQuoteData] = useState({
    quote: 'Discipline equals freedom.',
    author: 'Jocko Willink',
    category: 'DISCIPLINE',
  });

  const name = user?.name || user?.user_metadata?.name || 'Momentum User';
  const streak = user?.streak ?? user?.currentStreak ?? 0;


  const loadQuote = async () => {
    try {
      const cached = await localStorage.getItem(DAILY_QUOTE_CACHE_KEY);
      const lastTimeStr = await localStorage.getItem(DAILY_QUOTE_TIME_KEY);
      const lastTime = Number(lastTimeStr) || 0;
      const isExpired = Date.now() - lastTime > 3 * 60 * 60 * 1000; // 3 hours

      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.quote) {
          setQuoteData(parsed);
          updateNativeWidget(parsed.quote, parsed.author, streak);
        }
      }

      // If no cache or more than 3 hours have passed, auto-fetch a fresh quote
      if (!cached || isExpired) {
        let res = null;
        try {
          res = await quoteApi.generateQuote({ category: quoteData.category || 'DISCIPLINE' });
        } catch {
          try {
            res = await quoteApi.getDailyQuote();
          } catch {}
        }

        if (res?.data?.success && res.data?.data?.quote) {
          setQuoteData(res.data.data);
          await localStorage.setItem(DAILY_QUOTE_CACHE_KEY, JSON.stringify(res.data.data));
          await localStorage.setItem(DAILY_QUOTE_TIME_KEY, String(Date.now()));
          updateNativeWidget(res.data.data.quote, res.data.data.author, streak);
        }
      }
    } catch {
      // Non-blocking
    }
  };

  const handleQuickRefreshQuote = async () => {
    setIsRefreshingQuote(true);
    try {
      const res = await quoteApi.generateQuote({ category: quoteData.category || 'DEVELOPER' });
      if (res.data?.success && res.data?.data?.quote) {
        setQuoteData(res.data.data);
        await localStorage.setItem(DAILY_QUOTE_CACHE_KEY, JSON.stringify(res.data.data));
        await localStorage.setItem(DAILY_QUOTE_TIME_KEY, String(Date.now()));
        updateNativeWidget(res.data.data.quote, res.data.data.author, streak);
      }
    } catch {
      // Keep existing
    } finally {
      setIsRefreshingQuote(false);
    }
  };

  const loadData = async () => {
    try {
      const cached = await cacheManager.getHeatmap();
      if (cached) setHeatmapData(cached);

      const res = await dailyApi.getHeatmap();
      if (res.data?.data) {
        setHeatmapData(res.data.data);
        await cacheManager.setHeatmap(res.data.data);
      }
    } catch (e) {
      // Keep cached
    }
  };

  useEffect(() => {
    fetchTasks();
    loadData();
    loadQuote();
  }, [fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), loadData()]);
    setRefreshing(false);
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const sortedTasks = useMemo(() => sortTasksChronologically(tasks), [tasks]);

  return (
    <View className="flex-1 bg-momentum-bg">
      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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
            {/* Header Greeting & Progress Ring */}
            <TodayHeader
              name={name}
              completedCount={completedCount}
              totalCount={totalCount}
              streak={streak}
            />

            {/* Daily Quote Interactive Card Widget with Set Up Options */}
            <DailyQuoteCard
              quote={quoteData.quote}
              author={quoteData.author}
              category={quoteData.category}
              isLoading={isRefreshingQuote}
              onOpenSetup={() => setShowQuoteSetup(true)}
              onQuickRefresh={handleQuickRefreshQuote}
            />

            {/* Heatmap Card (Synchronized with Database + Live Tasks) */}
            <ContributionHeatmap heatmapData={heatmapData} todayTasks={tasks} />

            {/* Quick Flow & Pomodoro Launcher Banner */}
            <TouchableOpacity
              onPress={() => navigation?.navigate?.('FocusPomodoro')}
              activeOpacity={0.8}
              className={`flex-row items-center justify-between p-3 rounded-2xl border mt-1 mb-3.5 ${
                isTimerRunning
                  ? 'bg-[#002210] border-momentum-emerald'
                  : 'bg-[#00170A] border-momentum-emerald/40'
              }`}
            >
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center border"
                  style={{
                    backgroundColor: isTimerRunning ? '#00381B' : '#002B13',
                    borderColor: '#00E676',
                  }}
                >
                  <Timer size={16} color="#00E676" strokeWidth={2.4} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white" numberOfLines={1}>
                    {isTimerRunning
                      ? timerIsBreak
                        ? `☕ Rest Break (${timerSession}/${timerTotalSessions})`
                        : `⏱️ Focus Session ${timerSession} of ${timerTotalSessions} Active`
                      : 'Pomodoro Focus Timer (50m • 3 Sessions)'}
                  </Text>
                  <Text className="text-[10px] font-mono text-momentum-emerald" numberOfLines={1}>
                    {isTimerRunning
                      ? `${timerFormatted} remaining • Live in Notification Bar`
                      : activeTrack?.title
                      ? `${activeTrack.title} • Enter Flow State`
                      : '50m Deep Work + 3 Sessions Cycle'}
                  </Text>
                </View>
              </View>
              <View className="px-2.5 py-1 rounded-lg bg-momentum-emerald flex-row items-center gap-1">
                {isTimerRunning ? (
                  <>
                    <View className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    <Text className="text-[10px] font-bold text-black font-mono">LIVE</Text>
                  </>
                ) : (
                  <>
                    <Play size={10} color="#000000" strokeWidth={3} style={{ marginLeft: 1 }} />
                    <Text className="text-[10px] font-bold text-black font-mono">FLOW</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Today's Tasks Section Bar */}
            <View className="flex-row items-center justify-between mt-1 mb-3.5">
              <View className="flex-row items-center gap-2">
                <CheckSquare size={17} color="#00E676" strokeWidth={2.3} />
                <Text className="text-base font-bold text-white tracking-tight">
                  Today's Tasks
                </Text>
                <Text className="text-xs font-semibold text-momentum-emerald ml-1">
                  {totalCount} tasks
                </Text>
              </View>

              {/* Add Task Pill Button */}
              <TouchableOpacity
                onPress={() => setIsModalOpen(true)}
                activeOpacity={0.8}
                className="bg-momentum-emerald px-3.5 py-1.5 rounded-xl flex-row items-center gap-1.5"
              >
                <Plus size={14} color="#000000" strokeWidth={3} />
                <Text className="text-xs font-bold text-black font-sans">
                  Add Task
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="py-10 px-5 items-center justify-center bg-momentum-card border border-dashed border-momentum-border rounded-2xl my-2">
              <View className="w-12 h-12 rounded-full bg-[#000000] items-center justify-center mb-3">
                <CheckSquare size={22} color="#00E676" strokeWidth={2.2} />
              </View>
              <Text className="text-sm font-bold text-white mb-1">
                No tasks for today
              </Text>
              <Text className="text-xs text-momentum-textSecondary text-center max-w-[260px] mb-4 leading-4">
                You're all clear! Tap + Add Task to plan your day.
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(true)}
                activeOpacity={0.8}
                className="bg-momentum-emerald px-4 py-2 rounded-xl flex-row items-center gap-1.5"
              >
                <Plus size={14} color="#000000" strokeWidth={3} />
                <Text className="text-xs font-bold text-black font-sans">
                  Add First Task
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}
      />

      {/* Add Task Modal with Keyboard Avoiding */}
      <AddTaskModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addTask}
      />

      {/* Set Up Quotes Options Modal */}
      <QuoteSetupModal
        visible={showQuoteSetup}
        currentQuote={quoteData.quote}
        currentAuthor={quoteData.author}
        currentStreak={streak}
        onClose={() => setShowQuoteSetup(false)}
        onApplyQuote={(newQuote) => {
          setQuoteData(newQuote);
          updateNativeWidget(newQuote.quote, newQuote.author, streak);
        }}
      />
    </View>
  );
}

export default React.memo(HomeScreen);
