import React, { useState, useEffect } from 'react';
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
import { X, Plus, Clock, Trash2, CheckSquare, Square } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

const CATEGORIES = [
  { label: 'HEALTH', value: 'HEALTH' },
  { label: 'PERSONAL', value: 'PERSONAL' },
  { label: 'ACADEMIC', value: 'ACADEMIC' },
  { label: 'LEARNING', value: 'LEARNING' },
  { label: 'DEVELOPMENT', value: 'DEVELOPMENT' },
  { label: 'ROUTINE', value: 'ROUTINE' },
];

export default function EditBlockModal({ visible, initialData = null, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('LEARNING');
  const [addToDailyList, setAddToDailyList] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setStartTime(initialData.startTime || '');
      setEndTime(initialData.endTime || '');
      setCategory(initialData.category || 'LEARNING');
      setAddToDailyList(Boolean(initialData.addToDailyList));
    } else {
      setTitle('');
      setStartTime('');
      setEndTime('');
      setCategory('LEARNING');
      setAddToDailyList(false);
    }
  }, [initialData, visible]);

  const handleSubmit = () => {
    if (!title.trim() || !startTime.trim() || !endTime.trim()) return;
    onSave({
      id: initialData?.id || `block_${Date.now()}`,
      title: title.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      category,
      addToDailyList,
    });
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
            className="bg-[#000000] border-t-2 border-momentum-emerald rounded-t-3xl p-6 pb-8"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-white tracking-tight">
                {initialData ? 'Edit Activity Block' : 'New Schedule Activity'}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="p-1 -mr-1"
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Activity title (e.g. DSA or Backend)"
              placeholderTextColor={colors.text.muted}
              className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3.5 text-sm text-white mb-3"
            />

            {/* Times */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
                  Start (e.g. 05:00 PM)
                </Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="05:00 PM"
                  placeholderTextColor={colors.text.muted}
                  className="bg-momentum-input border border-momentum-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
                  End (e.g. 06:00 PM)
                </Text>
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="06:00 PM"
                  placeholderTextColor={colors.text.muted}
                  className="bg-momentum-input border border-momentum-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                />
              </View>
            </View>

            {/* Category */}
            <Text className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-2">
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
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

            {/* Add to Daily List checkbox */}
            <TouchableOpacity
              onPress={() => setAddToDailyList(!addToDailyList)}
              activeOpacity={0.8}
              className="flex-row items-center gap-2 mb-5 p-2 rounded-xl bg-momentum-surface border border-momentum-border"
            >
              {addToDailyList ? (
                <CheckSquare size={16} color={colors.emerald.bright} />
              ) : (
                <Square size={16} color={colors.text.muted} />
              )}
              <View className="flex-1">
                <Text className="text-xs font-bold text-white">
                  Add to Daily Tasks
                </Text>
                <Text className="text-[10px] text-momentum-textSecondary">
                  Automatically sync this activity to your Today's Tasks
                </Text>
              </View>
            </TouchableOpacity>

            {/* Submit & Delete Buttons */}
            <View className="flex-row gap-2">
              {initialData && onDelete ? (
                <TouchableOpacity
                  onPress={() => {
                    onDelete(initialData.id);
                    onClose();
                  }}
                  activeOpacity={0.8}
                  className="px-4 py-3.5 rounded-xl border border-red-800 bg-red-950/40 items-center justify-center"
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!title.trim() || !startTime.trim() || !endTime.trim()}
                activeOpacity={0.8}
                className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                  title.trim() && startTime.trim() && endTime.trim()
                    ? 'bg-momentum-emerald'
                    : 'bg-momentum-emerald/30'
                }`}
              >
                <Plus size={16} color="#000000" strokeWidth={3} />
                <Text className="text-sm font-bold text-black font-sans">
                  {initialData ? 'Save Changes' : 'Add Activity'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
