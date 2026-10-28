import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  Plus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Trash2,
  Check,
  Disc,
  Activity,
  CloudRain,
  Moon,
  Music,
  FolderOpen,
  Coffee,
} from 'lucide-react-native';
import { useAudio } from '../context/AudioContext';
import { colors } from '../theme/colors';

export default function MusicManagerModal({ visible, onClose }) {
  const {
    allTracks,
    preinstalledTracks,
    customTracks,
    activeTrackId,
    isPlaying,
    isMuted,
    volume,
    play,
    pause,
    stop,
    toggleMute,
    setVolume,
    pickAudio,
    deleteCustomTrack,
  } = useAudio();

  const [isPicking, setIsPicking] = useState(false);

  const handlePickAudio = async () => {
    setIsPicking(true);
    try {
      const added = await pickAudio();
      if (added) {
        Alert.alert('Track Added', `"${added.title}" has been saved to your Momentum music library.`);
      }
    } catch (err) {
      if (err?.message !== 'Audio picker was cancelled' && !err?.message?.includes('CANCELLED')) {
        Alert.alert('Could Not Add Audio', err?.message || 'Failed to select audio file.');
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handleDelete = (track) => {
    Alert.alert(
      'Remove Track',
      `Remove "${track.title}" from your Momentum custom library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteCustomTrack(track.id),
        },
      ]
    );
  };

  const getTrackIcon = (iconName, isSelected) => {
    const iconColor = isSelected ? colors.emerald.bright : '#8E9C92';
    switch (iconName) {
      case 'disc':
        return <Disc size={18} color={iconColor} strokeWidth={2.2} />;
      case 'activity':
        return <Activity size={18} color={iconColor} strokeWidth={2.2} />;
      case 'cloud-rain':
        return <CloudRain size={18} color={iconColor} strokeWidth={2.2} />;
      case 'moon':
        return <Moon size={18} color={iconColor} strokeWidth={2.2} />;
      case 'coffee':
        return <Coffee size={18} color={iconColor} strokeWidth={2.2} />;
      default:
        return <Music size={18} color={iconColor} strokeWidth={2.2} />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/85 justify-end">
        <View className="bg-[#000000] border-t border-[#1C2C20] rounded-t-3xl max-h-[88%] flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-[#18241B]">
            <View className="flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-lg bg-[#002A14] border border-momentum-emerald/40 items-center justify-center">
                <Music size={18} color="#00E676" strokeWidth={2.5} />
              </View>
              <View>
                <Text className="text-base font-bold text-white tracking-tight">
                  Focus Soundtracks
                </Text>
                <Text className="text-[11px] font-mono text-momentum-textSecondary">
                  Ambient Audio &amp; Custom Music
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="p-1.5 rounded-full bg-[#121A15] border border-[#1C2C20]"
            >
              <X size={18} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
            {/* Add Custom Audio Button */}
            <TouchableOpacity
              onPress={handlePickAudio}
              disabled={isPicking}
              activeOpacity={0.8}
              className="flex-row items-center justify-between p-3.5 rounded-2xl bg-[#001D0E] border border-momentum-emerald/50 mb-5"
            >
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View className="w-10 h-10 rounded-xl bg-momentum-emerald items-center justify-center">
                  {isPicking ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <FolderOpen size={20} color="#000000" strokeWidth={2.4} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white tracking-wide">
                    {isPicking ? 'Accessing Device Storage...' : 'Add Music from Device / Folder'}
                  </Text>
                  <Text className="text-[10.5px] text-momentum-textSecondary mt-0.5">
                    Import your own .mp3, .wav, or .ogg focus tracks
                  </Text>
                </View>
              </View>

              <View className="px-2.5 py-1.5 rounded-lg bg-[#00381B] border border-momentum-emerald">
                <Text className="text-[10px] font-mono font-bold text-momentum-emerald">
                  + IMPORT
                </Text>
              </View>
            </TouchableOpacity>

            {/* Preinstalled Section */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[11px] font-mono uppercase tracking-wider font-bold text-momentum-emerald">
                  Built-in Soundscapes ({preinstalledTracks.length})
                </Text>
                <Text className="text-[10px] font-mono text-momentum-textMuted">
                  Offline · Seamless Loop
                </Text>
              </View>

              {preinstalledTracks.map((track) => {
                const isSelected = activeTrackId === track.id;
                const isCurrentPlaying = isSelected && isPlaying;

                return (
                  <TouchableOpacity
                    key={track.id}
                    onPress={() => {
                      if (isSelected) {
                        if (isPlaying) pause();
                        else play(track.id);
                      } else {
                        play(track.id);
                      }
                    }}
                    activeOpacity={0.75}
                    className={`flex-row items-center justify-between p-3 rounded-xl mb-2 border ${
                      isCurrentPlaying
                        ? 'bg-[#002D16] border-momentum-emerald shadow-md shadow-momentum-emerald/20'
                        : isSelected
                        ? 'bg-[#001D0F] border-momentum-emerald/60'
                        : 'bg-[#0A0F0C] border-[#18241B]'
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1 mr-2">
                      <View
                        className={`w-9 h-9 rounded-lg items-center justify-center border ${
                          isCurrentPlaying
                            ? 'bg-[#004723] border-momentum-emerald'
                            : isSelected
                            ? 'bg-[#002B15] border-momentum-emerald/70'
                            : 'bg-[#121A15] border-[#1C2C20]'
                        }`}
                      >
                        {getTrackIcon(track.icon, isSelected)}
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5">
                          <Text
                            numberOfLines={1}
                            className={`text-xs font-bold ${
                              isSelected ? 'text-momentum-emerald' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </Text>
                          {isCurrentPlaying ? (
                            <View className="px-1.5 py-0.2 rounded bg-momentum-emerald/20 border border-momentum-emerald/60">
                              <Text className="text-[8px] font-mono font-bold text-momentum-emerald">
                                PLAYING
                              </Text>
                            </View>
                          ) : isSelected ? (
                            <View className="w-1.5 h-1.5 rounded-full bg-momentum-emerald" />
                          ) : null}
                        </View>
                        <Text
                          numberOfLines={1}
                          className="text-[10.5px] text-momentum-textSecondary mt-0.5"
                        >
                          {track.category} &bull; {track.description}
                        </Text>
                      </View>
                    </View>

                    {/* Play/Pause Button */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        if (isSelected && isPlaying) {
                          pause();
                        } else {
                          play(track.id);
                        }
                      }}
                      className={`w-8 h-8 rounded-full items-center justify-center border ${
                        isCurrentPlaying
                          ? 'bg-momentum-emerald border-momentum-emerald'
                          : 'bg-[#141B16] border-[#223528]'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <Pause size={14} color="#000000" strokeWidth={2.8} />
                      ) : (
                        <Play size={13} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 2 }} />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Tracks Section */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[11px] font-mono uppercase tracking-wider font-bold text-white">
                  My Custom Tracks ({customTracks.length})
                </Text>
                {customTracks.length > 0 && (
                  <Text className="text-[10px] font-mono text-momentum-textMuted">
                    Stored on Device
                  </Text>
                )}
              </View>

              {customTracks.length === 0 ? (
                <View className="p-4 rounded-xl bg-[#080D0A] border border-dashed border-[#1C2C20] items-center justify-center">
                  <Text className="text-xs font-semibold text-momentum-textSecondary text-center">
                    No custom tracks added yet
                  </Text>
                  <Text className="text-[10.5px] text-momentum-textMuted text-center mt-1">
                    Tap &quot;Add Music from Device / Folder&quot; above to import your own focus playlists.
                  </Text>
                </View>
              ) : (
                customTracks.map((track) => {
                  const isSelected = activeTrackId === track.id;
                  const isCurrentPlaying = isSelected && isPlaying;

                  return (
                    <TouchableOpacity
                      key={track.id}
                      onPress={() => {
                        if (isSelected) {
                          if (isPlaying) pause();
                          else play(track.id);
                        } else {
                          play(track.id);
                        }
                      }}
                      activeOpacity={0.75}
                      className={`flex-row items-center justify-between p-3 rounded-xl mb-2 border ${
                        isCurrentPlaying
                          ? 'bg-[#002D16] border-momentum-emerald shadow-md shadow-momentum-emerald/20'
                          : isSelected
                          ? 'bg-[#001D0F] border-momentum-emerald/60'
                          : 'bg-[#0A0F0C] border-[#18241B]'
                      }`}
                    >
                      <View className="flex-row items-center gap-3 flex-1 mr-2">
                        <View
                          className={`w-9 h-9 rounded-lg items-center justify-center border ${
                            isCurrentPlaying
                              ? 'bg-[#004723] border-momentum-emerald'
                              : isSelected
                              ? 'bg-[#002B15] border-momentum-emerald/70'
                              : 'bg-[#121A15] border-[#1C2C20]'
                          }`}
                        >
                          <Music
                            size={18}
                            color={isSelected ? colors.emerald.bright : '#8E9C92'}
                            strokeWidth={2.2}
                          />
                        </View>

                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text
                              numberOfLines={1}
                              className={`text-xs font-bold ${
                                isSelected ? 'text-momentum-emerald' : 'text-white'
                              }`}
                            >
                              {track.title}
                            </Text>
                            {isCurrentPlaying && (
                              <View className="px-1.5 py-0.2 rounded bg-momentum-emerald/20 border border-momentum-emerald/60">
                                <Text className="text-[8px] font-mono font-bold text-momentum-emerald">
                                  PLAYING
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            numberOfLines={1}
                            className="text-[10.5px] font-mono text-momentum-textSecondary mt-0.5"
                          >
                            Custom File &bull; {(track.size / (1024 * 1024)).toFixed(1)} MB
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            if (isSelected && isPlaying) {
                              pause();
                            } else {
                              play(track.id);
                            }
                          }}
                          className={`w-8 h-8 rounded-full items-center justify-center border ${
                            isCurrentPlaying
                              ? 'bg-momentum-emerald border-momentum-emerald'
                              : 'bg-[#141B16] border-[#223528]'
                          }`}
                        >
                          {isCurrentPlaying ? (
                            <Pause size={14} color="#000000" strokeWidth={2.8} />
                          ) : (
                            <Play size={13} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 2 }} />
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(track);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          className="p-1.5"
                        >
                          <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Quick Controls Bottom Strip */}
            <View className="p-3.5 rounded-2xl bg-[#0A0F0C] border border-[#18241B] mb-8">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  {isMuted ? (
                    <VolumeX size={16} color="#8E9C92" />
                  ) : (
                    <Volume2 size={16} color="#00E676" />
                  )}
                  <Text className="text-xs font-bold text-white">Focus Audio Volume</Text>
                </View>
                <TouchableOpacity
                  onPress={toggleMute}
                  className="px-2.5 py-1 rounded-md bg-[#121A15] border border-[#1C2C20]"
                >
                  <Text className="text-[10px] font-mono font-bold text-momentum-emerald">
                    {isMuted ? 'UNMUTE' : 'MUTE'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Volume Preset Chips */}
              <View className="flex-row items-center gap-2 justify-between">
                {[0.25, 0.5, 0.75, 1.0].map((v) => {
                  const isActive = Math.abs(volume - v) < 0.12 && !isMuted;
                  return (
                    <TouchableOpacity
                      key={v}
                      onPress={() => setVolume(v)}
                      className={`flex-1 py-1.5 rounded-lg items-center border ${
                        isActive
                          ? 'bg-[#002A14] border-momentum-emerald'
                          : 'bg-[#121A15] border-[#1C2C20]'
                      }`}
                    >
                      <Text
                        className={`text-[10.5px] font-mono font-bold ${
                          isActive ? 'text-momentum-emerald' : 'text-momentum-textSecondary'
                        }`}
                      >
                        {Math.round(v * 100)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
