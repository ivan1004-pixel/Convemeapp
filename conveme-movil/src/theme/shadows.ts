/**
 * Sistema de sombras y elevación para React Native
 * Incluye compatibilidad iOS y Android
 */
import { Platform } from 'react-native';

type Shadow = {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
};

const buildShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number,
): Shadow => ({
  ...(Platform.OS === 'ios'
    ? {
        shadowColor: color,
        shadowOffset: { width: 0, height: offsetY },
        shadowOpacity: opacity,
        shadowRadius: radius,
      }
    : { elevation }),
});

export const shadows = {
  none: {},
  sm: buildShadow('#000000', 1, 0.06, 2, 2),
  base: buildShadow('#000000', 2, 0.08, 4, 4),
  md: buildShadow('#000000', 4, 0.1, 8, 6),
  lg: buildShadow('#000000', 8, 0.12, 16, 10),
  xl: buildShadow('#000000', 12, 0.14, 24, 14),
  '2xl': buildShadow('#000000', 16, 0.18, 32, 20),
  /** Sombra de la marca (rosa) */
  brand: buildShadow('#f88fea', 4, 0.3, 12, 8),
  /** Sombra azul de la marca */
  brandBlue: buildShadow('#0301ff', 4, 0.3, 12, 8),
} as const;

export type Shadows = typeof shadows;
