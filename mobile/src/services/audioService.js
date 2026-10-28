import { NativeModules, Platform, DeviceEventEmitter } from 'react-native';
import { localStorage } from '../storage/localStorage';

const { FocusAudioModule } = NativeModules;

export const PREINSTALLED_TRACKS = [
  {
    id: 'raw:seven_floors',
    title: 'Seven Floors Above the Street',
    category: 'Lofi Ambient',
    author: 'Momentum Soundscape',
    type: 'preinstalled',
    durationHint: 'Continuous Loop',
    description: 'Urban twilight lofi groove for sustained deep focus',
    icon: 'disc',
  },
  {
    id: 'raw:cold_coffee',
    title: 'Cold Coffee & Soft Light',
    category: 'Chill Lofi',
    author: 'Momentum Soundscape',
    type: 'preinstalled',
    durationHint: 'Continuous Loop',
    description: 'Warm, mellow morning keys to get into uninterrupted flow',
    icon: 'coffee',
  },
  {
    id: 'raw:snow_glass',
    title: 'Snow Against the Glass',
    category: 'Atmospheric Focus',
    author: 'Momentum Soundscape',
    type: 'preinstalled',
    durationHint: 'Continuous Loop',
    description: 'Cinematic ambient winter stillness for quiet productivity',
    icon: 'moon',
  },
  {
    id: 'raw:deep_theta',
    title: 'Deep Theta Waves',
    category: '432Hz Binaural',
    author: 'Neuro Flow Lab',
    type: 'preinstalled',
    durationHint: 'Continuous Loop',
    description: 'Binaural drone for profound intellectual problem-solving',
    icon: 'activity',
  },
];

const STORAGE_KEY_CUSTOM_TRACKS = 'momentum_custom_tracks';
const STORAGE_KEY_SETTINGS = 'momentum_audio_settings';

const DEFAULT_SETTINGS = {
  showNavbarMusic: false,       // Default off until user turns it on in Settings
  volume: 0.85,
  isMuted: false,
  activeTrackId: 'raw:seven_floors',
  autoPlayWithPomodoro: true,
  looping: true,
};

