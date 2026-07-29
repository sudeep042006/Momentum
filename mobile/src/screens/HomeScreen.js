import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Plus, CheckSquare, Square, ChevronDown } from 'lucide-react-native';
import apiClient from '../services/apiClient';

export default function HomeScreen() {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    // Fetch today's tasks
    const fetchTasks = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await apiClient.get(`/api/tasks?date=${today}`);
        if (res.data && res.data.data) {
          setTasks(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      }
    };
    fetchTasks();
  }, []);

  return (
    <View className="flex-1 bg-[#050a0f] pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 mb-6">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-[#10b981]/20 rounded-xl items-center justify-center border border-[#10b981]/50">
            <Text className="text-[#10b981] font-bold text-xl">M</Text>
          </View>
          <Text className="text-white font-bold text-2xl">Today</Text>
        </View>
        <View className="flex-row gap-4">
          <TouchableOpacity className="p-2 border border-[#1e293b] rounded-lg bg-[#0a121a]">
            <Calendar color="#8b949e" size={20} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 border border-[#10b981]/50 rounded-lg bg-[#10b981]/20">
            <Plus color="#10b981" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* Momentum Heatmap Placeholder */}
        <View className="bg-[#0a121a] border border-[#1e293b] rounded-2xl p-5 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-bold tracking-widest text-sm">Momentum Heatmap</Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-[#8b949e] text-xs">5 Months</Text>
              <ChevronDown color="#8b949e" size={14} />
            </View>
          </View>
          
          <View className="flex-row flex-wrap gap-1 mb-4">
            {/* Dummy blocks */}
            {Array.from({ length: 90 }).map((_, i) => (
              <View 
                key={i} 
                className={`w-3 h-3 rounded-sm ${Math.random() > 0.5 ? 'bg-[#10b981]' : 'bg-[#1e293b]'}`}
                style={{ opacity: Math.random() * 0.5 + 0.3 }}
              />
            ))}
          </View>
          
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <Text className="text-[#8b949e] text-xs">Less</Text>
              <View className="flex-row gap-1">
                 <View className="w-2 h-2 rounded-sm bg-[#1e293b]" />
                 <View className="w-2 h-2 rounded-sm bg-[#10b981]/40" />
                 <View className="w-2 h-2 rounded-sm bg-[#10b981]" />
              </View>
              <Text className="text-[#8b949e] text-xs">More</Text>
            </View>
            <Text className="text-[#10b981] font-bold text-xs">Today: 85%</Text>
          </View>
        </View>

        {/* Today's Progress Placeholder */}
        <View className="bg-[#0a121a] border border-[#1e293b] rounded-2xl p-5 mb-6">
          <Text className="text-white font-bold tracking-widest text-sm mb-4">Today's Progress</Text>
          <View className="flex-row justify-between">
             <View className="items-center">
               <Text className="text-[#22c55e] font-bold text-lg">6 / 7</Text>
               <Text className="text-[#8b949e] text-xs">Tasks Completed</Text>
             </View>
             <View className="items-center">
               <Text className="text-[#22c55e] font-bold text-lg">2h 45m</Text>
               <Text className="text-[#8b949e] text-xs">Focus Time</Text>
             </View>
             <View className="items-center">
               <Text className="text-[#22c55e] font-bold text-lg">85%</Text>
               <Text className="text-[#8b949e] text-xs">Completion</Text>
             </View>
          </View>
        </View>

        {/* Today's Plan */}
        <View className="bg-[#0a121a] border border-[#1e293b] rounded-2xl p-5 mb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-bold tracking-widest text-sm">Today's Plan</Text>
            <Text className="text-[#8b949e] text-xs">{tasks.length} tasks</Text>
          </View>
          
          <View className="gap-3">
            {tasks.length > 0 ? tasks.map((task) => (
              <View key={task._id} className="flex-row items-center justify-between group">
                <View className="flex-row items-center gap-3">
                  {task.status === 'completed' ? (
                    <CheckSquare color="#22c55e" size={20} />
                  ) : (
                    <Square color="#8b949e" size={20} />
                  )}
                  <Text className={task.status === 'completed' ? 'text-[#8b949e] line-through' : 'text-white'}>
                    {task.title}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[#8b949e] text-xs uppercase tracking-widest">{task.category}</Text>
                </View>
              </View>
            )) : (
              <Text className="text-[#8b949e] italic text-center py-4">No tasks planned for today.</Text>
            )}
          </View>
          
          <TouchableOpacity className="mt-6 flex-row items-center justify-center gap-2">
             <Plus color="#10b981" size={16} />
             <Text className="text-[#10b981] font-bold">Add Task</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
