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
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
      }
    }
  }, [fontsLoaded, fontError, isAuthenticated]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <Slot />;
}
