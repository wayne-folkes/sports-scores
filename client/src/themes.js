export const THEMES = {
  default: {
    label: 'Default Dark',
    vars: {}, // uses index.css defaults
  },
  'midnight-blue': {
    label: 'Midnight Blue',
    vars: {
      '--bg-page': '#0a1628',
      '--bg-page-alt': '#0a1628',
      '--bg-widget': '#0f1d33',
      '--bg-widget-strong': '#0f1d33',
      '--bg-card': '#152642',
      '--bg-card-hover': '#1c3054',
      '--bg-soft': 'rgba(130, 170, 255, 0.06)',
      '--text-primary': '#e8edf8',
      '--text-secondary': '#8da4c7',
      '--text-muted': '#4a6488',
      '--border': 'rgba(100, 160, 255, 0.10)',
      '--border-strong': 'rgba(100, 160, 255, 0.20)',
      '--shadow-sm': '0 2px 16px rgba(4, 10, 24, 0.5)',
      '--shadow-md': '0 6px 32px rgba(4, 10, 24, 0.6)',
      '--shadow-lg': '0 12px 60px rgba(4, 10, 24, 0.7)',
    },
  },
  'warm-charcoal': {
    label: 'Warm Charcoal',
    vars: {
      '--bg-page': '#121010',
      '--bg-page-alt': '#121010',
      '--bg-widget': '#1a1614',
      '--bg-widget-strong': '#1a1614',
      '--bg-card': '#231e1b',
      '--bg-card-hover': '#2e2722',
      '--bg-soft': 'rgba(255, 245, 230, 0.04)',
      '--text-primary': '#f2ece6',
      '--text-secondary': '#a89a8a',
      '--text-muted': '#6b5e52',
      '--border': 'rgba(255, 235, 205, 0.08)',
      '--border-strong': 'rgba(255, 235, 205, 0.16)',
      '--border-focus': '#f0b840',
      '--accent': '#f0b840',
      '--accent-dim': 'rgba(240, 184, 64, 0.12)',
      '--shadow-sm': '0 2px 16px rgba(10, 6, 2, 0.5)',
      '--shadow-md': '0 6px 32px rgba(10, 6, 2, 0.6)',
      '--shadow-lg': '0 12px 60px rgba(10, 6, 2, 0.7)',
      '--status-final': '#7a7068',
      '--status-final-bg': 'rgba(90, 78, 68, 0.3)',
    },
  },
  light: {
    label: 'Light',
    vars: {
      '--bg-page': '#f2f3f7',
      '--bg-page-alt': '#f2f3f7',
      '--bg-widget': '#e9eaef',
      '--bg-widget-strong': '#e9eaef',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#f7f7f9',
      '--bg-soft': 'rgba(0, 0, 0, 0.03)',
      '--text-primary': '#1a1d2a',
      '--text-secondary': '#5a6178',
      '--text-muted': '#9099b0',
      '--border': 'rgba(0, 0, 0, 0.08)',
      '--border-strong': 'rgba(0, 0, 0, 0.15)',
      '--border-focus': '#0d7c66',
      '--accent': '#0d7c66',
      '--accent-dim': 'rgba(13, 124, 102, 0.08)',
      '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
      '--shadow-md': '0 6px 20px rgba(0, 0, 0, 0.08)',
      '--shadow-lg': '0 12px 40px rgba(0, 0, 0, 0.1)',
      '--status-live': '#d92626',
      '--status-live-bg': 'rgba(217, 38, 38, 0.08)',
      '--status-live-glow': 'rgba(217, 38, 38, 0.18)',
      '--status-final': '#7a8399',
      '--status-final-bg': 'rgba(122, 131, 153, 0.12)',
      '--status-scheduled': '#1a9e74',
      '--status-scheduled-bg': 'rgba(26, 158, 116, 0.08)',
    },
  },
  cream: {
    label: 'Cream',
    vars: {
      '--bg-page': '#f5f0e8',
      '--bg-page-alt': '#f5f0e8',
      '--bg-widget': '#ebe5db',
      '--bg-widget-strong': '#ebe5db',
      '--bg-card': '#faf8f4',
      '--bg-card-hover': '#f0ece4',
      '--bg-soft': 'rgba(120, 90, 50, 0.04)',
      '--text-primary': '#2c2418',
      '--text-secondary': '#6b5d4d',
      '--text-muted': '#a09282',
      '--border': 'rgba(120, 90, 50, 0.12)',
      '--border-strong': 'rgba(120, 90, 50, 0.22)',
      '--border-focus': '#b8860b',
      '--accent': '#b8860b',
      '--accent-dim': 'rgba(184, 134, 11, 0.10)',
      '--shadow-sm': '0 2px 8px rgba(60, 40, 10, 0.08)',
      '--shadow-md': '0 6px 20px rgba(60, 40, 10, 0.10)',
      '--shadow-lg': '0 12px 40px rgba(60, 40, 10, 0.12)',
      '--status-live': '#c42020',
      '--status-live-bg': 'rgba(196, 32, 32, 0.08)',
      '--status-live-glow': 'rgba(196, 32, 32, 0.16)',
      '--status-final': '#8a7d6e',
      '--status-final-bg': 'rgba(138, 125, 110, 0.15)',
      '--status-scheduled': '#1a8a60',
      '--status-scheduled-bg': 'rgba(26, 138, 96, 0.08)',
    },
  },
};

// Default values from index.css so we can reset when switching back
const DEFAULT_VARS = {
  '--bg-page': '#06070c',
  '--bg-page-alt': '#06070c',
  '--bg-widget': '#0d1018',
  '--bg-widget-strong': '#0d1018',
  '--bg-card': '#131620',
  '--bg-card-hover': '#1a1d2a',
  '--bg-soft': 'rgba(255, 255, 255, 0.04)',
  '--text-primary': '#edf0fb',
  '--text-secondary': '#8a94b2',
  '--text-muted': '#4e5a7a',
  '--border': 'rgba(255, 255, 255, 0.07)',
  '--border-strong': 'rgba(255, 255, 255, 0.14)',
  '--border-focus': '#c8ff00',
  '--accent': '#c8ff00',
  '--accent-dim': 'rgba(200, 255, 0, 0.1)',
  '--shadow-sm': '0 2px 16px rgba(0, 0, 0, 0.5)',
  '--shadow-md': '0 6px 32px rgba(0, 0, 0, 0.6)',
  '--shadow-lg': '0 12px 60px rgba(0, 0, 0, 0.7)',
  '--status-live': '#ff3535',
  '--status-live-bg': 'rgba(255, 53, 53, 0.1)',
  '--status-live-glow': 'rgba(255, 53, 53, 0.28)',
  '--status-final': '#6b7794',
  '--status-final-bg': 'rgba(61, 70, 96, 0.3)',
  '--status-scheduled': '#29c99a',
  '--status-scheduled-bg': 'rgba(41, 201, 154, 0.1)',
};

export function applyTheme(themeKey) {
  const theme = THEMES[themeKey];
  if (!theme) return;

  const root = document.documentElement;

  // Reset all overridable vars to defaults first
  for (const [prop, value] of Object.entries(DEFAULT_VARS)) {
    root.style.setProperty(prop, value);
  }

  // Apply theme overrides
  for (const [prop, value] of Object.entries(theme.vars)) {
    root.style.setProperty(prop, value);
  }
}
