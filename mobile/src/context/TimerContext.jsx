import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { AppState, Platform, Vibration, Alert } from 'react-native';
import { localStorage } from '../storage/localStorage';
import {
  syncTimerToNotificationBar,
  cancelTimerNotification,
  showSystemNotification,
} from '../services/systemNotificationService';

const STORAGE_KEY_TIMER = 'momentum_active_timer_state_v2';
const STORAGE_KEY_POMODORO_STATS = 'momentum_pomodoro_stats_v1';

// Default presets requested by user: 50 mins focus block + 3 sessions
export const DEFAULT_FOCUS_DURATION = 50 * 60; // 50 minutes
export const DEFAULT_BREAK_DURATION = 5 * 60; // 5 minutes
export const DEFAULT_TOTAL_SESSIONS = 3; // 3 sessions

const TimerContext = createContext({
  duration: DEFAULT_FOCUS_DURATION,
  breakDuration: DEFAULT_BREAK_DURATION,
  totalSessions: DEFAULT_TOTAL_SESSIONS,
  currentSession: 1,
  timeLeft: DEFAULT_FOCUS_DURATION,
  isRunning: false,
  isBreak: false,
  cyclesCompletedToday: 0,
  totalFocusMinutesToday: 0,
  startTimer: () => {},
  pauseTimer: () => {},
  resetTimer: () => {},
  skipBlock: () => {},
  setSessions: () => {},
  setDuration: () => {},
  setBreakDuration: () => {},
});

