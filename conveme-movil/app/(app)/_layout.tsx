import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { useColorScheme } from '../../src/hooks/use-color-scheme';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

const HIDDEN: { href: null } = { href: null };

export default function AppLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      {/* ── Visible tabs ── */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="ventas"
        options={{ title: 'Ventas', tabBarIcon: () => <TabIcon emoji="💰" /> }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{ title: 'Pedidos', tabBarIcon: () => <TabIcon emoji="📦" /> }}
      />
      <Tabs.Screen
        name="productos"
        options={{ title: 'Productos', tabBarIcon: () => <TabIcon emoji="🛍️" /> }}
      />
      <Tabs.Screen
        name="mas"
        options={{ title: 'Más', tabBarIcon: () => <TabIcon emoji="☰" /> }}
      />

      {/* ── Hidden from tab bar ── */}
      <Tabs.Screen name="clientes" options={HIDDEN} />
      <Tabs.Screen name="empleados" options={HIDDEN} />
      <Tabs.Screen name="vendedores" options={HIDDEN} />
      <Tabs.Screen name="eventos" options={HIDDEN} />
      <Tabs.Screen name="escuelas" options={HIDDEN} />
      <Tabs.Screen name="insumos" options={HIDDEN} />
      <Tabs.Screen name="promociones" options={HIDDEN} />
      <Tabs.Screen name="comprobantes" options={HIDDEN} />
      <Tabs.Screen name="categorias" options={HIDDEN} />
      <Tabs.Screen name="tamanos" options={HIDDEN} />
      <Tabs.Screen name="asignaciones" options={HIDDEN} />
      <Tabs.Screen name="cortes" options={HIDDEN} />
      <Tabs.Screen name="produccion" options={HIDDEN} />
      <Tabs.Screen name="cuentas-bancarias" options={HIDDEN} />
      <Tabs.Screen name="perfil" options={HIDDEN} />
    </Tabs>
  );
}
