import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { useAuthStore } from '../../../src/store/authStore';
import { useAuth, ROLE_ADMIN } from '../../../src/hooks/useAuth';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MenuItem {
  icon: IconName;
  iconColor?: string;
  title: string;
  route: string;
}

interface MenuSection {
  title: string;
  data: MenuItem[];
}

const SECTIONS_ADMIN: MenuSection[] = [
  {
    title: 'Personas',
    data: [
      { icon: 'account-group', title: 'Clientes', route: '/(app)/clientes', iconColor: Colors.info },
      { icon: 'account-hard-hat', title: 'Empleados', route: '/(app)/empleados', iconColor: Colors.warning },
      { icon: 'account-tie', title: 'Vendedores', route: '/(app)/vendedores', iconColor: Colors.primary },
    ],
  },
  {
    title: 'Administración',
    data: [
      { icon: 'account-plus', title: 'Crear Usuario', route: '/auth/register', iconColor: Colors.primary },
    ],
  },
  {
    title: 'Operaciones',
    data: [
      { icon: 'calendar-star', title: 'Eventos', route: '/(app)/eventos', iconColor: Colors.warning },
      { icon: 'clipboard-list', title: 'Asignaciones', route: '/(app)/asignaciones', iconColor: Colors.info },
      { icon: 'scissors-cutting', title: 'Cortes', route: '/(app)/cortes', iconColor: Colors.success },
    ],
  },
  {
    title: 'Configuración',
    data: [
      { icon: 'school', title: 'Escuelas', route: '/(app)/escuelas', iconColor: Colors.info },
      { icon: 'flask', title: 'Insumos', route: '/(app)/insumos', iconColor: Colors.warning },
      { icon: 'tag-multiple', title: 'Promociones', route: '/(app)/promociones', iconColor: Colors.success },
      { icon: 'file-document', title: 'Comprobantes', route: '/(app)/comprobantes', iconColor: Colors.primary },
      { icon: 'shape', title: 'Categorías', route: '/(app)/categorias', iconColor: Colors.warning },
      { icon: 'ruler', title: 'Tamaños', route: '/(app)/tamanos', iconColor: Colors.info },
    ],
  },
  {
    title: 'Producción',
    data: [
      { icon: 'factory', title: 'Producción', route: '/(app)/produccion', iconColor: Colors.primary },
      { icon: 'bank', title: 'Cuentas Bancarias', route: '/(app)/cuentas-bancarias', iconColor: Colors.success },
    ],
  },
  {
    title: 'Cuenta',
    data: [
      { icon: 'account-circle', title: 'Mi Perfil', route: '/(app)/perfil', iconColor: Colors.primary },
    ],
  },
];

const SECTIONS_VENDEDOR: MenuSection[] = [
  {
    title: 'Personas',
    data: [
      { icon: 'account-group', title: 'Mis Clientes', route: '/(app)/clientes', iconColor: Colors.info },
    ],
  },
  {
    title: 'Cuentas',
    data: [
      { icon: 'receipt', title: 'Historial de Ventas', route: '/(app)/ventas', iconColor: Colors.success },
      { icon: 'bank', title: 'Pagos Recibidos', route: '/(app)/cortes', iconColor: Colors.warning },
      { icon: 'file-document', title: 'Comprobantes', route: '/(app)/comprobantes', iconColor: Colors.primary },
    ],
  },
  {
    title: 'Cuenta',
    data: [
      { icon: 'account-circle', title: 'Mi Perfil', route: '/(app)/perfil', iconColor: Colors.primary },
    ],
  },
];

export default function MasScreen() {
  const { usuario } = useAuthStore();
  const { logout } = useAuth();
  const isAdmin = usuario?.rol_id === ROLE_ADMIN;
  const sections = isAdmin ? SECTIONS_ADMIN : SECTIONS_VENDEDOR;

  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push(item.route as never)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${item.iconColor ?? Colors.primary}22` }]}>
        <MaterialCommunityIcons name={item.icon} size={20} color={item.iconColor ?? Colors.primary} />
      </View>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: MenuSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isAdmin ? 'Administración' : 'Más'}</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.route}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <TouchableOpacity style={styles.logoutRow} onPress={logout} activeOpacity={0.8}>
            <View style={[styles.iconWrap, { backgroundColor: `${Colors.error}22` }]}>
              <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
            </View>
            <Text style={[styles.itemTitle, { color: Colors.error }]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontFamily: 'Galada',
    fontSize: 28,
    color: Colors.textLight,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.4)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    ...Typography.body,
    color: Colors.textLight,
    flex: 1,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
