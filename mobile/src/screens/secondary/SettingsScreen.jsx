import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import AppHeader from '../../components/AppHeader';
import SyncStatusBar from '../../components/SyncStatusBar';
import MusicManagerModal from '../../components/MusicManagerModal';
import { PRIMARY_API_URL, FALLBACK_API_URL } from '../../api/apiClient';
import { syncQueue } from '../../storage/syncQueue';
import { localStorage } from '../../storage/localStorage';
import { useSync } from '../../context/SyncContext';
import { useAudio } from '../../context/AudioContext';
import { useTasks } from '../../context/TaskContext';
import { syncTasksToNotificationBar, cancelTasksNotification } from '../../services/systemNotificationService';
import { syncEngine } from '../../sync/syncEngine';
import {
  Server,
  Database,
  Trash2,
  RefreshCw,
  Music,
  Volume2,
  VolumeX,
  Timer,
  FolderOpen,
  ChevronRight,
  Play,
  Pause,
  Sliders,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function SettingsScreen({ navigation }) {
  const { isOnline, pendingCount } = useSync();
  const {
    showNavbarMusic,
    setShowNavbarMusic,
    autoPlayWithPomodoro,
    setAutoPlayWithPomodoro,
    activeTrack,
    isPlaying,
    isMuted,
    togglePlay,
    toggleMute,
    allTracks,
    customTracks,
  } = useAudio();

  const { tasks } = useTasks();
  const [clearing, setClearing] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showTasksInNotif, setShowTasksInNotif] = useState(true);

  useEffect(() => {
    localStorage.getItem('momentum_notif_tasks_enabled').then((val) => {
      if (val !== null) setShowTasksInNotif(val === 'true');
    });
  }, []);

  const handleToggleTasksNotif = async (val) => {
    setShowTasksInNotif(val);
    await localStorage.setItem('momentum_notif_tasks_enabled', String(val));
    if (val) {
      syncTasksToNotificationBar(tasks);
    } else {
      cancelTasksNotification();
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Local Cache',
      'This will clear cached dashboard data. Authentication and pending sync queue will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              // Clear cached keys
              await localStorage.removeItem('cached_heatmap');
              await localStorage.removeItem('cached_stats');
              await localStorage.removeItem('cached_schedule');
              await localStorage.removeItem('cached_journals');
              Alert.alert('Done', 'Local cache cleared.');
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while device is offline.');
      return;
    }
    await syncEngine.drainQueue();
    Alert.alert('Sync Finished', 'Pending outbox queue has been processed.');
  };

  return (
    <View className="flex-1 bg-momentum-bg">
      <AppHeader navigation={navigation} title="Settings & Diagnostics" />
      <SyncStatusBar />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* FOCUS MODE & AMBIENT MUSIC */}
        <Text className="text-xs uppercase tracking-wider font-semibold text-momentum-emerald mb-2 font-mono">
          Focus Mode &amp; Soundtracks
        </Text>
        <View className="p-4 mb-5 rounded-2xl bg-momentum-card border border-[#18241B]">
          {/* Active Soundscape Card */}
          <View className="p-3.5 rounded-xl bg-[#001D0E] border border-momentum-emerald/40 mb-3.5">
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center gap-2">
                <Music size={15} color="#00E676" strokeWidth={2.4} />
                <Text className="text-[11px] font-mono font-bold text-momentum-emerald uppercase tracking-wider">
                  Active Focus Audio
                </Text>
              </View>
              {isPlaying && (
                <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-momentum-emerald">
                  <View className="w-1.5 h-1.5 rounded-full bg-momentum-emerald" />
                  <Text className="text-[9px] font-mono text-momentum-emerald font-bold">PLAYING</Text>
                </View>
              )}
            </View>

            <Text numberOfLines={1} className="text-sm font-bold text-white mb-0.5">
              {activeTrack?.title || 'Seven Floors Above'}
            </Text>
            <Text numberOfLines={1} className="text-[11px] text-momentum-textSecondary mb-3">
              {activeTrack?.category || 'Lofi Ambient'} &bull; {activeTrack?.author || 'Momentum'}
            </Text>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={togglePlay}
                activeOpacity={0.8}
                className="flex-1 py-2 px-3 rounded-lg bg-momentum-emerald flex-row items-center justify-center gap-1.5"
              >
                {isPlaying ? (
                  <>
                    <Pause size={14} color="#000000" strokeWidth={2.8} />
                    <Text className="text-xs font-bold text-black font-mono">PAUSE</Text>
                  </>
                ) : (
                  <>
                    <Play size={14} color="#000000" strokeWidth={2.8} style={{ marginLeft: 2 }} />
                    <Text className="text-xs font-bold text-black font-mono">PLAY TRACK</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleMute}
                activeOpacity={0.8}
                className="py-2 px-3 rounded-lg bg-[#0E1611] border border-[#1C2C20] flex-row items-center gap-1.5"
              >
                {isMuted ? (
                  <>
                    <VolumeX size={15} color="#8E9C92" strokeWidth={2.2} />
                    <Text className="text-[11px] font-mono font-bold text-momentum-textSecondary">UNMUTE</Text>
                  </>
                ) : (
                  <>
                    <Volume2 size={15} color="#00E676" strokeWidth={2.2} />
                    <Text className="text-[11px] font-mono font-bold text-momentum-emerald">MUTE</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Button: Open Audio Library (+ Add Music from Device) */}
          <TouchableOpacity
            onPress={() => setShowMusicModal(true)}
            activeOpacity={0.8}
            className="flex-row items-center justify-between p-3 rounded-xl bg-[#0A0F0C] border border-[#1C2C20] mb-3"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-[#142318] items-center justify-center border border-[#1E3A25]">
                <FolderOpen size={16} color="#00E676" strokeWidth={2.2} />
              </View>
              <View>
                <Text className="text-xs font-bold text-white">Audio Library &amp; Custom Music</Text>
                <Text className="text-[10.5px] text-momentum-textSecondary">
                  {allTracks.length} tracks available ({customTracks.length} custom from device)
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={colors.text.muted} />
          </TouchableOpacity>

          {/* Button: Launch Pomodoro Focus Mode */}
          <TouchableOpacity
            onPress={() => navigation?.navigate?.('FocusPomodoro')}
            activeOpacity={0.8}
            className="flex-row items-center justify-between p-3 rounded-xl bg-[#0A0F0C] border border-[#1C2C20] mb-3"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-[#002A14] items-center justify-center border border-momentum-emerald/40">
                <Timer size={16} color="#00E676" strokeWidth={2.4} />
              </View>
              <View>
                <Text className="text-xs font-bold text-white">Open Pomodoro Focus Mode</Text>
                <Text className="text-[10.5px] text-momentum-textSecondary">
                  Timer with synchronized ambient focus music
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={colors.text.muted} />
          </TouchableOpacity>

          {/* Toggle: Show Music Icon on Navbar */}
          <View className="flex-row items-center justify-between pt-3 pb-1 border-t border-[#18241B]">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-white">Show Music in Navigation Bar</Text>
              <Text className="text-[10.5px] text-momentum-textSecondary mt-0.5">
                Displays quick mute/unmute audio pill on top navbar across screens
              </Text>
            </View>
            <Switch
              value={showNavbarMusic}
              onValueChange={setShowNavbarMusic}
              trackColor={{ false: '#18241B', true: '#00E676' }}
              thumbColor={showNavbarMusic ? '#000000' : '#8E9C92'}
            />
          </View>

          {/* Toggle: Auto-play with Pomodoro */}
          <View className="flex-row items-center justify-between pt-3 border-t border-[#18241B] mt-2">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-white">Auto-Play with Pomodoro</Text>
              <Text className="text-[10.5px] text-momentum-textSecondary mt-0.5">
                Automatically start music when Pomodoro session begins
              </Text>
            </View>
            <Switch
              value={autoPlayWithPomodoro}
              onValueChange={setAutoPlayWithPomodoro}
              trackColor={{ false: '#18241B', true: '#00E676' }}
              thumbColor={autoPlayWithPomodoro ? '#000000' : '#8E9C92'}
            />
          </View>

          {/* Toggle: Show Tasks in Notification Bar */}
          <View className="flex-row items-center justify-between pt-3 border-t border-[#18241B] mt-2">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-white">Show Tasks in Notification Bar</Text>
              <Text className="text-[10.5px] text-momentum-textSecondary mt-0.5">
                Displays today's active checklist in your phone's notification bar
              </Text>
            </View>
            <Switch
              value={showTasksInNotif}
              onValueChange={handleToggleTasksNotif}
              trackColor={{ false: '#18241B', true: '#00E676' }}
              thumbColor={showTasksInNotif ? '#000000' : '#8E9C92'}
            />
          </View>
        </View>

        <Text className="text-xs uppercase tracking-wider font-semibold text-momentum-textSecondary mb-2 font-mono">
          Backend &amp; Network
        </Text>
        <View className="p-4 mb-4 rounded-xl bg-momentum-card border border-momentum-border">
          <View className="flex-row items-center gap-2 mb-2">
            <Server size={15} color={colors.emerald.bright} />
            <Text className="text-xs font-bold text-momentum-textPrimary">
              Active API Endpoints
            </Text>
          </View>
          <Text className="text-[11px] font-mono text-momentum-textSecondary mb-1">
            Primary: {PRIMARY_API_URL}
          </Text>
          <Text className="text-[11px] font-mono text-momentum-textMuted mb-2">
            Fallback: {FALLBACK_API_URL}
          </Text>
          <View className="flex-row items-center gap-1.5 pt-2 border-t border-momentum-border">
            <View
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-momentum-emerald' : 'bg-red-500'
              }`}
            />
            <Text className="text-xs font-semibold text-momentum-textPrimary">
              Status: {isOnline ? 'Connected' : 'Offline Mode'}
            </Text>
          </View>
        </View>

        <Text className="text-xs uppercase tracking-wider font-semibold text-momentum-textSecondary mb-2">
          Offline Storage & Sync
        </Text>
        <View className="p-4 mb-6 rounded-xl bg-momentum-card border border-momentum-border">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Database size={15} color={colors.emerald.bright} />
              <Text className="text-xs font-bold text-momentum-textPrimary">
                Pending Outbox Queue
              </Text>
            </View>
            <Text className="text-xs font-mono font-bold text-momentum-emerald">
              {pendingCount} item{pendingCount === 1 ? '' : 's'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleForceSync}
            disabled={pendingCount === 0 || !isOnline}
            className={`py-2.5 px-3 rounded-lg border flex-row items-center justify-center gap-2 mb-3 ${
              pendingCount > 0 && isOnline
                ? 'bg-momentum-surface border-momentum-emerald'
                : 'bg-momentum-surface/40 border-momentum-border opacity-50'
            }`}
          >
            <RefreshCw size={13} color={colors.emerald.bright} />
            <Text className="text-xs font-semibold text-momentum-emerald">
              Force Sync Outbox
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearCache}
            disabled={clearing}
            className="py-2.5 px-3 rounded-lg bg-momentum-surface border border-red-950 flex-row items-center justify-center gap-2"
          >
            <Trash2 size={13} color="#ef4444" />
            <Text className="text-xs font-semibold text-red-400">
              Clear Cache
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mt-6">
          <Text className="text-xs font-mono text-momentum-textMuted">
            Mommenttum Mobile v1.0.0
          </Text>
          <Text className="text-[10px] text-momentum-textDisabled mt-1">
            Developer Productivity Architecture
          </Text>
        </View>
      </ScrollView>

      <MusicManagerModal
        visible={showMusicModal}
        onClose={() => setShowMusicModal(false)}
      />
    </View>
  );
}
