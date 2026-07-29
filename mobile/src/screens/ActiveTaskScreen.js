import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, MoreVertical, Calendar, Clock, Flag, CheckSquare, Square, FileIcon, Play } from 'lucide-react-native';

export default function ActiveTaskScreen({ navigation }) {
  // Dummy subtasks for UI
  const subtasks = [
    { id: 1, title: 'Setup project structure', time: '1h 00m', completed: true },
    { id: 2, title: 'Design database schema', time: '1h 15m', completed: true },
    { id: 3, title: 'Implement user registration', time: '1h 30m', completed: true },
    { id: 4, title: 'Implement login & JWT', time: '1h 45m', completed: false },
    { id: 5, title: 'Add refresh token logic', time: '1h 00m', completed: false },
    { id: 6, title: 'Role-based access control', time: '1h 00m', completed: false },
  ];

  return (
    <View className="flex-1 bg-[#050a0f] pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 mb-6">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#10b981" size={24} />
          </TouchableOpacity>
          <Text className="text-white font-bold text-xl">Active Task</Text>
        </View>
        <TouchableOpacity>
          <MoreVertical color="#8b949e" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* Title & Status */}
        <View className="flex-row justify-between items-start mb-4">
          <Text className="text-white font-bold text-lg flex-1 pr-4">Build User Authentication System</Text>
          <View className="bg-[#10b981]/20 border border-[#10b981]/50 px-3 py-1 rounded-full flex-row items-center gap-2">
            <View className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <Text className="text-[#10b981] text-xs font-bold">In Progress</Text>
          </View>
        </View>

        <Text className="text-[#8b949e] text-sm leading-6 mb-6">
          Implement a secure and scalable authentication system with JWT, refresh tokens and role-based access control.
        </Text>

        {/* Progress */}
        <View className="mb-6">
          <View className="flex-row justify-between mb-2">
            <Text className="text-white font-bold text-sm">Progress</Text>
            <Text className="text-[#10b981] font-bold text-sm">50%</Text>
          </View>
          <View className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
            <View className="h-full bg-[#10b981] w-1/2 rounded-full" />
          </View>
        </View>

        {/* Info Tags */}
        <View className="flex-row justify-between bg-[#0a121a] border border-[#1e293b] rounded-xl p-4 mb-8">
          <View className="items-center">
            <Calendar color="#8b949e" size={16} className="mb-1" />
            <Text className="text-white font-bold text-xs">May 24, 2025</Text>
            <Text className="text-[#8b949e] text-[10px]">Due Date</Text>
          </View>
          <View className="w-[1px] bg-[#1e293b] h-full" />
          <View className="items-center">
            <Clock color="#8b949e" size={16} className="mb-1" />
            <Text className="text-white font-bold text-xs">6h 30m</Text>
            <Text className="text-[#8b949e] text-[10px]">Estimated</Text>
          </View>
          <View className="w-[1px] bg-[#1e293b] h-full" />
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <View className="w-2 h-2 rounded-full bg-red-500" />
              <Text className="text-white font-bold text-xs">High</Text>
            </View>
            <Text className="text-[#8b949e] text-[10px]">Priority</Text>
          </View>
        </View>

        {/* Subtasks */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-white font-bold text-sm tracking-widest uppercase">Subtasks</Text>
            <Text className="text-[#8b949e] text-xs font-bold">3 / 6</Text>
          </View>
          
          <View className="gap-4">
            {subtasks.map((task) => (
              <View key={task.id} className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  {task.completed ? (
                    <CheckSquare color="#10b981" size={20} />
                  ) : (
                    <Square color="#8b949e" size={20} />
                  )}
                  <Text className={task.completed ? 'text-[#8b949e] line-through' : 'text-white'}>
                    {task.title}
                  </Text>
                </View>
                <Text className="text-[#8b949e] text-xs font-mono">{task.time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Execute Button */}
        <TouchableOpacity className="bg-[#10b981] py-4 rounded-xl items-center flex-row justify-center gap-2 mt-4 mb-10 border border-[#34d399]">
          <Play color="#050a0f" size={20} fill="#050a0f" />
          <Text className="text-[#050a0f] font-bold text-lg">Execute Task</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
