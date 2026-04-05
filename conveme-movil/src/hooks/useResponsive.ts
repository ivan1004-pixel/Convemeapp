/**
 * Hook de responsive design
 * Retorna dimensiones y breakpoints para adaptar la UI
 */
import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isXs = width < BREAKPOINTS.sm;
  const isSm = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
  const isMd = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isLg = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
  const isXl = width >= BREAKPOINTS.xl;

  const isPhone = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md;
  const isLandscape = width > height;
  const isPortrait = height >= width;

  const currentBreakpoint: Breakpoint = isXl
    ? 'xl'
    : isLg
      ? 'lg'
      : isMd
        ? 'md'
        : isSm
          ? 'sm'
          : 'xs';

  /** Retorna el valor correspondiente al breakpoint actual */
  function responsive<T>(values: Partial<Record<Breakpoint, T>> & { xs: T }): T {
    if (isXl && values.xl !== undefined) return values.xl;
    if (isLg && values.lg !== undefined) return values.lg;
    if (isMd && values.md !== undefined) return values.md;
    if (isSm && values.sm !== undefined) return values.sm;
    return values.xs;
  }

  return {
    width,
    height,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isPhone,
    isTablet,
    isLandscape,
    isPortrait,
    currentBreakpoint,
    responsive,
    breakpoints: BREAKPOINTS,
  };
}
