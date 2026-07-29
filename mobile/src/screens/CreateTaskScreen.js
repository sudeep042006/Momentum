import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Calendar, Tag, CheckSquare, Plus } from 'lucide-react-native';
import apiClient from '../services/apiClient';

export default function CreateTaskScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleCreate = async () => {
    try {
      await apiClient.post('/api/tasks', {
        title,
        description,
        category: category.toLowerCase() || 'work',
        priority,
        status: 'pending'
      });
      navigation.navigate('Home');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View className="flex-1 bg-[#050a0f] pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 mb-6">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#10b981" size={24} />
          </TouchableOpacity>
          <View>
            <Text className="text-white font-bold text-xl">Create New Task</Text>
            <Text className="text-[#8b949e] text-xs">Break it down. Execute. Complete.</Text>
          </View>
        </View>
        <TouchableOpacity>
          <CheckSquare color="#8b949e" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* Task Title */}
        <View className="mb-5">
          <Text className="text-white text-sm font-bold mb-2">Task Title</Text>
          <TextInput 
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Build user authentication system"
            placeholderTextColor="#8b949e"
            className="bg-[#0a121a] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:border-[#10b981]"
          />
        </View>

        {/* Description */}
        <View className="mb-5">
          <Text className="text-white text-sm font-bold mb-2">Description</Text>
          <TextInput 
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the task, goal, context..."
            placeholderTextColor="#8b949e"
            multiline
            numberOfLines={4}
            className="bg-[#0a121a] border border-[#1e293b] rounded-xl px-4 py-3 text-white h-24 text-top focus:border-[#10b981]"
          />
          <Text className="text-right text-[#8b949e] text-xs mt-1">0/500</Text>
        </View>

        {/* Category */}
        <View className="mb-5">
          <Text className="text-white text-sm font-bold mb-2">Category</Text>
          <TouchableOpacity className="bg-[#0a121a] border border-[#1e293b] rounded-xl px-4 py-3 flex-row items-center justify-between">
            <Text className="text-[#8b949e]">Select category</Text>
          </TouchableOpacity>
        </View>

        {/* Dates */}
        <View className="flex-row gap-4 mb-5">
          <View className="flex-1">
            <Text className="text-white text-sm font-bold mb-2">Start Date</Text>
            <View className="bg-[#0a121a] border border-[#1e293b] rounded-xl px-4 py-3 flex-row items-center gap-2">
              <Calendar color="#8b949e" size={16} />
              <Text className="text-[#8b949e] text-xs">May 24, 2025</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-white text-sm font-bold mb-2">Due Date</Text>
            <View className="bg-[#0a121a] border border-[#1e293b] rounded-xl px-4 py-3 flex-row items-center gap-2">
              <Calendar color="#8b949e" size={16} />
              <Text className="text-[#8b949e] text-xs">Select due date</Text>
            </View>
          </View>
        </View>

        {/* Priority */}
        <View className="mb-5">
          <Text className="text-white text-sm font-bold mb-2">Priority</Text>
          <View className="flex-row gap-2">
            {['Low', 'Medium', 'High', 'Critical'].map((p) => (
              <TouchableOpacity 
                key={p}
                onPress={() => setPriority(p.toLowerCase())}
                className={`flex-1 py-2 rounded-lg border items-center ${
                  priority === p.toLowerCase() ? 'bg-[#10b981]/10 border-[#10b981]' : 'bg-[#0a121a] border-[#1e293b]'
                }`}
              >
                <Text className={priority === p.toLowerCase() ? 'text-[#10b981] font-bold text-xs' : 'text-[#8b949e] font-bold text-xs'}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity 
          onPress={handleCreate}
          className="bg-[#10b981] py-4 rounded-xl items-center mt-4 mb-10"
        >
          <Text className="text-[#050a0f] font-bold text-lg">Create Task</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
