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
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';

interface MenuItem {
  emoji: string;
  title: string;
  route: string;
}

interface MenuSection {
  title: string;
  data: MenuItem[];
}

const SECTIONS: MenuSection[] = [
  {
    title: 'Personas',
    data: [
      { emoji: '👥', title: 'Clientes', route: '/(app)/clientes' },
      { emoji: '👷', title: 'Empleados', route: '/(app)/empleados' },
      { emoji: '🛒', title: 'Vendedores', route: '/(app)/vendedores' },
    ],
  },
  {
    title: 'Operaciones',
    data: [
      { emoji: '🎪', title: 'Eventos', route: '/(app)/eventos' },
      { emoji: '📋', title: 'Asignaciones', route: '/(app)/asignaciones' },
      { emoji: '✂️', title: 'Cortes', route: '/(app)/cortes' },
    ],
  },
  {
    title: 'Configuración',
    data: [
      { emoji: '🏫', title: 'Escuelas', route: '/(app)/escuelas' },
      { emoji: '🧪', title: 'Insumos', route: '/(app)/insumos' },
      { emoji: '🏷️', title: 'Promociones', route: '/(app)/promociones' },
      { emoji: '🧾', title: 'Comprobantes', route: '/(app)/comprobantes' },
      { emoji: '🗂️', title: 'Categorías', route: '/(app)/categorias' },
      { emoji: '📐', title: 'Tamaños', route: '/(app)/tamanos' },
    ],
  },
  {
    title: 'Producción',
    data: [
      { emoji: '⚙️', title: 'Producción', route: '/(app)/produccion' },
      { emoji: '🏦', title: 'Cuentas Bancarias', route: '/(app)/cuentas-bancarias' },
    ],
  },
  {
    title: 'Cuenta',
    data: [
      { emoji: '👤', title: 'Mi Perfil', route: '/(app)/perfil' },
    ],
  },
];

export default function MasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
      onPress={() => router.push(item.route as never)}
      activeOpacity={0.7}
    >
      <Text style={styles.itemEmoji}>{item.emoji}</Text>
      <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.chevron, { color: theme.muted }]}>›</Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: MenuSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.muted }]}>{section.title.toUpperCase()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Más</Text>
      </View>
      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => item.route}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { ...Typography.h2, fontFamily: 'Galada' },
  list: { paddingBottom: Spacing.xxl },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: { ...Typography.caption, fontWeight: '700', letterSpacing: 0.8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemEmoji: { fontSize: 20, marginRight: Spacing.md, width: 28 },
  itemTitle: { ...Typography.body, flex: 1 },
  chevron: { fontSize: 22, fontWeight: '300' },
});
