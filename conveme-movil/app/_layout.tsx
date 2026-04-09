import { useEffect } from 'react';
import { Slot, router } from 'expo-router';
import { useFonts, Galada_400Regular } from '@expo-google-fonts/galada';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Galada: Galada_400Regular,
  });
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Solo proceder si el store ya se hidrató desde el almacenamiento persistente
    if (!useAuthStore.persist.hasHydrated()) return;

    if (fontsLoaded || fontError) {
      if (isAuthenticated) {
        console.log('[RootLayout] Authenticated, replacing to /(app)');
        router.replace('/(app)');
      } else {
        console.log('[RootLayout] Not authenticated, replacing to /auth/splash');
        router.replace('/auth/splash');
      }
    }
  }, [fontsLoaded, fontError, isAuthenticated]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if ((!fontsLoaded && !fontError) || !useAuthStore.persist.hasHydrated()) {
    return null;
  }

  return <Slot />;
}
