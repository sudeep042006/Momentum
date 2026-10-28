import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Music,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  Coffee,
  Brain,
  FolderOpen,
  Layers,
} from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import MusicManagerModal from '../../components/MusicManagerModal';
import { useAudio } from '../../context/AudioContext';
import { useTimer } from '../../context/TimerContext';

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
  { id: 'focus50', label: '50m Deep Work', duration: 50 * 60, type: 'focus', title: 'Deep Work Block (50m)' },
  { id: 'focus25', label: '25m Pomodoro', duration: 25 * 60, type: 'focus', title: 'Focus Sprint (25m)' },
  { id: 'focus90', label: '90m Flow', duration: 90 * 60, type: 'focus', title: 'Ultradian Flow (90m)' },
  { id: 'break5', label: '5m Rest', duration: 5 * 60, type: 'break', title: 'Rest & Hydrate (5m)' },
];

const SESSION_PRESETS = [1, 2, 3, 4, 5];

export default function FocusPomodoroScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    activeTrack,
    isPlaying: isAudioPlaying,
    isMuted,
    play: playAudio,
    pause: pauseAudio,
    toggleMute,
    autoPlayWithPomodoro,
  } = useAudio();

  const {
    duration,
    breakDuration,
    totalSessions,
    currentSession,
    timeLeft,
    isRunning,
    isBreak,
    cyclesCompletedToday,
    totalFocusMinutesToday,
    startTimer,
    pauseTimer,
    resetTimer,
    skipBlock,
    setSessions,
    setDuration,
  } = useTimer();

  const [showMusicModal, setShowMusicModal] = useState(false);

  const handleSelectMode = (mode) => {
    if (mode.type === 'focus') {
      setDuration(mode.duration);
    }
  };

  const handleToggleTimer = async () => {
    if (!isRunning) {
      startTimer();
      if (autoPlayWithPomodoro && !isAudioPlaying) {
        try {
          await playAudio(activeTrack?.id);
        } catch {}
      }
    } else {
      pauseTimer();
    }
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;

  // SVG Progress circle calculations
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const currentTotalDuration = isBreak ? breakDuration : duration;
  const progressFraction = Math.max(0, Math.min(1, timeLeft / currentTotalDuration));
  const strokeDashoffset = circumference * (1 - progressFraction);

  const ringColor = isBreak ? '#38BDF8' : '#00E676';

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
        <View className="flex-row items-center justify-between p-1 rounded-2xl bg-[#0A100C] border border-[#16251A] mb-3">
          {MODES.map((mode) => {
            const isSelected = !isBreak && duration === mode.duration;
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
                  className={`text-[10.5px] font-bold ${
                    isSelected ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
                  }`}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Multi-Session Selector Pill Bar */}
        <View className="p-3 rounded-2xl bg-[#0A100C] border border-[#16251A] mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5">
              <Layers size={13} color="#00E676" />
              <Text className="text-[11px] font-mono uppercase tracking-wider text-momentum-textSecondary font-bold">
                Sessions Cycle
              </Text>
            </View>
            <Text className="text-[11px] font-mono font-bold text-momentum-emerald">
              Session {currentSession} of {totalSessions}
            </Text>
          </View>

          {/* Session Count Selector (1 to 5) */}
          <View className="flex-row items-center gap-2">
            {SESSION_PRESETS.map((count) => {
              const isSelected = totalSessions === count;
              return (
                <TouchableOpacity
                  key={count}
                  onPress={() => setSessions(count)}
                  activeOpacity={0.8}
                  className={`flex-1 py-1.5 rounded-xl items-center justify-center border ${
                    isSelected
                      ? 'bg-[#00381B] border-momentum-emerald'
                      : 'bg-[#000000] border-[#1C2C20]'
                  }`}
                >
                  <Text
                    className={`text-xs font-mono font-bold ${
                      isSelected ? 'text-momentum-emerald' : 'text-[#8E9C92]'
                    }`}
                  >
                    {count} {count === 1 ? 'Session' : 'Sessions'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Visual Session Pills Display */}
          <View className="flex-row items-center gap-2 mt-2.5">
            {Array.from({ length: totalSessions }).map((_, idx) => {
              const sessionIndex = idx + 1;
              const isDone = sessionIndex < currentSession;
              const isCurrent = sessionIndex === currentSession;

              return (
                <View
                  key={idx}
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{
                    backgroundColor: isDone
                      ? '#00E676'
                      : isCurrent
                      ? (isBreak ? '#38BDF8' : '#00E676')
                      : '#16251A',
                    opacity: isCurrent ? 1 : isDone ? 0.8 : 0.4,
                  }}
                />
              );
            })}
          </View>
        </View>

        {/* Circular Countdown Ring */}
        <View className="items-center justify-center my-2 relative">
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
              {!isBreak ? (
                <Brain size={15} color="#00E676" strokeWidth={2.4} />
              ) : (
                <Coffee size={15} color="#38BDF8" strokeWidth={2.4} />
              )}
              <Text
                className="text-[10px] font-mono uppercase tracking-widest font-bold"
                style={{ color: ringColor }}
              >
                {!isBreak
                  ? `SESSION ${currentSession}/${totalSessions} FLOW`
                  : `SESSION ${currentSession}/${totalSessions} REST`}
              </Text>
            </View>

            <Text
              allowFontScaling={false}
              className="text-[44px] font-black text-white font-mono tracking-tighter"
            >
              {timeFormatted}
            </Text>

            {/* Notification Bar Status Pill */}
            <View className="flex-row items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-[#00170A] border border-momentum-emerald/40">
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isRunning ? '#00E676' : '#8E9C92' }}
              />
              <Text className="text-[9.5px] font-mono text-momentum-emerald font-semibold">
                {isRunning ? 'LIVE IN NOTIFICATION BAR' : 'READY TO START'}
              </Text>
            </View>
          </View>
        </View>

        {/* Primary Timer Controls */}
        <View className="flex-row items-center justify-center gap-4 my-5">
          <TouchableOpacity
            onPress={resetTimer}
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
                  {!isBreak
                    ? `START SESSION ${currentSession}/${totalSessions}`
                    : `START REST BREAK`}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={skipBlock}
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
              {cyclesCompletedToday} <Text className="text-xs text-momentum-textMuted font-sans">sprints</Text>
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
