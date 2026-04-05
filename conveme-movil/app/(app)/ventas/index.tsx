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
import { getVentas, deleteVenta } from '../../../src/services/venta.service';
import { useVentaStore } from '../../../src/store/ventaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Venta } from '../../../src/types';

const ESTADO_BADGE: Record<string, 'warning' | 'success' | 'error' | 'primary'> = {
  Pendiente: 'warning',
  Completada: 'success',
  Cancelada: 'error',
};

function VentaCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Venta;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <Pressable
    onPress={onPress}
    onLongPress={onLongPress}
    style={({ pressed }) => [
      styles.card,
      { backgroundColor: theme.card, borderColor: theme.border },
      Shadows.sm,
      pressed && styles.cardPressed,
    ]}
    accessibilityRole="button"
    >
    <View style={styles.cardHeader}>
    <Text style={[styles.cardId, { color: theme.muted }]}>Venta #{item.id_venta}</Text>
    <Badge
    text={item.estado ?? 'Pendiente'}
    color={ESTADO_BADGE[item.estado ?? 'Pendiente'] ?? 'secondary'}
    size="sm"
    />
    </View>

    <Text style={[styles.cardAmount, { color: theme.text }]}>
    {formatCurrency(item.monto_total)}
    </Text>

    <View style={styles.cardRow}>
    <View style={styles.cardColumn}>
    <Text style={[styles.cardLabel, { color: theme.muted }]}>Vendedor</Text>
    <Text style={[styles.cardValue, { color: theme.text }]}>
    {item.vendedor?.nombre_completo ?? 'Sin vendedor'}
    </Text>
    </View>
    {item.cliente && (
      <View style={styles.cardColumn}>
      <Text style={[styles.cardLabel, { color: theme.muted }]}>Cliente</Text>
      <Text style={[styles.cardValue, { color: theme.text }]}>
      {item.cliente.nombre_completo}
      </Text>
      </View>
    )}
    </View>

    <View style={styles.cardFooter}>
    <Text style={[styles.cardMeta, { color: theme.muted }]}>
    {formatDate(item.fecha_venta)}
    </Text>
    {item.metodo_pago && (
      <Text style={[styles.cardMeta, { color: theme.muted }]}>
      {item.metodo_pago}
      </Text>
    )}
    </View>

    {item.detalles && item.detalles.length > 0 && (
      <Text style={[styles.cardProducts, { color: theme.muted }]}>
      {item.detalles.length} producto{item.detalles.length !== 1 ? 's' : ''}
      </Text>
    )}
    </Pressable>
  );
}

export default function VentasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { ventas, setVentas, removeVenta } = useVentaStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVentas();
      setVentas(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [setVentas]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getVentas();
      setVentas(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, [setVentas]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ventas;
    const q = search.toLowerCase();
    return ventas.filter(
      (v) =>
      v.vendedor?.nombre_completo?.toLowerCase().includes(q) ||
      String(v.id_venta).includes(q) ||
      v.estado?.toLowerCase().includes(q)
    );
  }, [ventas, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteVenta(deleteId);
      removeVenta(deleteId);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeVenta]);

  if (loading && ventas.length === 0) {
    return (
      <NeobrutalistBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
      <Text style={[styles.title, { color: theme.text }]}>Ventas</Text>
      </View>
      <LoadingSpinner fullScreen message="Cargando ventas..." />
      </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  return (
    <NeobrutalistBackground>
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
    <View style={styles.header}>
    <Text style={[styles.title, { color: theme.text }]}>Ventas</Text>
    <Text style={[styles.count, { color: theme.muted }]}>{filtered.length} registros</Text>
    </View>

    <View style={styles.searchContainer}>
    <SearchBar
    value={search}
    onChangeText={setSearch}
    placeholder="Buscar por vendedor, estado..."
    />
    </View>

    <FlatList
    data={filtered}
    keyExtractor={(item) => String(item.id_venta)}
    contentContainerStyle={[
      styles.listContent,
      filtered.length === 0 && styles.listEmpty,
    ]}
    renderItem={({ item }) => (
      <VentaCard
      item={item}
      onPress={() => router.push(`/ventas/${item.id_venta}`)}
      onLongPress={() => setDeleteId(item.id_venta)}
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
      icon="cash-multiple"
      title="Sin ventas"
      message={
        search ? 'No hay ventas que coincidan con tu búsqueda.' : 'Aún no hay ventas registradas.'
      }
      actionLabel={!search ? 'Registrar venta' : undefined}
      onAction={!search ? () => router.push('/ventas/create') : undefined}
      />
    }
    showsVerticalScrollIndicator={false}
    />

    <TouchableOpacity
    style={[styles.fab, Shadows.lg]}
    onPress={() => router.push('/ventas/create')}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel="Nueva venta"
    >
    <Text style={styles.fabIcon}>+</Text>
    </TouchableOpacity>

    <ConfirmDialog
    visible={deleteId !== null}
    title="Eliminar venta"
    message={`¿Deseas eliminar la venta #${deleteId}? Esta acción no se puede deshacer.`}
    onConfirm={handleDelete}
    onCancel={() => setDeleteId(null)}
    confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
    destructive
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.h3,
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
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardId: {
    ...Typography.bodySmall,
  },
  cardAmount: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardColumn: {
    flex: 1,
  },
  cardLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  cardValue: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  cardMeta: {
    ...Typography.caption,
  },
  cardProducts: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
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
  fabIcon: {
    fontSize: 28,
    color: '#ffffff',
    lineHeight: 32,
  },
});
