/**
 * MissionControl Glass UI — Design System
 * Single source of truth for colors, spacing, typography, and glass styles.
 * CSS variables in index.css mirror these values for use in class-based styles.
 */
export const theme = {
  colors: {
    base:     '#0b0f14',
    brain:    '#7c3aed',   // OpenAI / AI accent
    success:  '#10b981',
    warning:  '#f59e0b',
    danger:   '#ef4444',
    info:     '#0ea5e9',
    accent:   '#f59e0b',   // primary accent (power, nav active)
  },

  glass: {
    bg:           'rgba(255,255,255,0.05)',
    bgSurface:    'rgba(255,255,255,0.08)',
    border:       'rgba(255,255,255,0.08)',
    borderBright: 'rgba(255,255,255,0.18)',
    blur:         'blur(14px)',
    radius:       '16px',
    radiusSm:     '10px',
    radiusFull:   '9999px',
  },

  spacing: {
    xs:  4,
    sm:  8,
    md: 16,
    lg: 24,
    xl: 32,
  } as const,

  fontSize: {
    xs:   11,
    sm:   12,
    md:   13,
    base: 14,
    lg:   16,
    xl:   20,
    '2xl': 24,
    '3xl': 28,
  } as const,
} as const;
