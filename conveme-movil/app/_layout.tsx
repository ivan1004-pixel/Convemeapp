import { useEffect } from 'react';
import { Slot, router } from 'expo-router';
import { Platform } from 'react-native';
import { useFonts, Galada_400Regular } from '@expo-google-fonts/galada';
import * as SplashScreen from 'expo-splash-screen';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useAuthStore } from '../src/store/authStore';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

SplashScreen.preventAutoHideAsync();

const isExpoGoOnAndroid = 
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient && 
  Platform.OS === 'android';

// Configurar cómo se comportan las notificaciones cuando la app está abierta
if (!isExpoGoOnAndroid) {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('Error al cargar expo-notifications:', e);
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Galada: Galada_400Regular,
  });
  const { isAuthenticated } = useAuthStore();

  // Registrar para notificaciones push
  usePushNotifications();

  useEffect(() => {
    if (isExpoGoOnAndroid) return;

    let subscription: any;
    let responseSubscription: any;

    try {
      const Notifications = require('expo-notifications');
      
      // Escuchar cuando llega una notificación
      subscription = Notifications.addNotificationReceivedListener((notification: any) => {
        console.log('Notificación recibida:', notification);
      });

      // Escuchar cuando el usuario toca la notificación
      responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data;
        if (data.id_asignacion) {
          router.push(`/(app)/asignaciones/${data.id_asignacion}`);
        } else if (data.id_corte) {
          router.push(`/(app)/cortes/${data.id_corte}`);
        }
      });
    } catch (e) {
      console.warn('Error al configurar listeners de notificaciones:', e);
    }

    return () => {
      if (subscription) subscription.remove();
      if (responseSubscription) responseSubscription.remove();
    };
  }, []);

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

