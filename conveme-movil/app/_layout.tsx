import { useEffect, useState } from 'react';
import { Slot, router } from 'expo-router';
import { useFonts, Galada_400Regular } from '@expo-google-fonts/galada';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/authStore';
import { getUsuarioPerfil } from '../src/services/user.service';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Galada: Galada_400Regular,
  });
  const { isAuthenticated, usuario, setUsuario } = useAuthStore();
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

  // 2. Recuperar perfil actualizado (incluyendo foto) al iniciar
  useEffect(() => {
    const fetchProfile = async () => {
      if (isHydrated && isAuthenticated && usuario?.id_usuario) {
        try {
          const fullProfile = await getUsuarioPerfil(usuario.id_usuario);
          if (fullProfile && fullProfile.foto_perfil) {
            setUsuario({
              ...usuario,
              foto_perfil: fullProfile.foto_perfil,
            });
          }
        } catch (error) {
          // Si falla (ej. sin internet), no pasa nada grave, usará el default
          console.error('[RootLayout] Error fetching profile:', error);
        }
      }
    };
    fetchProfile();
  }, [isHydrated, isAuthenticated]);

  // 3. Manejar Navegación inicial
  useEffect(() => {
    if (!isHydrated) return;

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      
      if (isAuthenticated) {
        
        router.replace('/(app)');
      } else {
        // Log removido
        router.replace('/auth/splash');
      }
    }
  }, [fontsLoaded, fontError, isAuthenticated, isHydrated]);

  if (!isHydrated || (!fontsLoaded && !fontError)) {
    return null;
  }

  return <Slot />;
}
