import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, RefreshControl } from 'react-native';
import TodayHeader from './components/TodayHeader';
import ContributionHeatmap from './components/ContributionHeatmap';
import TaskRow from './components/TaskRow';
import AddTaskModal from './components/AddTaskModal';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { dailyApi } from '../../api/dailyApi';
import { cacheManager } from '../../storage/cacheManager';
import { Plus, CheckSquare } from 'lucide-react-native';

function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { tasks, isLoading, fetchTasks, addTask, toggleTask, deleteTask } = useTasks();
  const [heatmapData, setHeatmapData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const name = user?.name || user?.user_metadata?.name || 'Sudeep';

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
  }, [fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), loadData()]);
    setRefreshing(false);
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;

  return (
    <View className="flex-1 bg-momentum-bg">
      <FlatList
        data={tasks}
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
              streak={28}
            />

            {/* Heatmap Card (Synchronized with Database + Live Tasks) */}
            <ContributionHeatmap heatmapData={heatmapData} todayTasks={tasks} />

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
              <View className="w-12 h-12 rounded-full bg-[#0D241C] items-center justify-center mb-3">
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
    </View>
  );
}

export default React.memo(HomeScreen);
