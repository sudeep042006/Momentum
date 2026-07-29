import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Settings, Edit2, Calendar, Target, Clock, Trophy, Shield, Zap, CircleDot } from 'lucide-react-native';

export default function ProfileScreen() {
  const detailedStats = [
    { label: 'Total Focus Time', value: '214h 30m', icon: Clock },
    { label: 'Total Deep Work Sessions', value: '185', icon: Target },
    { label: 'Average Session Length', value: '1h 9m', icon: Activity },
    { label: 'Completion Rate', value: '82%', icon: CircleDot },
    { label: 'Longest Streak', value: '41 Days', icon: Zap },
    { label: 'Perfect Days (100%)', value: '12', icon: Trophy },
    { label: 'Most Productive Day', value: 'Tuesday', icon: Calendar },
  ];

  // Fallback for Activity since it's not exported in lucide-react-native sometimes, using CircleDot
  const StatRow = ({ item }) => {
    const Icon = item.icon || Shield;
    return (
      <View className="flex-row items-center justify-between py-4 border-b border-[#1e293b]">
        <View className="flex-row items-center gap-3">
          <Icon color="#8b949e" size={16} />
          <Text className="text-[#8b949e] font-medium text-sm">{item.label}</Text>
        </View>
        <Text className="text-white font-bold text-sm">{item.value}</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#050a0f] pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 mb-6">
        <Text className="text-white font-bold text-xl">Profile</Text>
        <TouchableOpacity>
          <Text className="text-[#10b981] font-bold">Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* User Info */}
        <View className="flex-row items-center gap-4 mb-8 bg-[#0a121a] border border-[#1e293b] p-4 rounded-2xl">
          <View className="w-16 h-16 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 items-center justify-center">
            <Text className="text-[#10b981] font-bold text-2xl">S</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">Sudeep</Text>
            <Text className="text-[#8b949e] text-xs mb-1">Builder • Learner • Thinker</Text>
            <View className="flex-row items-center gap-1">
              <Calendar color="#8b949e" size={12} />
              <Text className="text-[#8b949e] text-[10px]">Joined Jan 2025</Text>
            </View>
          </View>
          <View className="items-end">
             <Text className="text-[#10b981] font-bold text-xs">Level System v1.0</Text>
             <Text className="text-[#8b949e] text-[10px]">Since Day 1</Text>
          </View>
        </View>

        {/* Top Stats */}
        <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
          <View className="w-[30%]">
            <Text className="text-[#10b981] font-bold text-xl mb-1">27</Text>
            <Text className="text-[#8b949e] text-[10px]">Day Streak</Text>
          </View>
          <View className="w-[30%]">
            <Text className="text-[#10b981] font-bold text-xl mb-1">82%</Text>
            <Text className="text-[#8b949e] text-[10px]">Avg. Completion</Text>
          </View>
          <View className="w-[30%]">
            <Text className="text-[#10b981] font-bold text-xl mb-1">214h 30m</Text>
            <Text className="text-[#8b949e] text-[10px]">Focus Hours</Text>
          </View>
          <View className="w-[30%]">
            <Text className="text-[#10b981] font-bold text-xl mb-1">1,284</Text>
            <Text className="text-[#8b949e] text-[10px]">Tasks Completed</Text>
          </View>
          <View className="w-[30%]">
            <Text className="text-[#10b981] font-bold text-xl mb-1">412</Text>
            <Text className="text-[#8b949e] text-[10px]">Total Tasks</Text>
          </View>
          <View className="w-[30%]">
            <Text className="text-[#10b981] font-bold text-xl mb-1">12</Text>
            <Text className="text-[#8b949e] text-[10px]">Perfect Days</Text>
          </View>
        </View>

        {/* Streak History Heatmap */}
        <View className="bg-[#0a121a] border border-[#1e293b] rounded-2xl p-5 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-bold tracking-widest text-sm">Streak History</Text>
            <Text className="text-[#8b949e] text-xs">5 Months</Text>
          </View>
          
          <View className="flex-row flex-wrap gap-1 mb-4">
            {/* Dummy blocks */}
            {Array.from({ length: 120 }).map((_, i) => (
              <View 
                key={i} 
                className={`w-2.5 h-2.5 rounded-sm ${Math.random() > 0.4 ? 'bg-[#10b981]' : 'bg-[#1e293b]'}`}
                style={{ opacity: Math.random() * 0.6 + 0.4 }}
              />
            ))}
          </View>
          
          <View className="flex-row items-center gap-2">
            <Text className="text-[#8b949e] text-xs">Less</Text>
            <View className="flex-row gap-1">
               <View className="w-2 h-2 rounded-sm bg-[#1e293b]" />
               <View className="w-2 h-2 rounded-sm bg-[#10b981]/40" />
               <View className="w-2 h-2 rounded-sm bg-[#10b981]" />
            </View>
            <Text className="text-[#8b949e] text-xs">More</Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <View className="mb-10">
          {detailedStats.map((stat, i) => (
            <StatRow key={i} item={stat} />
          ))}
        </View>

      </ScrollView>
    </View>
  );
}