export async function getStoredAudioSettings() {
  try {
    const raw = await localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveAudioSettings(settings) {
  try {
    const current = await getStoredAudioSettings();
    const updated = { ...current, ...settings };
    await localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export async function getCustomTracks() {
  try {
    // 1. Check native filesystem first for Android files
    let nativeFiles = [];
    if (FocusAudioModule && typeof FocusAudioModule.listCustomAudio === 'function') {
      try {
        nativeFiles = await FocusAudioModule.listCustomAudio();
      } catch (e) {
        nativeFiles = [];
      }
    }

    // 2. Merge with stored metadata (names, addedAt timestamps)
    const raw = await localStorage.getItem(STORAGE_KEY_CUSTOM_TRACKS);
    const stored = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];

    const merged = [];
    const seenUris = new Set();

    // Prioritize stored metadata with file existence check
    for (const item of stored) {
      if (item && item.uri && !seenUris.has(item.uri)) {
        seenUris.add(item.uri);
        merged.push({
          id: item.uri,
          uri: item.uri,
          title: item.title || item.name || 'Custom Track',
          category: 'My Audio',
          author: 'Local Device',
          type: 'custom',
          size: item.size || 0,
          addedAt: item.addedAt || Date.now(),
          icon: 'music',
        });
      }
    }

    // Add any native file that wasn't in metadata
    for (const nf of nativeFiles) {
      if (nf && nf.uri && !seenUris.has(nf.uri)) {
        seenUris.add(nf.uri);
        merged.push({
          id: nf.uri,
          uri: nf.uri,
          title: nf.name || 'Custom Track',
          category: 'My Audio',
          author: 'Local Device',
          type: 'custom',
          size: nf.size || 0,
          addedAt: Date.now(),
          icon: 'music',
        });
      }
    }

    return merged;
  } catch (err) {
    console.warn('getCustomTracks error:', err);
    return [];
  }
}

export async function saveCustomTracks(tracks) {
  try {
    await localStorage.setItem(STORAGE_KEY_CUSTOM_TRACKS, JSON.stringify(tracks));
  } catch (err) {
    console.warn('saveCustomTracks error:', err);
  }
}

export async function pickAndAddAudioFile() {
  if (Platform.OS !== 'android' || !FocusAudioModule) {
    throw new Error('Audio picking is supported natively on Android.');
  }

  const result = await FocusAudioModule.pickAudioFromDevice();
  if (!result || !result.uri) {
    throw new Error('No audio file was selected.');
  }

  const newTrack = {
    id: result.uri,
    uri: result.uri,
    title: result.name || 'Custom Audio',
    category: 'My Audio',
    author: 'Local Device',
    type: 'custom',
    size: result.size || 0,
    addedAt: Date.now(),
    icon: 'music',
  };

  const current = await getCustomTracks();
  const updated = [newTrack, ...current.filter((t) => t.uri !== newTrack.uri)];
  await saveCustomTracks(updated);

  return newTrack;
}

export async function deleteCustomTrack(trackUri) {
  if (!trackUri) return;

  if (FocusAudioModule && typeof FocusAudioModule.deleteCustomAudio === 'function') {
    try {
      await FocusAudioModule.deleteCustomAudio(trackUri);
    } catch (e) {
      // Non-blocking
    }
  }

  const current = await getCustomTracks();
  const updated = current.filter((t) => t.uri !== trackUri && t.id !== trackUri);
  await saveCustomTracks(updated);
}

// ── PLAYBACK BRIDGE ──

export async function playTrack(trackId, isLooping = true, title = '', category = '') {
  if (!trackId) return;

  if (Platform.OS === 'android' && FocusAudioModule) {
    try {
      let res;
      if (typeof FocusAudioModule.playTrackWithMetadata === 'function' && title) {
        res = await FocusAudioModule.playTrackWithMetadata(
          trackId,
          isLooping,
          title,
          category || 'Momentum Focus'
        );
      } else {
        res = await FocusAudioModule.playTrack(trackId, isLooping);
      }
      await saveAudioSettings({ activeTrackId: trackId });
      return res;
    } catch (err) {
      console.warn('FocusAudioModule.playTrack error:', err);
      throw err;
    }
  }
  return { success: false, reason: 'Unsupported platform' };
}

export async function pauseTrack() {
  if (Platform.OS === 'android' && FocusAudioModule) {
    try {
      return await FocusAudioModule.pauseTrack();
    } catch (err) {
      console.warn('FocusAudioModule.pauseTrack error:', err);
    }
  }
  return false;
}

export async function resumeTrack() {
  if (Platform.OS === 'android' && FocusAudioModule) {
    try {
      return await FocusAudioModule.resumeTrack();
    } catch (err) {
      console.warn('FocusAudioModule.resumeTrack error:', err);
    }
  }
  return false;
}

export async function stopTrack() {
  if (Platform.OS === 'android' && FocusAudioModule) {
    try {
      return await FocusAudioModule.stopTrack();
    } catch (err) {
      console.warn('FocusAudioModule.stopTrack error:', err);
    }
  }
  return false;
}

export async function setVolume(vol) {
  const clamped = Math.max(0, Math.min(1, Number(vol) || 0.85));
  await saveAudioSettings({ volume: clamped });

  if (Platform.OS === 'android' && FocusAudioModule) {
    try {
      return await FocusAudioModule.setVolume(clamped);
    } catch (err) {
      console.warn('FocusAudioModule.setVolume error:', err);
    }
  }
  return clamped;
}

export async function setMuted(muted) {
  const isMuted = Boolean(muted);
  await saveAudioSettings({ isMuted });

  if (Platform.OS === 'android' && FocusAudioModule) {
    try {
      return await FocusAudioModule.setMuted(isMuted);
    } catch (err) {
      console.warn('FocusAudioModule.setMuted error:', err);
    }
  }
  return isMuted;
}

export async function toggleMute() {
  if (Platform.OS === 'android' && FocusAudioModule) {
    try {
      const isMuted = await FocusAudioModule.toggleMute();
      await saveAudioSettings({ isMuted });
      return isMuted;
    } catch (err) {
      console.warn('FocusAudioModule.toggleMute error:', err);
    }
  }
  return false;
}

export async function getPlaybackState() {
  if (Platform.OS === 'android' && FocusAudioModule) {
    try {
      return await FocusAudioModule.getPlaybackState();
    } catch (err) {
      console.warn('FocusAudioModule.getPlaybackState error:', err);
    }
  }
  return {
    isPlaying: false,
    isMuted: false,
    volume: 0.85,
    currentTrack: null,
    isLooping: true,
  };
}

export function addAudioStateListener(callback) {
  if (!callback || typeof callback !== 'function') return { remove: () => {} };
  return DeviceEventEmitter.addListener('onAudioStateChanged', callback);
}
