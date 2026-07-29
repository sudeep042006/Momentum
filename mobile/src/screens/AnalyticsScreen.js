import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, ChevronDown, BarChart3, PieChart, Activity } from 'lucide-react-native';

export default function AnalyticsScreen({ navigation }) {
  return (
    <View className="flex-1 bg-[#050a0f] pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 mb-6">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#10b981" size={24} />
          </TouchableOpacity>
          <Text className="text-white font-bold text-xl">Analytics & Progress</Text>
        </View>
        <TouchableOpacity className="flex-row items-center gap-1">
          <Text className="text-[#8b949e] text-xs">Last 12 Weeks</Text>
          <ChevronDown color="#8b949e" size={14} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* Top Stats */}
        <View className="flex-row justify-between mb-4">
          <View className="flex-1 items-center bg-[#0a121a] border border-[#1e293b] rounded-xl p-4 mr-2">
            <Text className="text-[#10b981] font-bold text-2xl mb-1">82%</Text>
            <Text className="text-[#8b949e] text-[10px] text-center">Avg. Completion</Text>
          </View>
          <View className="flex-1 items-center bg-[#0a121a] border border-[#1e293b] rounded-xl p-4 mx-1">
            <Text className="text-[#10b981] font-bold text-2xl mb-1">27</Text>
            <Text className="text-[#8b949e] text-[10px] text-center">Day Streak</Text>
          </View>
          <View className="flex-1 items-center bg-[#0a121a] border border-[#1e293b] rounded-xl p-4 ml-2">
            <Text className="text-[#10b981] font-bold text-2xl mb-1">214h</Text>
            <Text className="text-[#8b949e] text-[10px] text-center">Focus Hours</Text>
          </View>
        </View>

        <View className="flex-row justify-between mb-8">
          <View className="flex-1 items-center bg-[#0a121a] border border-[#1e293b] rounded-xl p-4 mr-2">
            <Text className="text-[#10b981] font-bold text-2xl mb-1">1,284</Text>
            <Text className="text-[#8b949e] text-[10px] text-center">Tasks Completed</Text>
          </View>
          <View className="flex-1 items-center bg-[#0a121a] border border-[#1e293b] rounded-xl p-4 mx-1">
            <Text className="text-[#10b981] font-bold text-2xl mb-1">94%</Text>
            <Text className="text-[#8b949e] text-[10px] text-center">Best Day</Text>
          </View>
          <View className="flex-1 items-center bg-[#0a121a] border border-[#1e293b] rounded-xl p-4 ml-2">
            <Text className="text-[#10b981] font-bold text-2xl mb-1">3.6h</Text>
            <Text className="text-[#8b949e] text-[10px] text-center">Avg. Daily Focus</Text>
          </View>
        </View>

        {/* Line Chart Placeholder */}
        <View className="bg-[#0a121a] border border-[#1e293b] rounded-2xl p-5 mb-6 h-56">
          <Text className="text-white font-bold tracking-widest text-sm mb-4">Completion Over Time</Text>
          <View className="flex-1 items-center justify-center border border-dashed border-[#1e293b] rounded-xl">
             <Activity color="#10b981" size={32} className="opacity-50 mb-2" />
             <Text className="text-[#8b949e] text-xs">Line Chart Visualization</Text>
          </View>
        </View>

        {/* Pie Chart / Distribution */}
        <View className="bg-[#0a121a] border border-[#1e293b] rounded-2xl p-5 mb-6 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-bold tracking-widest text-sm mb-4">Distribution</Text>
            <View className="items-center justify-center">
              <PieChart color="#10b981" size={80} strokeWidth={1} />
            </View>
          </View>
          <View className="flex-1 gap-3 ml-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-[#10b981]" />
                <Text className="text-white text-xs">100%</Text>
              </View>
              <Text className="text-[#8b949e] text-xs">16 days (52%)</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-[#34d399]" />
                <Text className="text-white text-xs">75 - 99%</Text>
              </View>
              <Text className="text-[#8b949e] text-xs">7 days (23%)</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-[#1e293b]" />
                <Text className="text-white text-xs">0 - 24%</Text>
              </View>
              <Text className="text-[#8b949e] text-xs">1 day (3%)</Text>
            </View>
          </View>
        </View>

        {/* Bar Chart Placeholder */}
        <View className="bg-[#0a121a] border border-[#1e293b] rounded-2xl p-5 mb-10 h-56">
          <Text className="text-white font-bold tracking-widest text-sm mb-4">Focus Time Trend</Text>
          <View className="flex-1 flex-row items-end justify-between pt-4 border-b border-[#1e293b]">
             {/* Dummy Bars */}
             {[4, 8, 3, 6, 9, 2, 5].map((val, i) => (
                <View key={i} className="w-6 bg-[#10b981] rounded-t-sm" style={{ height: `${val * 10}%` }} />
             ))}
          </View>
          <View className="flex-row justify-between mt-2">
             <Text className="text-[#8b949e] text-[10px]">Mon</Text>
             <Text className="text-[#8b949e] text-[10px]">Wed</Text>
             <Text className="text-[#8b949e] text-[10px]">Fri</Text>
             <Text className="text-[#8b949e] text-[10px]">Sun</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
