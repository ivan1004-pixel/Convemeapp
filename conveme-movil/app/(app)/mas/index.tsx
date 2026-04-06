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
import { Image } from 'expo-image';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { useAuthStore } from '../../../src/store/authStore';
import { useAuth, ROLE_ADMIN } from '../../../src/hooks/useAuth';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

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
    title: 'Cuenta',
    data: [
      { icon: 'account-circle', title: 'Mi Perfil', route: '/(app)/perfil', iconColor: Colors.primary },
    ],
  },
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
];

const SECTIONS_VENDEDOR: MenuSection[] = [
  {
    title: 'Cuenta',
    data: [
      { icon: 'account-circle', title: 'Mi Perfil', route: '/(app)/perfil', iconColor: Colors.primary },
    ],
  },
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
      <View style={[styles.iconWrap, { backgroundColor: `${item.iconColor ?? Colors.primary}22`, borderWidth: 1, borderColor: item.iconColor ?? Colors.primary }]}>
        <MaterialCommunityIcons name={item.icon} size={20} color={item.iconColor ?? Colors.primary} />
      </View>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.dark} />
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: MenuSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
    </View>
  );

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/logon.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
          <Text style={styles.titleText}>{isAdmin ? 'Administración' : 'Más opciones'}</Text>
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.route}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 50,
    marginBottom: Spacing.xs,
  },
  titleText: {
    ...Typography.h4,
    color: Colors.dark,
    fontWeight: '900',
    letterSpacing: 1,
  },
  list: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: '900',
    letterSpacing: 2,
    color: Colors.dark,
    opacity: 0.6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: '#F9F4EE',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    gap: Spacing.md,
    // Shadow neobrutalista
    shadowColor: Colors.dark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    ...Typography.body,
    color: Colors.dark,
    flex: 1,
    fontWeight: '700',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#F9F4EE',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.error,
    gap: Spacing.md,
    shadowColor: Colors.dark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
});
