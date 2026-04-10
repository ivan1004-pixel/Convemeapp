import { useEffect, useState } from 'react';
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
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Manejar Hidratación de Zustand
  useEffect(() => {
    const checkHydration = async () => {
      // Esperar a que Zustand se hidrate
      await useAuthStore.persist.rehydrate();
      setIsHydrated(true);
    };
    checkHydration();
  }, []);

  // 2. Manejar Navegación inicial
  useEffect(() => {
    if (!isHydrated) return;

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      
      if (isAuthenticated) {
        console.log('[RootLayout] Authenticated, replacing to /(app)');
        router.replace('/(app)');
      } else {
        console.log('[RootLayout] Not authenticated, replacing to /auth/splash');
        router.replace('/auth/splash');
      }
    }
  }, [fontsLoaded, fontError, isAuthenticated, isHydrated]);

  if (!isHydrated || (!fontsLoaded && !fontError)) {
    return null;
  }

  return <Slot />;
}
