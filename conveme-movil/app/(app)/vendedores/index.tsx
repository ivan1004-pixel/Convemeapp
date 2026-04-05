import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getVendedores, deleteVendedor } from '../../../src/services/vendedor.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Vendedor } from '../../../src/types';

function VendedorCard({
  item,
  onPress,
  onDelete,
}: {
  item: Vendedor;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDelete}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        Shadows.sm,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>
          {item.nombre_completo}
        </Text>
        <TouchableOpacity onPress={onDelete} accessibilityLabel="Eliminar vendedor">
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {item.email ? (
        <Text style={[styles.cardMeta, { color: theme.muted }]}>✉️ {item.email}</Text>
      ) : null}
      {item.telefono ? (
        <Text style={[styles.cardMeta, { color: theme.muted }]}>📞 {item.telefono}</Text>
      ) : null}
      {item.instagram_handle ? (
        <Text style={[styles.cardMeta, { color: theme.muted }]}>📸 @{item.instagram_handle}</Text>
      ) : null}

      <View style={styles.badgeRow}>
        {item.comision_fija_menudeo != null && (
          <Badge text={`Menudeo ${item.comision_fija_menudeo}%`} color="primary" size="sm" />
        )}
        {item.comision_fija_mayoreo != null && (
          <Badge text={`Mayoreo ${item.comision_fija_mayoreo}%`} color="secondary" size="sm" />
        )}
      </View>

      {item.escuela?.nombre ? (
        <Text style={[styles.cardSchool, { color: theme.muted }]}>🏫 {item.escuela.nombre}</Text>
      ) : null}
    </Pressable>
  );
}

export default function VendedoresScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendedores();
      setVendedores(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getVendedores();
      setVendedores(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return vendedores;
    const q = search.toLowerCase();
    return vendedores.filter((v) => v.nombre_completo.toLowerCase().includes(q));
  }, [vendedores, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteVendedor(deleteId);
      setVendedores((prev) => prev.filter((v) => v.id_vendedor !== deleteId));
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  if (loading && vendedores.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Vendedores</Text>
        </View>
        <LoadingSpinner fullScreen message="Cargando vendedores..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Vendedores</Text>
        <Text style={[styles.count, { color: theme.muted }]}>{filtered.length} registros</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por nombre..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id_vendedor)}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => (
          <VendedorCard
            item={item}
            onPress={() => router.push(`/vendedores/${item.id_vendedor}`)}
            onDelete={() => setDeleteId(item.id_vendedor)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-tie"
            title="Sin vendedores"
            message={
              search ? 'No hay vendedores que coincidan.' : 'Aún no hay vendedores registrados.'
            }
            actionLabel={!search ? 'Agregar vendedor' : undefined}
            onAction={!search ? () => router.push('/vendedores/create') : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, Shadows.lg]}
        onPress={() => router.push('/vendedores/create')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Nuevo vendedor"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar vendedor"
        message="¿Deseas eliminar este vendedor? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h3 },
  count: { ...Typography.bodySmall },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: { ...Typography.h4, flex: 1 },
  deleteIcon: { fontSize: 18 },
  cardMeta: { ...Typography.caption },
  cardSchool: { ...Typography.caption, marginTop: Spacing.xs },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, color: '#ffffff', lineHeight: 32 },
});
