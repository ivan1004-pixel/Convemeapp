/**
 * Paleta de colores completa de ConVeMe
 * Basada en los colores de marca: pink, blue y beige
 */

export const colors = {
  // Colores de marca
  brand: {
    pink: '#f88fea',
    pinkLight: '#fbb8f3',
    pinkDark: '#e060d0',
    blue: '#0301ff',
    blueLight: '#4040ff',
    blueDark: '#0200bb',
    beige: '#ede0d1',
    beigeLight: '#f5ece0',
    beigeDark: '#d4c4ac',
  },

  // Grises
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semánticos
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Bases
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Tema claro
  light: {
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#11181C',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    tint: '#0301ff',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0301ff',
  },

  // Tema oscuro
  dark: {
    background: '#0f0f0f',
    surface: '#1a1a1a',
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textMuted: '#6b7280',
    border: '#374151',
    tint: '#f88fea',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#f88fea',
  },
} as const;

export type Colors = typeof colors;
