import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, Plus, Clock } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

const CATEGORIES = [
  { label: 'DEVELOPMENT', value: 'development' },
  { label: 'PRACTICE', value: 'practice' },
  { label: 'LEARNING', value: 'learning' },
  { label: 'BACKEND', value: 'backend' },
  { label: 'PLANNING', value: 'planning' },
  { label: 'HEALTH', value: 'health' },
];

export default function AddTaskModal({ visible, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('development');
  const [startTime, setStartTime] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      category,
      priority: 'medium',
      startTime: startTime.trim() || null,
    });
    setTitle('');
    setStartTime('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="flex-1 bg-black/80 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-momentum-card border-t border-momentum-borderLight rounded-t-3xl p-6 pb-8"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-white tracking-tight">
                New Today's Task
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="p-1 -mr-1"
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Task Title Input */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Implement Redis caching"
              placeholderTextColor={colors.text.muted}
              autoFocus
              className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3.5 text-sm text-white mb-4"
            />

            {/* Category Selector */}
            <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-2">
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => setCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#0D241C] border-momentum-emerald'
                          : 'bg-momentum-surface border-momentum-border'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-mono font-bold tracking-wider ${
                          isSelected ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Time Target */}
            <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
              Scheduled Time (Optional)
            </Text>
            <View className="flex-row items-center bg-momentum-input border border-momentum-border rounded-xl px-3 py-2.5 mb-6">
              <Clock size={14} color={colors.text.muted} />
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="e.g. 09:00 PM"
                placeholderTextColor={colors.text.muted}
                className="flex-1 text-xs text-white font-mono ml-2 py-0"
              />
            </View>

            {/* Add Task Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!title.trim()}
              activeOpacity={0.8}
              className={`w-full py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                title.trim() ? 'bg-momentum-emerald' : 'bg-momentum-emerald/30'
              }`}
            >
              <Plus size={16} color="#000000" strokeWidth={3} />
              <Text className="text-sm font-bold text-black">
                Add Task
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
