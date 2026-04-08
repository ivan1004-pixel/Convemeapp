import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
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
    borderTopColor: Colors.dark,
    height: 75,
    paddingBottom: 15,
    paddingTop: 8,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: 'rgba(26,26,26,0.5)',
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="view-dashboard" color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="ventas"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="cash-register" color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="package-variant" color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="mas"
        options={{
          title: isAdmin ? 'Admin' : 'Menú',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name={isAdmin ? 'shield-crown' : 'menu'} color={color} size={28} />
          ),
        }}
      />

      {/* RUTAS OCULTAS DEL TAB BAR */}
      <Tabs.Screen name="productos" options={HIDDEN} />
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
