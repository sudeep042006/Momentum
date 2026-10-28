import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Vibration,
  StatusBar,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Music,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Flame,
  CheckCircle2,
  Coffee,
  Brain,
  FolderOpen,
} from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import MusicManagerModal from '../../components/MusicManagerModal';
import { useAudio } from '../../context/AudioContext';
import { localStorage } from '../../storage/localStorage';
import { colors } from '../../theme/colors';

function LiveEqualizer({ isPlaying }) {
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.7)).current;
  const bar3 = useRef(new Animated.Value(0.5)).current;
  const bar4 = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!isPlaying) {
      bar1.setValue(0.2);
      bar2.setValue(0.2);
      bar3.setValue(0.2);
      bar4.setValue(0.2);
      return;
    }

    const animLoop = (anim, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.2, duration, useNativeDriver: false }),
        ])
      );

    const a1 = animLoop(bar1, 320);
    const a2 = animLoop(bar2, 440);
    const a3 = animLoop(bar3, 290);
    const a4 = animLoop(bar4, 510);

    a1.start();
    a2.start();
    a3.start();
    a4.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      a4.stop();
    };
  }, [isPlaying]);

  return (
    <View className="flex-row items-end gap-1 h-4 px-1 justify-center">
      <Animated.View
        style={{
          width: 3,
          height: bar1.interpolate({ inputRange: [0, 1], outputRange: [3, 15] }),
          backgroundColor: '#00E676',
          borderRadius: 2,
        }}
      />
      <Animated.View
        style={{
          width: 3,
          height: bar2.interpolate({ inputRange: [0, 1], outputRange: [3, 18] }),
          backgroundColor: '#00E676',
          borderRadius: 2,
        }}
      />
      <Animated.View
        style={{
          width: 3,
          height: bar3.interpolate({ inputRange: [0, 1], outputRange: [3, 13] }),
          backgroundColor: '#00E676',
          borderRadius: 2,
        }}
      />
      <Animated.View
        style={{
          width: 3,
          height: bar4.interpolate({ inputRange: [0, 1], outputRange: [3, 19] }),
          backgroundColor: '#00E676',
          borderRadius: 2,
        }}
      />
    </View>
  );
}

const MODES = [
  { id: 'focus25', label: 'Pomodoro', duration: 25 * 60, type: 'focus', title: 'Focus Sprint (25m)' },
  { id: 'focus50', label: 'Deep Work', duration: 50 * 60, type: 'focus', title: 'Deep Work Block (50m)' },
  { id: 'break5', label: 'Short Break', duration: 5 * 60, type: 'break', title: 'Rest & Hydrate (5m)' },
  { id: 'break15', label: 'Long Break', duration: 15 * 60, type: 'break', title: 'Recharge Reset (15m)' },
];

const STORAGE_KEY_POMODORO_STATS = 'momentum_pomodoro_stats_v1';

