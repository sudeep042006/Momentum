import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { X, Clock, Check } from 'lucide-react-native';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const QUICK_PRESETS = [
  { label: '8 AM', h: 8, m: '00', p: 'AM' },
  { label: '10 AM', h: 10, m: '00', p: 'AM' },
  { label: '2 PM', h: 2, m: '00', p: 'PM' },
  { label: '6 PM', h: 6, m: '00', p: 'PM' },
  { label: '9 PM', h: 9, m: '00', p: 'PM' },
];

export default function TimePickerModal({
  visible,
  initialTime = '',
  title = 'Select Time',
  onClose,
  onSelectTime,
  inline = false,
}) {
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  useEffect(() => {
    if (visible) {
      if (initialTime) {
        parseInitialTime(initialTime);
      } else {
        const now = new Date();
        let h = now.getHours();
        const p = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        setSelectedHour(h);
        const m = Math.floor(now.getMinutes() / 5) * 5;
        setSelectedMinute(m.toString().padStart(2, '0'));
        setSelectedPeriod(p);
      }
    }
  }, [visible, initialTime]);

  const parseInitialTime = (timeStr) => {
    try {
      const clean = timeStr.trim();
      const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = match12[2];
        const p = match12[3] ? match12[3].toUpperCase() : (h >= 12 ? 'PM' : 'AM');
        if (!match12[3] && h > 12) {
          h = h - 12;
        } else if (h === 0) {
          h = 12;
        }
        setSelectedHour(h);
        setSelectedMinute(m);
        setSelectedPeriod(p);
      }
    } catch (e) {
      // Keep defaults
    }
  };

  const handleConfirm = () => {
    const hourStr = selectedHour.toString().padStart(2, '0');
    const formatted12h = `${hourStr}:${selectedMinute} ${selectedPeriod}`;

    let h24 = selectedHour;
    if (selectedPeriod === 'PM' && h24 < 12) h24 += 12;
    if (selectedPeriod === 'AM' && h24 === 12) h24 = 0;
    const formatted24h = `${h24.toString().padStart(2, '0')}:${selectedMinute}`;

    onSelectTime(formatted12h, formatted24h);
    onClose();
  };

  if (!visible) return null;

  const currentPreview = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute} ${selectedPeriod}`;

  const pickerContent = (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 999999,
        elevation: 999999,
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
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Clock size={18} color={colors.emerald.bright} />
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

        {/* Big Digital Display + AM/PM Toggle */}
        <View className="bg-[#050D08] border border-[#142E1F] rounded-2xl p-4 mb-4 flex-row items-center justify-between">
          <View className="flex-row items-baseline gap-1">
            <Text allowFontScaling={false} className="text-3xl font-mono font-bold text-white tracking-tight">
              {selectedHour.toString().padStart(2, '0')}
            </Text>
            <Text allowFontScaling={false} className="text-2xl font-mono font-bold text-momentum-emerald animate-pulse">
              :
            </Text>
            <Text allowFontScaling={false} className="text-3xl font-mono font-bold text-white tracking-tight">
              {selectedMinute}
            </Text>
          </View>

          {/* AM / PM Segment */}
          <View className="flex-row bg-[#000000] border border-[#142E1F] rounded-xl p-1 gap-1">
            <TouchableOpacity
              onPress={() => setSelectedPeriod('AM')}
              activeOpacity={0.8}
              className={`px-3 py-1.5 rounded-lg ${
                selectedPeriod === 'AM' ? 'bg-momentum-emerald' : 'bg-transparent'
              }`}
            >
              <Text
                allowFontScaling={false}
                className={`text-xs font-mono font-bold ${
                  selectedPeriod === 'AM' ? 'text-black' : 'text-momentum-textMuted'
                }`}
              >
                AM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPeriod('PM')}
              activeOpacity={0.8}
              className={`px-3 py-1.5 rounded-lg ${
                selectedPeriod === 'PM' ? 'bg-momentum-emerald' : 'bg-transparent'
              }`}
            >
              <Text
                allowFontScaling={false}
                className={`text-xs font-mono font-bold ${
                  selectedPeriod === 'PM' ? 'text-black' : 'text-momentum-textMuted'
                }`}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Presets */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-1.5">
            {QUICK_PRESETS.map((qp, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setSelectedHour(qp.h);
                  setSelectedMinute(qp.m);
                  setSelectedPeriod(qp.p);
                }}
                activeOpacity={0.7}
                className="px-2.5 py-1 rounded-lg bg-[#000000] border border-momentum-border"
              >
                <Text allowFontScaling={false} className="text-[10px] font-mono text-momentum-textSecondary font-semibold">
                  {qp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Hours Grid */}
        <Text allowFontScaling={false} className="text-[10px] font-mono uppercase tracking-wider text-momentum-textMuted font-bold mb-2">
          Hour
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {HOURS.map((h) => {
            const isSelected = selectedHour === h;
            return (
              <TouchableOpacity
                key={h}
                onPress={() => setSelectedHour(h)}
                activeOpacity={0.7}
                style={{ width: '14%', aspectRatio: 1.1 }}
                className={`rounded-xl items-center justify-center border ${
                  isSelected
                    ? 'bg-momentum-emerald border-momentum-emerald'
                    : 'bg-[#000000] border-momentum-border'
                }`}
              >
                <Text
                  allowFontScaling={false}
                  className={`text-xs font-mono font-bold ${
                    isSelected ? 'text-black' : 'text-white'
                  }`}
                >
                  {h}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Minutes Grid */}
        <Text allowFontScaling={false} className="text-[10px] font-mono uppercase tracking-wider text-momentum-textMuted font-bold mb-2">
          Minutes
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {MINUTES.map((m) => {
            const isSelected = selectedMinute === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMinute(m)}
                activeOpacity={0.7}
                style={{ width: '14%', aspectRatio: 1.1 }}
                className={`rounded-xl items-center justify-center border ${
                  isSelected
                    ? 'bg-momentum-emerald border-momentum-emerald'
                    : 'bg-[#000000] border-momentum-border'
                }`}
              >
                <Text
                  allowFontScaling={false}
                  className={`text-[11px] font-mono font-bold ${
                    isSelected ? 'text-black' : 'text-white'
                  }`}
                >
                  {m}
                </Text>
              </TouchableOpacity>
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
            Set Time ({currentPreview})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (inline) {
    return pickerContent;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {pickerContent}
    </Modal>
  );
}
