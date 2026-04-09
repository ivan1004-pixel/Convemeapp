import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function registerForPushNotificationsAsync() {
  // En Expo Go (Android), expo-notifications puede romper si se importa de forma estática
  // Por eso usamos require() dinámico solo cuando es necesario
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('Push Notifications are not supported in Expo Go on Android (SDK 53+). Use a development build.');
    return null;
  }

  // Importación dinámica para evitar que se evalúe al cargar el archivo
  const Notifications = require('expo-notifications');

  let token;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }
      
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId || 
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn('Project ID no encontrado en la configuración.');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
          projectId: projectId
      })).data;
    } else {
      console.warn('Must use physical device for Push Notifications');
    }
  } catch (e) {
    console.warn('Error en registro de notificaciones:', e);
    return null;
  }

  return token;
}
