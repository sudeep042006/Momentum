import { localStorage } from './localStorage';

const KEYS = {
  USER: 'user',
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  TASKS_PREFIX: 'cached_tasks_',
  HEATMAP: 'cached_heatmap',
  STATS: 'cached_stats',
  JOURNALS: 'cached_journals',
  SCHEDULE: 'cached_schedule',
  BADGES: 'cached_badges',
  MILESTONES: 'cached_milestones',
};

export const cacheManager = {
  // Auth & Tokens
  getUser: () => localStorage.getItem(KEYS.USER),
  setUser: (user) => localStorage.setItem(KEYS.USER, user),
  getToken: () => localStorage.getItem(KEYS.TOKEN),
  setToken: (token) => localStorage.setItem(KEYS.TOKEN, token),
  getRefreshToken: () => localStorage.getItem(KEYS.REFRESH_TOKEN),
  setRefreshToken: (token) => localStorage.setItem(KEYS.REFRESH_TOKEN, token),
  clearAuth: async () => {
    await localStorage.removeItem(KEYS.USER);
    await localStorage.removeItem(KEYS.TOKEN);
    await localStorage.removeItem(KEYS.REFRESH_TOKEN);
  },

  // Tasks by Date
  getTasks: (date) => localStorage.getItem(`${KEYS.TASKS_PREFIX}${date}`),
  setTasks: (date, tasks) => localStorage.setItem(`${KEYS.TASKS_PREFIX}${date}`, tasks),

  // Heatmap & Stats
  getHeatmap: () => localStorage.getItem(KEYS.HEATMAP),
  setHeatmap: (data) => localStorage.setItem(KEYS.HEATMAP, data),
  getStats: () => localStorage.getItem(KEYS.STATS),
  setStats: (data) => localStorage.setItem(KEYS.STATS, data),

  // Journals & Quotes
  getJournals: () => localStorage.getItem(KEYS.JOURNALS),
  setJournals: (data) => localStorage.setItem(KEYS.JOURNALS, data),

  // Schedule / Timetable
  getSchedule: () => localStorage.getItem(KEYS.SCHEDULE),
  setSchedule: (data) => localStorage.setItem(KEYS.SCHEDULE, data),

  // Badges
  getBadges: () => localStorage.getItem(KEYS.BADGES),
  setBadges: (data) => localStorage.setItem(KEYS.BADGES, data),

  // Milestones
  getMilestones: () => localStorage.getItem(KEYS.MILESTONES),
  setMilestones: (data) => localStorage.setItem(KEYS.MILESTONES, data),
};
