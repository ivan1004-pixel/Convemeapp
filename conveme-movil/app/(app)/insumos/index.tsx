import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getInsumos, deleteInsumo } from '../../../src/services/insumo.service';
import { useInsumoStore } from '../../../src/store/insumoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Badge } from '../../../src/components/ui/Badge';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Insumo } from '../../../src/types';

function InsumoCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Insumo;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const isLowStock =
    item.stock_minimo_alerta != null &&
    item.stock_actual != null &&
    item.stock_actual <= item.stock_minimo_alerta;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: isLowStock ? Colors.error : theme.border },
        Shadows.sm,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.cardContent}>
        <View style={[styles.cardIcon, { backgroundColor: isLowStock ? '#FEE2E2' : Colors.primaryLight }]}>
          <Text style={[styles.cardIconText, { color: isLowStock ? Colors.error : Colors.primary }]}>
            {isLowStock ? '⚠️' : '📦'}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardRow}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>
              {item.nombre}
            </Text>
            {isLowStock && <Badge text="Stock bajo" color="error" size="sm" />}
          </View>
          <Text style={[styles.cardMeta, { color: theme.muted }]}>
            {item.unidad_medida}
          </Text>
          <View style={styles.cardStock}>
            <Text style={[styles.cardStockLabel, { color: theme.muted }]}>Stock: </Text>
            <Text
              style={[
                styles.cardStockValue,
                { color: isLowStock ? Colors.error : theme.text },
              ]}
            >
              {item.stock_actual ?? 0}
            </Text>
            {item.stock_minimo_alerta != null && (
              <Text style={[styles.cardStockMin, { color: theme.muted }]}>
                {' '}/ mín {item.stock_minimo_alerta}
              </Text>
            )}
          </View>
        </View>
        <Text style={[styles.chevron, { color: theme.muted }]}>›</Text>
      </View>
    </Pressable>
  );
}

export default function InsumosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { insumos, setInsumos, removeInsumo } = useInsumoStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [setInsumos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, [setInsumos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return insumos;
    const q = search.toLowerCase();
    return insumos.filter(
      (i) =>
        i.nombre.toLowerCase().includes(q) ||
        i.unidad_medida?.toLowerCase().includes(q)
    );
  }, [insumos, search]);

  const lowStockCount = useMemo(
    () =>
      insumos.filter(
        (i) => i.stock_minimo_alerta != null && i.stock_actual != null && i.stock_actual <= i.stock_minimo_alerta
      ).length,
    [insumos]
  );

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteInsumo(deleteId);
      removeInsumo(deleteId);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeInsumo]);

  const deleteTarget = insumos.find((i) => i.id_insumo === deleteId);

  if (loading && insumos.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Insumos</Text>
        </View>
        <LoadingSpinner fullScreen message="Cargando insumos..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Insumos</Text>
        <View style={styles.headerRight}>
          {lowStockCount > 0 && (
            <Badge text={`${lowStockCount} bajo stock`} color="error" size="sm" />
          )}
          <Text style={[styles.count, { color: theme.muted }]}>{filtered.length}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o unidad..."
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id_insumo)}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => (
          <InsumoCard
            item={item}
            onPress={() => router.push(`/insumos/${item.id_insumo}`)}
            onLongPress={() => setDeleteId(item.id_insumo)}
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
            title="Sin insumos"
            message={search ? 'No hay resultados para tu búsqueda.' : 'Aún no hay insumos registrados.'}
            actionLabel="Agregar insumo"
            onAction={() => router.push('/insumos/create')}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/insumos/create')}
        activeOpacity={0.85}
        accessibilityLabel="Agregar insumo"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar insumo"
        message={`¿Deseas eliminar "${deleteTarget?.nombre ?? ''}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.h2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  count: {
    ...Typography.bodySmall,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardName: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
  cardMeta: {
    ...Typography.bodySmall,
  },
  cardStock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStockLabel: {
    ...Typography.bodySmall,
  },
  cardStockValue: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  cardStockMin: {
    ...Typography.caption,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
  },
});