export default function FocusPomodoroScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    activeTrack,
    isPlaying: isAudioPlaying,
    isMuted,
    volume,
    play: playAudio,
    pause: pauseAudio,
    toggleMute,
    setVolume,
    autoPlayWithPomodoro,
  } = useAudio();

  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [timeLeft, setTimeLeft] = useState(MODES[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState(0);
  const [showMusicModal, setShowMusicModal] = useState(false);

  const timerRef = useRef(null);

  // Load daily focus stats
  useEffect(() => {
    (async () => {
      try {
        const todayKey = new Date().toISOString().split('T')[0];
        const raw = await localStorage.getItem(STORAGE_KEY_POMODORO_STATS);
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (parsed?.date === todayKey) {
            setCyclesCompleted(parsed.cycles || 0);
            setTotalFocusMinutesToday(parsed.focusMinutes || 0);
          }
        }
      } catch (e) {
        // Non-blocking
      }
    })();
  }, []);

  const saveDailyStats = async (newCycles, newMinutes) => {
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      const data = {
        date: todayKey,
        cycles: newCycles,
        focusMinutes: newMinutes,
      };
      await localStorage.setItem(STORAGE_KEY_POMODORO_STATS, JSON.stringify(data));
    } catch (e) {
      // Non-blocking
    }
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, selectedMode]);

  // Handle session complete
  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 500, 200, 500]);
    }

    if (selectedMode.type === 'focus') {
      const focusMins = Math.round(selectedMode.duration / 60);
      const nextCycles = cyclesCompleted + 1;
      const nextTotalMins = totalFocusMinutesToday + focusMins;

      setCyclesCompleted(nextCycles);
      setTotalFocusMinutesToday(nextTotalMins);
      await saveDailyStats(nextCycles, nextTotalMins);

      Alert.alert(
        '🎯 Flow Session Complete!',
        `Great job! You conquered ${focusMins} minutes of uninterrupted focus. Ready for a well-deserved break?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Take 5m Break',
            onPress: () => handleSelectMode(MODES[2]),
          },
        ]
      );
    } else {
      Alert.alert(
        '☕ Break Finished!',
        'Recharged and ready to go? Start your next high-impact focus sprint!',
        [
          { text: 'Dismiss', style: 'cancel' },
          {
            text: 'Start Focus',
            onPress: () => handleSelectMode(MODES[0]),
          },
        ]
      );
    }
  }, [selectedMode, cyclesCompleted, totalFocusMinutesToday]);

  const handleSelectMode = (mode) => {
    setIsRunning(false);
    setSelectedMode(mode);
    setTimeLeft(mode.duration);
  };

  const handleToggleTimer = async () => {
    if (!isRunning) {
      // Starting session
      setIsRunning(true);
      if (autoPlayWithPomodoro && !isAudioPlaying) {
        try {
          await playAudio(activeTrack?.id);
        } catch {}
      }
    } else {
      // Pausing session
      setIsRunning(false);
    }
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedMode.duration);
  };

  const handleSkip = () => {
    if (selectedMode.type === 'focus') {
      handleSelectMode(MODES[2]); // switch to short break
    } else {
      handleSelectMode(MODES[0]); // switch back to pomodoro focus
    }
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;

  // SVG Progress circle calculations
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressFraction = timeLeft / selectedMode.duration;
  const strokeDashoffset = circumference * (1 - progressFraction);

  const isFocusMode = selectedMode.type === 'focus';
  const ringColor = isFocusMode ? '#00E676' : '#38BDF8';

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />
      <AppHeader navigation={navigation} title="Focus & Pomodoro" />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 24, 34),
          paddingHorizontal: 18,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Selector Chips */}
        <View className="flex-row items-center justify-between p-1 rounded-2xl bg-[#0A100C] border border-[#16251A] mb-6">
          {MODES.map((mode) => {
            const isSelected = selectedMode.id === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                onPress={() => handleSelectMode(mode)}
                activeOpacity={0.8}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${
                  isSelected ? 'bg-[#002A14] border border-momentum-emerald/60' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    isSelected ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
                  }`}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Circular Countdown Ring */}
        <View className="items-center justify-center my-3 relative">
          <Svg width={240} height={240} viewBox="0 0 240 240">
            {/* Background Track */}
            <Circle
              cx={120}
              cy={120}
              r={radius}
              stroke="#101C14"
              strokeWidth={10}
              fill="none"
            />
            {/* Animated Active Ring */}
            <Circle
              cx={120}
              cy={120}
              r={radius}
              stroke={ringColor}
              strokeWidth={10}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 120 120)"
            />
          </Svg>

          {/* Center Digital Display */}
          <View className="absolute items-center justify-center">
            <View className="flex-row items-center gap-1.5 mb-1">
              {isFocusMode ? (
                <Brain size={15} color="#00E676" strokeWidth={2.4} />
              ) : (
                <Coffee size={15} color="#38BDF8" strokeWidth={2.4} />
              )}
              <Text
                className="text-[10px] font-mono uppercase tracking-widest font-bold"
                style={{ color: ringColor }}
              >
                {selectedMode.type === 'focus' ? 'FLOW SESSION' : 'REST & RECHARGE'}
              </Text>
            </View>

            <Text
              allowFontScaling={false}
              className="text-[44px] font-black text-white font-mono tracking-tighter"
            >
              {timeFormatted}
            </Text>

            {/* Cycle indicator dots */}
            <View className="flex-row items-center gap-1.5 mt-2">
              {[1, 2, 3, 4].map((dot) => {
                const filled = dot <= (cyclesCompleted % 4 || (cyclesCompleted > 0 ? 4 : 0));
                return (
                  <View
                    key={dot}
                    className={`w-2 h-2 rounded-full border ${
                      filled
                        ? 'bg-momentum-emerald border-momentum-emerald'
                        : 'bg-[#101C14] border-[#1C2C20]'
                    }`}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* Primary Timer Controls */}
        <View className="flex-row items-center justify-center gap-4 my-6">
          <TouchableOpacity
            onPress={handleResetTimer}
            activeOpacity={0.75}
            className="w-12 h-12 rounded-full bg-[#0E1611] border border-[#1C2C20] items-center justify-center"
          >
            <RotateCcw size={18} color="#8E9C92" strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleTimer}
            activeOpacity={0.85}
            className="px-8 py-3.5 rounded-full bg-momentum-emerald flex-row items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
          >
            {isRunning ? (
              <>
                <Pause size={18} color="#000000" strokeWidth={3} />
                <Text className="text-sm font-black text-black font-mono tracking-wider">
                  PAUSE
                </Text>
              </>
            ) : (
              <>
                <Play size={18} color="#000000" strokeWidth={3} style={{ marginLeft: 2 }} />
                <Text className="text-sm font-black text-black font-mono tracking-wider">
                  START FOCUS
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.75}
            className="w-12 h-12 rounded-full bg-[#0E1611] border border-[#1C2C20] items-center justify-center"
          >
            <SkipForward size={18} color="#8E9C92" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* Integrated Focus Audio Card */}
        <View
          className="p-4 rounded-2xl border mb-5"
          style={{
            backgroundColor: isAudioPlaying && !isMuted ? '#002210' : '#090F0C',
            borderColor: isAudioPlaying && !isMuted ? '#00E676' : '#18241B',
          }}
        >
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded-md bg-[#002B14] items-center justify-center border border-[#00E676]/40">
                <Music size={13} color="#00E676" strokeWidth={2.6} />
              </View>
              <Text className="text-xs font-bold text-white tracking-wide">
                Ambient Focus Audio
              </Text>
              {isAudioPlaying && !isMuted && (
                <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00381B] border border-[#00E676]/60 ml-1">
                  <LiveEqualizer isPlaying={true} />
                  <Text className="text-[9px] font-mono font-bold text-momentum-emerald tracking-wider">
                    LIVE
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShowMusicModal(true)}
              className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-[#002613] border border-[#00E676]/40"
            >
              <FolderOpen size={13} color="#00E676" />
              <Text className="text-[10.5px] font-mono font-bold text-momentum-emerald">
                CHANGE / ADD
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Audio Bar */}
          <View
            className="p-3 rounded-xl border flex-row items-center justify-between mt-1"
            style={{
              backgroundColor: isAudioPlaying && !isMuted ? '#00170A' : '#000000',
              borderColor: isAudioPlaying && !isMuted ? '#00E676' : '#18241B',
            }}
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              <View
                className="w-9 h-9 rounded-lg items-center justify-center border"
                style={{
                  backgroundColor: isAudioPlaying && !isMuted ? '#00381B' : '#121A15',
                  borderColor: isAudioPlaying && !isMuted ? '#00E676' : '#1C2C20',
                }}
              >
                {isAudioPlaying && !isMuted ? (
                  <LiveEqualizer isPlaying={true} />
                ) : (
                  <Music size={17} color="#8E9C92" strokeWidth={2.2} />
                )}
              </View>

              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className="text-xs font-bold"
                  style={{ color: isAudioPlaying && !isMuted ? '#00E676' : '#FFFFFF' }}
                >
                  {activeTrack?.title || 'Seven Floors Above the Street'}
                </Text>
                <Text numberOfLines={1} className="text-[10px] text-momentum-textSecondary mt-0.5">
                  {activeTrack?.category || 'Lofi Ambient'} &bull; Seamless Loop
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={toggleMute}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-1.5"
              >
                {isMuted ? (
                  <VolumeX size={17} color="#8E9C92" strokeWidth={2.2} />
                ) : (
                  <Volume2 size={17} color="#00E676" strokeWidth={2.2} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (isAudioPlaying) {
                    pauseAudio();
                  } else {
                    playAudio(activeTrack?.id);
                  }
                }}
                className={`w-8 h-8 rounded-full items-center justify-center border ${
                  isAudioPlaying
                    ? 'bg-momentum-emerald border-momentum-emerald'
                    : 'bg-[#141B16] border-[#223528]'
                }`}
              >
                {isAudioPlaying ? (
                  <Pause size={13} color="#000000" strokeWidth={2.8} />
                ) : (
                  <Play size={12} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Daily Focus Stats Strip */}
        <View className="flex-row items-center gap-3 mb-4">
          <View className="flex-1 p-3.5 rounded-2xl bg-[#090F0C] border border-[#18241B]">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Flame size={14} color="#00E676" />
              <Text className="text-[10.5px] font-mono uppercase tracking-wider text-momentum-textSecondary">
                Today Focus
              </Text>
            </View>
            <Text className="text-xl font-black text-white font-mono">
              {totalFocusMinutesToday} <Text className="text-xs text-momentum-textMuted font-sans">mins</Text>
            </Text>
          </View>

          <View className="flex-1 p-3.5 rounded-2xl bg-[#090F0C] border border-[#18241B]">
            <View className="flex-row items-center gap-1.5 mb-1">
              <CheckCircle2 size={14} color="#38BDF8" />
              <Text className="text-[10.5px] font-mono uppercase tracking-wider text-momentum-textSecondary">
                Cycles Done
              </Text>
            </View>
            <Text className="text-xl font-black text-white font-mono">
              {cyclesCompleted} <Text className="text-xs text-momentum-textMuted font-sans">sprints</Text>
            </Text>
          </View>
        </View>

        {/* Focus Mantra */}
        <View className="p-3.5 rounded-xl bg-[#050A07] border border-[#102015] items-center justify-center">
          <Text className="text-[11px] text-[#5E6D62] font-mono text-center">
            &ldquo;Discipline is choosing between what you want now and what you want most.&rdquo;
          </Text>
        </View>
      </ScrollView>

      {/* Audio Manager Modal for selecting or picking audio files */}
      <MusicManagerModal
        visible={showMusicModal}
        onClose={() => setShowMusicModal(false)}
      />
    </View>
  );
}
