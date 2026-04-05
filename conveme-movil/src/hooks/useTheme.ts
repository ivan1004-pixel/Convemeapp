/**
 * Hook de acceso al tema de la app
 * Retorna los tokens del design system según el esquema de color activo
 */
import { useColorScheme } from './use-color-scheme';
import { colors, fontFamilies, fontSizes, fontWeights, textStyles, spacing, borderRadius, shadows } from '../theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = isDark ? colors.dark : colors.light;

  return {
    isDark,
    colorScheme,
    colors: {
      ...themeColors,
      brand: colors.brand,
      success: colors.success,
      successLight: colors.successLight,
      warning: colors.warning,
      warningLight: colors.warningLight,
      error: colors.error,
      errorLight: colors.errorLight,
      info: colors.info,
      infoLight: colors.infoLight,
      white: colors.white,
      black: colors.black,
      gray: colors.gray,
    },
    fonts: fontFamilies,
    fontSizes,
    fontWeights,
    textStyles,
    spacing,
    borderRadius,
    shadows,
  };
}

export type AppTheme = ReturnType<typeof useTheme>;
