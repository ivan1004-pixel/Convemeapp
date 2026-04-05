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
    backgroundColor: Colors.dark,
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isAdmin ? Colors.primary : Colors.info,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      {/* ── Visible tabs (common) ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ventas"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="cash-register" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="package-variant" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="productos"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="shopping" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mas"
        options={{
          title: isAdmin ? 'Admin' : 'Más',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name={isAdmin ? 'shield-crown' : 'menu'} color={color} size={size} />
          ),
        }}
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
