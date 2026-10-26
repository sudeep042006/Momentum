/**
 * Mommenttum Visual Design System Colors
 * True black background, subtle greys, and purposeful emerald green
 */
export const colors = {
  background: '#060806',
  surface: '#0B0F0C',
  card: '#0D120F',
  cardElevated: '#111713',
  input: '#090D0A',
  border: '#18241B',
  borderLight: '#243629',
  
  // Emerald Green Spectrum
  emerald: {
    bright: '#00E676', // Primary action, active tab, completed state
    deep: '#064A25',   // High intensity heatmap
    muted: '#12301E',  // Low intensity / subtle tags
    glow: 'rgba(0, 230, 118, 0.15)',
  },
  
  // Text Hierarchy
  text: {
    primary: '#FFFFFF',
    secondary: '#8E9C92',
    muted: '#526056',
    disabled: '#333D36',
  },
  
  // Contribution Heatmap Levels (0 to 5)
  heatmap: {
    level0: '#111713', // 0%
    level1: '#0d381e', // 1-25%
    level2: '#086634', // 26-50%
    level3: '#009e4d', // 51-75%
    level4: '#00E676', // 76-99%
    level5: '#5cff9d', // 100% Brightest Green
  },
  
  // Category Accents (from reference images)
  categories: {
    development: { text: '#00E676', bg: '#0D241C', border: '#15422B' },
    backend: { text: '#00E676', bg: '#0D241C', border: '#15422B' },
    practice: { text: '#38BDF8', bg: '#0C2338', border: '#133857' },
    academic: { text: '#38BDF8', bg: '#0C2338', border: '#133857' },
    learning: { text: '#C084FC', bg: '#271438', border: '#3F225A' },
    personal: { text: '#F59E0B', bg: '#33220A', border: '#523610' },
    planning: { text: '#F59E0B', bg: '#33220A', border: '#523610' },
    health: { text: '#00E676', bg: '#0D241C', border: '#15422B' },
  },
  
  status: {
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#00E676',
  }
};
