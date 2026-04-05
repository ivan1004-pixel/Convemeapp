import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

/**
 * Layout para las pantallas de autenticación (login, registro, etc.)
 * Sin tabs ni header de navegación
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.light.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
