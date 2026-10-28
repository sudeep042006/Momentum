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
  StyleSheet,
  Keyboard,
} from 'react-native';
import { X, Plus, Clock, Trash2, CheckSquare, Square } from 'lucide-react-native';
import { colors } from '../../../theme/colors';
import { formatTime12h, formatTime24h } from '../../../utils/timeUtils';
import TimePickerModal from '../../../components/pickers/TimePickerModal';

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
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [category, setCategory] = useState('LEARNING');
  const [addToDailyList, setAddToDailyList] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState(null); // 'start' | 'end' | null

  useEffect(() => {
    if (initialData) {
      const rawTitle = initialData.title || '';
      const isPlaceholder =
        rawTitle === 'Free Slot' ||
        /^[0-9a-fA-F]{24,}$/.test(rawTitle.trim());
      setTitle(isPlaceholder ? '' : rawTitle);

      const rawStart = initialData.startTime || '08:00';
      const rawEnd = initialData.endTime || '09:00';
      setStartTime(rawStart);
      setEndTime(rawEnd);

      setCategory(initialData.category || 'LEARNING');
      setAddToDailyList(Boolean(initialData.addToDailyList));
    } else {
      setTitle('');
      setStartTime('08:00');
      setEndTime('09:00');
      setCategory('LEARNING');
      setAddToDailyList(false);
    }
    setTimePickerTarget(null);
  }, [initialData, visible]);

  const handleOpenTimePicker = (target) => {
    Keyboard.dismiss();
    setTimePickerTarget(target);
  };

  const handleSubmit = () => {
    const finalStart = formatTime24h(startTime) || startTime || '08:00';
    const finalEnd = formatTime24h(endTime) || endTime || '09:00';
    const finalTitle = title.trim() || initialData?.title || 'Free Slot';

    onSave({
      id: initialData?.id || initialData?._id || `block_${Date.now()}`,
      _id: initialData?._id,
      title: finalTitle,
      startTime: finalStart,
      endTime: finalEnd,
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
      onRequestClose={() => {
        if (timePickerTarget) {
          setTimePickerTarget(null);
        } else {
          onClose();
        }
      }}
    >
      {/* Single Root Container for Modal ensures exact full-screen coordinates on Android */}
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
            {/* Backdrop Dismiss Area - Sibling avoids touch bubbling bugs on Android */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={onClose}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Modal Bottom Sheet Card */}
            <View
              style={{
                backgroundColor: '#000000',
                borderTopWidth: 2,
                borderTopColor: '#00E676',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingTop: 20,
                paddingHorizontal: 20,
                paddingBottom: Platform.OS === 'ios' ? 36 : 24,
                maxHeight: '90%',
                shadowColor: '#00E676',
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 20,
              }}
            >
              <ScrollView
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text allowFontScaling={false} className="text-base font-bold text-white tracking-tight">
                      {initialData ? 'Edit Activity Block' : 'New Schedule Activity'}
                    </Text>
                    <Text allowFontScaling={false} className="text-[10px] font-mono text-momentum-textSecondary">
                      Configure time, title, and daily task sync
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-8 h-8 rounded-full bg-[#050D08] border border-momentum-border items-center justify-center"
                  >
                    <X size={16} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                {/* Title Input */}
                <Text allowFontScaling={false} className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
                  Activity Title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={
                    initialData?.title && initialData.title !== 'Free Slot'
                      ? initialData.title
                      : 'e.g. Deep Work, DSA, Gym, Study'
                  }
                  placeholderTextColor={colors.text.muted}
                  className="bg-momentum-input border border-momentum-border rounded-xl px-4 py-3 text-sm text-white mb-4"
                />

                {/* Times Row (Touch to Pick with AM/PM) */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text allowFontScaling={false} className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
                      Start Time
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleOpenTimePicker('start')}
                      activeOpacity={0.8}
                      className="bg-momentum-input border border-momentum-border rounded-xl px-3.5 py-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-2">
                        <Clock size={15} color={colors.emerald.bright} />
                        <Text allowFontScaling={false} className="text-xs font-mono font-bold text-white">
                          {formatTime12h(startTime) || '08:00 AM'}
                        </Text>
                      </View>
                      <View className="bg-[#00E676]/15 border border-[#00E676]/30 px-2 py-0.5 rounded">
                        <Text allowFontScaling={false} className="text-[9px] font-mono text-momentum-emerald font-bold">
                          PICK
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-1">
                    <Text allowFontScaling={false} className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-1.5">
                      End Time
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleOpenTimePicker('end')}
                      activeOpacity={0.8}
                      className="bg-momentum-input border border-momentum-border rounded-xl px-3.5 py-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-2">
                        <Clock size={15} color={colors.emerald.bright} />
                        <Text allowFontScaling={false} className="text-xs font-mono font-bold text-white">
                          {formatTime12h(endTime) || '09:00 AM'}
                        </Text>
                      </View>
                      <View className="bg-[#00E676]/15 border border-[#00E676]/30 px-2 py-0.5 rounded">
                        <Text allowFontScaling={false} className="text-[9px] font-mono text-momentum-emerald font-bold">
                          PICK
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Category */}
                <Text allowFontScaling={false} className="text-[10px] font-mono uppercase tracking-wider font-semibold text-momentum-textSecondary mb-2">
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
                            allowFontScaling={false}
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

                {/* Add to Daily List toggle */}
                <TouchableOpacity
                  onPress={() => setAddToDailyList(!addToDailyList)}
                  activeOpacity={0.8}
                  className="flex-row items-center gap-2.5 mb-5 p-3 rounded-xl bg-momentum-surface border border-momentum-border"
                >
                  {addToDailyList ? (
                    <CheckSquare size={18} color={colors.emerald.bright} />
                  ) : (
                    <Square size={18} color={colors.text.muted} />
                  )}
                  <View className="flex-1">
                    <Text allowFontScaling={false} className="text-xs font-bold text-white">
                      Add to Daily Tasks
                    </Text>
                    <Text allowFontScaling={false} className="text-[10px] text-momentum-textSecondary mt-0.5">
                      Automatically populate today's task list from this block
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View className="flex-row gap-2.5">
                  {initialData && onDelete ? (
                    <TouchableOpacity
                      onPress={() => {
                        onDelete(initialData);
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
                    activeOpacity={0.8}
                    className="flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2 bg-momentum-emerald"
                  >
                    <Plus size={16} color="#000000" strokeWidth={3} />
                    <Text allowFontScaling={false} className="text-sm font-bold text-black font-sans">
                      {initialData ? 'Save Changes' : 'Add Activity'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* In-Modal Inline Time Picker Overlay - Centered Directly on Screen Floating ABOVE the Edit Block */}
        {timePickerTarget !== null && (
          <TimePickerModal
            visible={true}
            inline={true}
            title={timePickerTarget === 'start' ? 'Select Start Time' : 'Select End Time'}
            initialTime={timePickerTarget === 'start' ? startTime : endTime}
            onClose={() => setTimePickerTarget(null)}
            onSelectTime={(formatted12h, formatted24h) => {
              const val = formatted24h || formatted12h;
              if (timePickerTarget === 'start') {
                setStartTime(val);
              } else if (timePickerTarget === 'end') {
                setEndTime(val);
              }
              setTimePickerTarget(null);
            }}
          />
        )}
      </View>
    </Modal>
  );
}
