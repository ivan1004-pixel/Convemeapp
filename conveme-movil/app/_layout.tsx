import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { useFonts, Galada_400Regular } from '@expo-google-fonts/galada';
import * as SplashScreen from 'expo-splash-screen';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apolloClient } from '../src/api/apollo';

// Evita que la pantalla de carga desaparezca antes de tiempo
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Cargamos la fuente y le asignamos el nombre 'Galada' (el mismo que pusimos en tailwind)
  const [fontsLoaded, fontError] = useFonts({
    Galada: Galada_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Si la fuente aún no carga, no renderizamos nada para evitar parpadeos
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Slot se encarga de renderizar la pantalla actual en la que se encuentre el usuario
  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <Slot />
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
