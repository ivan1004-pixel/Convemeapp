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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPedidos, deletePedido } from '../../../src/services/pedido.service';
import { usePedidoStore } from '../../../src/store/pedidoStore';
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
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Pedido } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

const ESTADO_BADGE: Record<string, 'warning' | 'primary' | 'success' | 'error'> = {
  Pendiente: 'warning',
  Confirmado: 'primary',
  Entregado: 'success',
  Cancelado: 'error',
};

function PedidoCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Pedido;
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
        <Text style={[styles.cardId, { color: theme.muted }]}>Pedido #{item.id_pedido}</Text>
        <Badge
          text={item.estado ?? 'Pendiente'}
          color={ESTADO_BADGE[item.estado ?? 'Pendiente'] ?? 'secondary'}
          size="sm"
        />
      </View>
      <Text style={[styles.cardAmount, { color: theme.text }]}>
        {formatCurrency(item.monto_total)}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>
          👤 {item.cliente?.nombre_completo ?? 'Sin cliente'}
        </Text>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>
          📅 {formatDate(item.fecha_pedido)}
        </Text>
      </View>
      {item.fecha_entrega_estimada && (
        <Text style={[styles.cardMeta, { color: theme.muted, marginTop: Spacing.xs }]}>
          🚚 Entrega: {formatDate(item.fecha_entrega_estimada)}
        </Text>
      )}
      {item.anticipo != null && item.anticipo > 0 && (
        <Text style={[styles.cardMeta, { color: Colors.success, marginTop: Spacing.xs }]}>
          💵 Anticipo: {formatCurrency(item.anticipo)}
        </Text>
      )}
    </Pressable>
  );
}

export default function PedidosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { pedidos, setPedidos, removePedido } = usePedidoStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPedidos();
      setPedidos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [setPedidos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getPedidos();
      setPedidos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, [setPedidos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return pedidos;
    const q = search.toLowerCase();
    return pedidos.filter(
      (p) =>
        p.cliente?.nombre_completo?.toLowerCase().includes(q) ||
        String(p.id_pedido).includes(q) ||
        p.estado?.toLowerCase().includes(q)
    );
  }, [pedidos, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deletePedido(deleteId);
      removePedido(deleteId);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removePedido]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Pedidos</Text>
                <Text style={styles.subtitle}>{pedidos.length} registros</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/pedidos/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="BUSCAR POR CLIENTE, ESTADO..."
          />
        </View>

        {loading && pedidos.length === 0 ? (
            <LoadingSpinner message="Cargando pedidos..." />
        ) : (
            <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_pedido)}
            contentContainerStyle={[
                styles.listContent,
                filtered.length === 0 && styles.listEmpty,
            ]}
            renderItem={({ item }) => (
                <PedidoCard
                item={item}
                onPress={() => router.push(`/pedidos/${item.id_pedido}`)}
                onLongPress={() => setDeleteId(item.id_pedido)}
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
                icon="package-variant"
                title="SIN PEDIDOS"
                message={
                    search
                    ? 'No hay pedidos que coincidan con tu búsqueda.'
                    : 'Aún no hay pedidos registrados.'
                }
                actionLabel={!search ? 'CREAR PEDIDO' : undefined}
                onAction={!search ? () => router.push('/pedidos/create') : undefined}
                />
            }
            showsVerticalScrollIndicator={false}
            />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="Eliminar pedido"
          message={`¿Deseas eliminar el pedido #${deleteId}? Esta acción no se puede deshacer.`}
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
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
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardId: { ...Typography.bodySmall },
  cardAmount: { ...Typography.h4, marginBottom: Spacing.sm },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  cardMeta: { ...Typography.caption },
  fab: { display: 'none' },
  fabIcon: { display: 'none' },
});