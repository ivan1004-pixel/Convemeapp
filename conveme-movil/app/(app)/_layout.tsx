import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

/**
 * Layout para las pantallas principales de la app (autenticadas)
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.light.background,
        },
        headerTintColor: colors.brand.blue,
        headerTitleStyle: {
          fontFamily: 'Galada',
          fontSize: 20,
        },
        contentStyle: { backgroundColor: colors.light.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
