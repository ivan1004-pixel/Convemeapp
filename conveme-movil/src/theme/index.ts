/**
 * Exports centralizados del Design System de ConVeMe
 */

export { colors } from './colors';
export type { Colors } from './colors';

export {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  textStyles,
} from './typography';
export type { Typography } from './typography';

export { spacing, borderRadius, borderWidth, iconSizes } from './spacing';
export type { Spacing, BorderRadius } from './spacing';

export { shadows } from './shadows';
export type { Shadows } from './shadows';

import { colors } from './colors';
import { fontFamilies, fontSizes, fontWeights, textStyles } from './typography';
import { spacing, borderRadius } from './spacing';
import { shadows } from './shadows';

/** Tema completo de la aplicación */
export const theme = {
  colors,
  fonts: fontFamilies,
  fontSizes,
  fontWeights,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;
