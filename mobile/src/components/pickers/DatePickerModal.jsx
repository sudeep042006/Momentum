import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DatePickerModal({
  visible,
  initialDate = '',
  title = 'Select Date',
  onClose,
  onSelectDate,
}) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (visible) {
      if (initialDate) {
        const parts = initialDate.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          if (!isNaN(d.getTime())) {
            setSelectedDate(d);
            setCurrentMonthDate(d);
            return;
          }
        }
      }
      const now = new Date();
      setSelectedDate(now);
      setCurrentMonthDate(now);
    }
  }, [visible, initialDate]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayNum) => {
    const d = new Date(year, month, dayNum);
    setSelectedDate(d);
  };

  const formatDateStr = (d) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleConfirm = () => {
    onSelectDate(formatDateStr(selectedDate));
    onClose();
  };

  const handleApplyPreset = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setSelectedDate(d);
    setCurrentMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  if (!visible) return null;

  const isToday = (dayNum) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (dayNum) => {
    return (
      selectedDate.getDate() === dayNum &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const previewFormatted = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
      >
        {/* Sibling touchable backdrop to dismiss on outside tap */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={StyleSheet.absoluteFillObject}
        />

        <View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: '#000000',
            borderRadius: 24,
            borderColor: '#00E676',
            borderWidth: 1.5,
            padding: 20,
            shadowColor: '#00E676',
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3.5">
            <View className="flex-row items-center gap-2">
              <CalendarIcon size={18} color={colors.emerald.bright} />
              <Text allowFontScaling={false} className="text-base font-bold text-white tracking-tight">
                {title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-[#000000] border border-momentum-border items-center justify-center"
            >
              <X size={15} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3.5">
            <View className="flex-row gap-1.5">
              {[
                { label: 'Today', days: 0 },
                { label: 'Tomorrow', days: 1 },
                { label: 'Next Week', days: 7 },
                { label: 'In 1 Month', days: 30 },
                { label: 'In 3 Months', days: 90 },
              ].map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleApplyPreset(p.days)}
                  activeOpacity={0.7}
                  className="px-2.5 py-1 rounded-lg bg-[#000000] border border-momentum-border"
                >
                  <Text allowFontScaling={false} className="text-[10px] font-mono text-momentum-textSecondary font-semibold">
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Month / Year Navigator */}
          <View className="flex-row items-center justify-between bg-[#050D08] border border-[#142E1F] rounded-xl px-3 py-2 mb-3">
            <TouchableOpacity
              onPress={handlePrevMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 rounded-lg bg-[#000000] border border-momentum-border items-center justify-center"
            >
              <ChevronLeft size={16} color={colors.text.secondary} />
            </TouchableOpacity>

            <Text allowFontScaling={false} className="text-xs font-mono font-bold text-white tracking-wide">
              {MONTH_NAMES[month]} {year}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 rounded-lg bg-[#000000] border border-momentum-border items-center justify-center"
            >
              <ChevronRight size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Days of week */}
          <View className="flex-row mb-1">
            {DAYS_HEADER.map((d, idx) => (
              <View key={idx} style={{ width: `${100 / 7}%` }} className="items-center py-1">
                <Text allowFontScaling={false} className="text-[10px] font-mono font-bold text-momentum-textMuted">
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap mb-4">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <View key={`empty-${idx}`} style={{ width: `${100 / 7}%`, aspectRatio: 1.1 }} />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);

              return (
                <View key={`day-${dayNum}`} style={{ width: `${100 / 7}%`, aspectRatio: 1.1 }} className="p-0.5">
                  <TouchableOpacity
                    onPress={() => handleDaySelect(dayNum)}
                    activeOpacity={0.7}
                    className={`w-full h-full rounded-xl items-center justify-center border ${
                      selected
                        ? 'bg-momentum-emerald border-momentum-emerald'
                        : today
                        ? 'bg-[#000000] border-momentum-emerald'
                        : 'bg-[#000000] border-transparent'
                    }`}
                  >
                    <Text
                      allowFontScaling={false}
                      className={`text-xs font-mono font-bold ${
                        selected
                          ? 'text-black'
                          : today
                          ? 'text-momentum-emerald'
                          : 'text-white'
                      }`}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={handleConfirm}
            activeOpacity={0.8}
            className="w-full py-3.5 rounded-xl bg-momentum-emerald flex-row items-center justify-center gap-2"
          >
            <Check size={16} color="#000000" strokeWidth={3} />
            <Text allowFontScaling={false} className="text-sm font-bold text-black font-sans">
              Set Date ({formatDateStr(selectedDate)})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
