/**
 * Hook para detectar la plataforma actual
 */
import { Platform } from 'react-native';

export function usePlatform() {
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';
  const isWeb = Platform.OS === 'web';
  const isMobile = isIOS || isAndroid;
  const version = Platform.Version;

  return {
    isIOS,
    isAndroid,
    isWeb,
    isMobile,
    version,
    OS: Platform.OS,
    /** Selecciona un valor según la plataforma */
    select: Platform.select.bind(Platform),
  };
}
