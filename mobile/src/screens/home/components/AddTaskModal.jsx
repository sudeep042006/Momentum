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
  StyleSheet,
  Keyboard,
} from 'react-native';
import { X, Plus, Clock } from 'lucide-react-native';
import { colors } from '../../../theme/colors';
import TimePickerModal from '../../../components/pickers/TimePickerModal';

const CATEGORIES = [
  { label: 'WORK', value: 'work' },
  { label: 'DEVELOPMENT', value: 'development', apiCategory: 'work' },
  { label: 'PRACTICE', value: 'practice', apiCategory: 'learning' },
  { label: 'LEARNING', value: 'learning', apiCategory: 'learning' },
  { label: 'PERSONAL', value: 'personal', apiCategory: 'personal' },
  { label: 'HEALTH', value: 'health', apiCategory: 'health' },
];

export default function AddTaskModal({ visible, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('work');
  const [startTime, setStartTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const selectedCat = CATEGORIES.find((c) => c.value === category);
    onAdd({
      title: title.trim(),
      category: selectedCat?.apiCategory || category,
      displayCategory: category,
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
      onRequestClose={() => {
        if (showTimePicker) {
          setShowTimePicker(false);
        } else {
          onClose();
        }
      }}
    >
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={onClose}
            className="flex-1 bg-black/80 justify-end"
          >
            {/* Modal Content Card */}
            <TouchableOpacity
              activeOpacity={1}
              className="bg-[#000000] border-t-2 border-momentum-emerald rounded-t-3xl p-6 pb-8 max-h-[90%]"
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
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
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
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
                              ? 'bg-[#000000] border-momentum-emerald'
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

                {/* Time Target (Touch to Pick) */}
                <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
                  Scheduled Time (Optional)
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowTimePicker(true);
                  }}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-between bg-momentum-input border border-momentum-border rounded-xl px-3.5 py-3 mb-6"
                >
                  <View className="flex-row items-center gap-2">
                    <Clock size={15} color={startTime ? colors.emerald.bright : colors.text.muted} />
                    <Text className={`text-xs font-mono font-bold ${startTime ? 'text-white' : 'text-momentum-textMuted'}`}>
                      {startTime || 'Tap to choose time (e.g. 09:00 PM)'}
                    </Text>
                  </View>
                  {startTime ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setStartTime('');
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text className="text-[10px] font-mono text-red-400 font-bold">CLEAR</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text className="text-[10px] font-mono text-momentum-emerald font-bold">PICK</Text>
                  )}
                </TouchableOpacity>

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
                  <Text className="text-sm font-bold text-black font-sans">
                    Add Task
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>

      {/* Time Picker Overlay - Positioned in the DEAD CENTER above the task sheet */}
      {showTimePicker && (
        <TimePickerModal
          visible={true}
          inline={true}
          title="Select Task Scheduled Time"
          initialTime={startTime || '09:00 AM'}
          onClose={() => setShowTimePicker(false)}
          onSelectTime={(formatted12h) => {
            setStartTime(formatted12h);
            setShowTimePicker(false);
          }}
        />
      )}
      </View>
    </Modal>
  );
}
