import React from 'react';
import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import { ROLE_ADMIN } from '../../src/hooks/useAuth';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({ name, color, size }: { name: IconName; color: string; size: number }) {
  return <MaterialCommunityIcons name={name} color={color} size={size} />;
}

const HIDDEN: { href: null } = { href: null };

export default function AppLayout() {
  const { isAuthenticated, usuario } = useAuthStore();
  const isAdmin = usuario?.rol_id === ROLE_ADMIN;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/splash');
    }
  }, [isAuthenticated]);

  const tabBarStyle = {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 3,
    borderColor: Colors.dark,
    height: 85,
    paddingBottom: 25,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.dark,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '900',
          letterSpacing: 0.5,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
        listeners={{
          tabPress: () => router.push('/(app)'),
        }}
      />
      <Tabs.Screen name="ventas" options={HIDDEN} />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="package-variant" color={color} size={size} />
          ),
        }}
        listeners={{
          tabPress: () => router.push('/(app)/pedidos'),
        }}
      />
      <Tabs.Screen name="productos" options={HIDDEN} />
      <Tabs.Screen
        name="mas"
        options={{
          title: 'Más',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="menu" color={color} size={size} />
          ),
        }}
        listeners={{
          tabPress: () => router.push('/(app)/mas'),
        }}
      />

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
      <Tabs.Screen name="resumen-mensual" options={HIDDEN} />
    </Tabs>
  );
}