export function TimerProvider({ children }) {
  const [duration, setDurationState] = useState(DEFAULT_FOCUS_DURATION);
  const [breakDuration, setBreakDurationState] = useState(DEFAULT_BREAK_DURATION);
  const [totalSessions, setTotalSessionsState] = useState(DEFAULT_TOTAL_SESSIONS);
  const [currentSession, setCurrentSession] = useState(1);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [targetEndTime, setTargetEndTime] = useState(null);

  const [cyclesCompletedToday, setCyclesCompletedToday] = useState(0);
  const [totalFocusMinutesToday, setTotalFocusMinutesToday] = useState(0);

  const timerRef = useRef(null);

  // 1. Load today's cumulative stats on mount
  useEffect(() => {
    (async () => {
      try {
        const todayKey = new Date().toISOString().split('T')[0];
        const raw = await localStorage.getItem(STORAGE_KEY_POMODORO_STATS);
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (parsed?.date === todayKey) {
            setCyclesCompletedToday(parsed.cycles || 0);
            setTotalFocusMinutesToday(parsed.focusMinutes || 0);
          }
        }
      } catch (e) {}
    })();
  }, []);

  const saveStats = async (newCycles, newMinutes) => {
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      const data = {
        date: todayKey,
        cycles: newCycles,
        focusMinutes: newMinutes,
      };
      await localStorage.setItem(STORAGE_KEY_POMODORO_STATS, JSON.stringify(data));
    } catch (e) {}
  };

  // 2. Persist active timer state to localStorage and Android notification bar
  const persistState = useCallback(
    async (newState) => {
      try {
        await localStorage.setItem(STORAGE_KEY_TIMER, JSON.stringify(newState));
        if (newState.isRunning && newState.targetEndTime) {
          const title = newState.isBreak
            ? `☕ Rest Break • Session ${newState.currentSession}/${newState.totalSessions}`
            : `⏱️ Focus Session ${newState.currentSession} of ${newState.totalSessions} (${Math.round(newState.duration / 60)}m)`;
          const summary = newState.isBreak
            ? `Recharge & Hydrate before session ${newState.currentSession + 1}`
            : `Deep Work Session ${newState.currentSession} of ${newState.totalSessions}`;

          syncTimerToNotificationBar(
            title,
            summary,
            newState.targetEndTime,
            true,
            newState.currentSession,
            newState.totalSessions
          );
        } else {
          cancelTimerNotification();
        }
      } catch (e) {}
    },
    []
  );

  // 3. Complete current block (Focus or Break)
  const handleBlockComplete = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setTargetEndTime(null);
    cancelTimerNotification();

    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 500, 200, 500]);
    }

    if (!isBreak) {
      // Focus session finished
      const focusMins = Math.round(duration / 60);
      const nextCycles = cyclesCompletedToday + 1;
      const nextTotalMins = totalFocusMinutesToday + focusMins;
      setCyclesCompletedToday(nextCycles);
      setTotalFocusMinutesToday(nextTotalMins);
      await saveStats(nextCycles, nextTotalMins);

      // Check if more sessions remain in this multi-session cycle
      if (currentSession < totalSessions) {
        // Transition to Break
        setIsBreak(true);
        setTimeLeft(breakDuration);
        persistState({
          duration,
          breakDuration,
          totalSessions,
          currentSession,
          timeLeft: breakDuration,
          isRunning: false,
          isBreak: true,
          targetEndTime: null,
        });

        showSystemNotification(
          `🎯 Focus Session ${currentSession} of ${totalSessions} Complete!`,
          `Great work! Take a ${Math.round(breakDuration / 60)}m rest break before Session ${currentSession + 1}.`,
          8803,
          'POMODORO'
        );

        Alert.alert(
          `🎯 Session ${currentSession} of ${totalSessions} Complete!`,
          `You nailed ${focusMins} minutes of pure focus. Take a ${Math.round(breakDuration / 60)}m break before Session ${currentSession + 1}.`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: `Start ${Math.round(breakDuration / 60)}m Break`,
              onPress: () => {
                const target = Date.now() + breakDuration * 1000;
                setIsRunning(true);
                setTargetEndTime(target);
                persistState({
                  duration,
                  breakDuration,
                  totalSessions,
                  currentSession,
                  timeLeft: breakDuration,
                  isRunning: true,
                  isBreak: true,
                  targetEndTime: target,
                });
              },
            },
          ]
        );
      } else {
        // All sessions completed!
        setIsBreak(false);
        setCurrentSession(1);
        setTimeLeft(duration);
        persistState({
          duration,
          breakDuration,
          totalSessions,
          currentSession: 1,
          timeLeft: duration,
          isRunning: false,
          isBreak: false,
          targetEndTime: null,
        });

        showSystemNotification(
          `🏆 All ${totalSessions} Focus Sessions Complete!`,
          `Incredible consistency! You finished all ${totalSessions} blocks of deep focus today.`,
          8804,
          'POMODORO'
        );

        Alert.alert(
          '🏆 Cycle Complete!',
          `You conquered all ${totalSessions} sessions (${focusMins * totalSessions} minutes total). Unstoppable momentum!`
        );
      }
    } else {
      // Break finished -> advance to next focus session
      const nextSession = currentSession + 1;
      setIsBreak(false);
      setCurrentSession(nextSession);
      setTimeLeft(duration);
      persistState({
        duration,
        breakDuration,
        totalSessions,
        currentSession: nextSession,
        timeLeft: duration,
        isRunning: false,
        isBreak: false,
        targetEndTime: null,
      });

      showSystemNotification(
        `☕ Break Finished • Session ${nextSession}/${totalSessions} Ready`,
        'Recharged and ready to go? Tap to begin your next focus session.',
        8805,
        'POMODORO'
      );

      Alert.alert(
        '☕ Break Finished!',
        `Ready for Session ${nextSession} of ${totalSessions}? Let's dive back into flow state.`,
        [
          { text: 'Pause', style: 'cancel' },
          {
            text: `Start Session ${nextSession}`,
            onPress: () => {
              const target = Date.now() + duration * 1000;
              setIsRunning(true);
              setTargetEndTime(target);
              persistState({
                duration,
                breakDuration,
                totalSessions,
                currentSession: nextSession,
                timeLeft: duration,
                isRunning: true,
                isBreak: false,
                targetEndTime: target,
              });
            },
          },
        ]
      );
    }
  }, [
    isBreak,
    duration,
    breakDuration,
    currentSession,
    totalSessions,
    cyclesCompletedToday,
    totalFocusMinutesToday,
    persistState,
  ]);

  // 4. Restore timer state on cold boot
  useEffect(() => {
    (async () => {
      try {
        const raw = await localStorage.getItem(STORAGE_KEY_TIMER);
        if (raw) {
          const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (saved) {
            setDurationState(saved.duration || DEFAULT_FOCUS_DURATION);
            setBreakDurationState(saved.breakDuration || DEFAULT_BREAK_DURATION);
            setTotalSessionsState(saved.totalSessions || DEFAULT_TOTAL_SESSIONS);
            setCurrentSession(saved.currentSession || 1);
            setIsBreak(Boolean(saved.isBreak));

            if (saved.isRunning && saved.targetEndTime) {
              const now = Date.now();
              const remaining = Math.max(0, Math.round((saved.targetEndTime - now) / 1000));
              if (remaining > 0) {
                setTimeLeft(remaining);
                setIsRunning(true);
                setTargetEndTime(saved.targetEndTime);

                const title = saved.isBreak
                  ? `☕ Rest Break • Session ${saved.currentSession}/${saved.totalSessions}`
                  : `⏱️ Focus Session ${saved.currentSession} of ${saved.totalSessions} (${Math.round((saved.duration || DEFAULT_FOCUS_DURATION) / 60)}m)`;
                const summary = saved.isBreak
                  ? `Recharge before session ${saved.currentSession + 1}`
                  : `Deep Work Session ${saved.currentSession} of ${saved.totalSessions}`;

                syncTimerToNotificationBar(
                  title,
                  summary,
                  saved.targetEndTime,
                  true,
                  saved.currentSession,
                  saved.totalSessions
                );
              } else {
                // Expired while app was closed
                setTimeLeft(0);
                setIsRunning(false);
                setTargetEndTime(null);
                handleBlockComplete();
              }
            } else {
              setTimeLeft(saved.timeLeft || saved.duration || DEFAULT_FOCUS_DURATION);
              setIsRunning(false);
              setTargetEndTime(null);
            }
          }
        }
      } catch (e) {}
    })();
  }, [handleBlockComplete]);

  // 5. AppState Listener: reconcile when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isRunning && targetEndTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((targetEndTime - now) / 1000));
        if (remaining <= 0) {
          handleBlockComplete();
        } else {
          setTimeLeft(remaining);
        }
      }
    });

    return () => sub.remove();
  }, [isRunning, targetEndTime, handleBlockComplete]);

  // 6. Active interval timer tick
  useEffect(() => {
    if (isRunning && targetEndTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((targetEndTime - now) / 1000));
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setTimeLeft(0);
          handleBlockComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, targetEndTime, handleBlockComplete]);

  // Public Actions
  const startTimer = useCallback(() => {
    const target = Date.now() + timeLeft * 1000;
    setIsRunning(true);
    setTargetEndTime(target);

    persistState({
      duration,
      breakDuration,
      totalSessions,
      currentSession,
      timeLeft,
      isRunning: true,
      isBreak,
      targetEndTime: target,
    });
  }, [timeLeft, duration, breakDuration, totalSessions, currentSession, isBreak, persistState]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    setTargetEndTime(null);
    cancelTimerNotification();

    persistState({
      duration,
      breakDuration,
      totalSessions,
      currentSession,
      timeLeft,
      isRunning: false,
      isBreak,
      targetEndTime: null,
    });
  }, [duration, breakDuration, totalSessions, currentSession, timeLeft, isBreak, persistState]);

  const resetTimer = useCallback(() => {
    const resetTime = isBreak ? breakDuration : duration;
    setIsRunning(false);
    setTargetEndTime(null);
    setTimeLeft(resetTime);
    cancelTimerNotification();

    persistState({
      duration,
      breakDuration,
      totalSessions,
      currentSession,
      timeLeft: resetTime,
      isRunning: false,
      isBreak,
      targetEndTime: null,
    });
  }, [isBreak, breakDuration, duration, totalSessions, currentSession, persistState]);

  const skipBlock = useCallback(() => {
    handleBlockComplete();
  }, [handleBlockComplete]);

  const setSessions = useCallback(
    (count) => {
      const cleanCount = Math.max(1, count);
      setTotalSessionsState(cleanCount);
      setCurrentSession((prev) => Math.min(prev, cleanCount));

      persistState({
        duration,
        breakDuration,
        totalSessions: cleanCount,
        currentSession: Math.min(currentSession, cleanCount),
        timeLeft,
        isRunning,
        isBreak,
        targetEndTime,
      });
    },
    [duration, breakDuration, currentSession, timeLeft, isRunning, isBreak, targetEndTime, persistState]
  );

  const setDuration = useCallback(
    (secs) => {
      const cleanSecs = Math.max(60, secs);
      setDurationState(cleanSecs);
      if (!isBreak && !isRunning) {
        setTimeLeft(cleanSecs);
      }

      persistState({
        duration: cleanSecs,
        breakDuration,
        totalSessions,
        currentSession,
        timeLeft: !isBreak && !isRunning ? cleanSecs : timeLeft,
        isRunning,
        isBreak,
        targetEndTime,
      });
    },
    [isBreak, isRunning, breakDuration, totalSessions, currentSession, timeLeft, targetEndTime, persistState]
  );

  const setBreakDuration = useCallback(
    (secs) => {
      const cleanSecs = Math.max(60, secs);
      setBreakDurationState(cleanSecs);
      if (isBreak && !isRunning) {
        setTimeLeft(cleanSecs);
      }

      persistState({
        duration,
        breakDuration: cleanSecs,
        totalSessions,
        currentSession,
        timeLeft: isBreak && !isRunning ? cleanSecs : timeLeft,
        isRunning,
        isBreak,
        targetEndTime,
      });
    },
    [isBreak, isRunning, duration, totalSessions, currentSession, timeLeft, targetEndTime, persistState]
  );

  return (
    <TimerContext.Provider
      value={{
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
        setBreakDuration,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
