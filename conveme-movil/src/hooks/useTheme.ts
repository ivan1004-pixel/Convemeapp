import { useColorScheme } from './use-color-scheme';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';
import { Shadows } from '../theme/shadows';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark2 : Colors.light2;

  return {
    isDark,
    colors,
    primary: Colors.primary,
    primaryLight: Colors.primaryLight,
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
  };
};
