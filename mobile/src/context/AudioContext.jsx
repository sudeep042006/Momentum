import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  PREINSTALLED_TRACKS,
  getStoredAudioSettings,
  saveAudioSettings,
  getCustomTracks,
  pickAndAddAudioFile,
  deleteCustomTrack,
  playTrack,
  pauseTrack,
  resumeTrack,
  stopTrack,
  setVolume,
  setMuted,
  toggleMute,
  getPlaybackState,
  addAudioStateListener,
} from '../services/audioService';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [volume, setVolumeState] = useState(0.85);
  const [activeTrackId, setActiveTrackId] = useState('raw:seven_floors');
  const [customTracks, setCustomTracks] = useState([]);
  const [showNavbarMusic, setShowNavbarMusic] = useState(false);
  const [autoPlayWithPomodoro, setAutoPlayWithPomodoro] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial settings and custom tracks
  const refreshAudioData = useCallback(async () => {
    try {
      const [settings, custom] = await Promise.all([
        getStoredAudioSettings(),
        getCustomTracks(),
      ]);

      setShowNavbarMusic(Boolean(settings.showNavbarMusic));
      setVolumeState(settings.volume ?? 0.85);
      setIsMutedState(Boolean(settings.isMuted));
      setActiveTrackId(settings.activeTrackId || 'raw:seven_floors');
      setAutoPlayWithPomodoro(settings.autoPlayWithPomodoro ?? true);
      setIsLooping(settings.looping ?? true);
      setCustomTracks(custom || []);

      // Check native player state
      const state = await getPlaybackState();
      if (state) {
        setIsPlaying(Boolean(state.isPlaying));
        if (state.currentTrack) {
          setActiveTrackId(state.currentTrack);
        }
      }
    } catch (e) {
      console.warn('refreshAudioData error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAudioData();

    // Listen to native MediaPlayer state change events
    const sub = addAudioStateListener((data) => {
      if (!data) return;
      if (typeof data.isPlaying === 'boolean') setIsPlaying(data.isPlaying);
      if (typeof data.isMuted === 'boolean') setIsMutedState(data.isMuted);
      if (typeof data.volume === 'number') setVolumeState(data.volume);
      if (data.currentTrack) setActiveTrackId(data.currentTrack);
      if (typeof data.isLooping === 'boolean') setIsLooping(data.isLooping);
    });

    return () => {
      sub.remove();
    };
  }, [refreshAudioData]);

  // Combine preinstalled + custom tracks
  const allTracks = useMemo(() => {
    return [...PREINSTALLED_TRACKS, ...customTracks];
  }, [customTracks]);

  const activeTrack = useMemo(() => {
    return allTracks.find((t) => t.id === activeTrackId) || PREINSTALLED_TRACKS[0];
  }, [allTracks, activeTrackId]);

  // Play a specific track
  const handlePlay = useCallback(
    async (trackId = activeTrackId, loop = isLooping) => {
      try {
        const idToPlay = trackId || activeTrackId;
        const targetTrack = allTracks.find((t) => t.id === idToPlay || t.uri === idToPlay);
        const title = targetTrack?.title || 'Focus Soundtrack';
        const category = targetTrack?.category || 'Momentum Focus';
        await playTrack(idToPlay, loop, title, category);
        setActiveTrackId(idToPlay);
        setIsPlaying(true);
        await saveAudioSettings({ activeTrackId: idToPlay, looping: loop });
      } catch (err) {
        console.warn('handlePlay error:', err);
      }
    },
    [activeTrackId, isLooping, allTracks]
  );

  // Pause
  const handlePause = useCallback(async () => {
    try {
      await pauseTrack();
      setIsPlaying(false);
    } catch (err) {
      console.warn('handlePause error:', err);
    }
  }, []);

  // Resume or start
  const handleTogglePlay = useCallback(async () => {
    if (isPlaying) {
      await handlePause();
    } else {
      await handlePlay(activeTrackId);
    }
  }, [isPlaying, handlePause, handlePlay, activeTrackId]);

  // Stop
  const handleStop = useCallback(async () => {
    try {
      await stopTrack();
      setIsPlaying(false);
    } catch (err) {
      console.warn('handleStop error:', err);
    }
  }, []);

  // Mute / Unmute
  const handleToggleMute = useCallback(async () => {
    try {
      const nextMuted = !isMuted;
      await setMuted(nextMuted);
      setIsMutedState(nextMuted);
    } catch (err) {
      console.warn('handleToggleMute error:', err);
    }
  }, [isMuted]);

  // Set volume
  const handleSetVolume = useCallback(async (newVol) => {
    try {
      const vol = await setVolume(newVol);
      setVolumeState(vol);
    } catch (err) {
      console.warn('handleSetVolume error:', err);
    }
  }, []);

  // Pick audio file from device
  const handlePickAudio = useCallback(async () => {
    try {
      const added = await pickAndAddAudioFile();
      const updated = await getCustomTracks();
      setCustomTracks(updated);
      return added;
    } catch (err) {
      throw err;
    }
  }, []);

  // Delete custom track
  const handleDeleteCustomTrack = useCallback(
    async (trackUri) => {
      try {
        if (activeTrackId === trackUri) {
          await handleStop();
          setActiveTrackId('raw:seven_floors');
        }
        await deleteCustomTrack(trackUri);
        const updated = await getCustomTracks();
        setCustomTracks(updated);
      } catch (err) {
        console.warn('handleDeleteCustomTrack error:', err);
      }
    },
    [activeTrackId, handleStop]
  );

  // Toggle Navbar Music Control visibility in Settings
  const handleSetShowNavbarMusic = useCallback(async (enabled) => {
    setShowNavbarMusic(enabled);
    await saveAudioSettings({ showNavbarMusic: enabled });
  }, []);

  // Toggle auto-play with Pomodoro timer
  const handleSetAutoPlayWithPomodoro = useCallback(async (enabled) => {
    setAutoPlayWithPomodoro(enabled);
    await saveAudioSettings({ autoPlayWithPomodoro: enabled });
  }, []);

  const value = {
    isPlaying,
    isMuted,
    volume,
    activeTrackId,
    activeTrack,
    allTracks,
    preinstalledTracks: PREINSTALLED_TRACKS,
    customTracks,
    showNavbarMusic,
    autoPlayWithPomodoro,
    isLooping,
    isLoading,
    play: handlePlay,
    pause: handlePause,
    togglePlay: handleTogglePlay,
    stop: handleStop,
    toggleMute: handleToggleMute,
    setVolume: handleSetVolume,
    pickAudio: handlePickAudio,
    deleteCustomTrack: handleDeleteCustomTrack,
    setShowNavbarMusic: handleSetShowNavbarMusic,
    setAutoPlayWithPomodoro: handleSetAutoPlayWithPomodoro,
    refreshAudioData,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
