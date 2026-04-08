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
import Animated, { FadeInUp, Layout, FadeInRight } from 'react-native-reanimated';
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
import { useAuth, ROLE_ADMIN } from '../../../src/hooks/useAuth';

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: Colors.warning,
  CONFIRMADO: Colors.primary,
  ENTREGADO: Colors.success,
  CANCELADO: Colors.error,
};

function PedidoCard({
  item,
  index,
  onPress,
  onLongPress,
}: {
  item: Pedido;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const statusColor = ESTADO_BADGE[item.estado?.toUpperCase() ?? 'PENDIENTE'] ?? Colors.dark;

  return (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).duration(500).springify()}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>PEDIDO #{item.id_pedido}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.estado?.toUpperCase() ?? 'PENDIENTE'}</Text>
          </View>
        </View>

        <Text style={styles.cardAmount}>
          {formatCurrency(item.monto_total)}
        </Text>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account" size={16} color={Colors.dark} />
              <Text style={styles.cardMeta}>
                CLIENTE: {item.cliente?.nombre_completo?.toUpperCase() ?? 'SIN CLIENTE'}
              </Text>
          </View>
          <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={16} color={Colors.dark} />
              <Text style={styles.cardMeta}>
                FECHA: {formatDate(item.fecha_pedido).toUpperCase()}
              </Text>
          </View>
          {item.fecha_entrega_estimada && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="truck-delivery" size={16} color={Colors.dark} />
              <Text style={styles.cardMeta}>
                ENTREGA: {formatDate(item.fecha_entrega_estimada).toUpperCase()}
              </Text>
            </View>
          )}
          {item.anticipo != null && item.anticipo > 0 && (
            <View style={[styles.infoRow, styles.anticipoRow]}>
              <MaterialCommunityIcons name="cash-check" size={16} color={Colors.success} />
              <Text style={[styles.cardMeta, { color: Colors.success, fontWeight: '900' }]}>
                ANTICIPO: {formatCurrency(item.anticipo)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
           <Text style={styles.footerAction}>VER DETALLES</Text>
           <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.dark} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function PedidosScreen() {
  const { usuario, isAdmin } = useAuth();

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
      setPedidos(data || []);
    } catch (err) {
      Alert.alert('No se pudieron cargar los pedidos', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [setPedidos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getPedidos();
      setPedidos(data || []);
    } catch (err) {
      Alert.alert('No se pudieron actualizar los pedidos', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, [setPedidos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    let list = pedidos;
    if (!isAdmin) {
      list = pedidos.filter(p => 
        p.vendedor?.id_vendedor === usuario?.id_vendedor || 
        p.id_vendedor === usuario?.id_vendedor
      );
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.cliente?.nombre_completo?.toLowerCase().includes(q) ||
        String(p.id_pedido).includes(q) ||
        p.estado?.toLowerCase().includes(q)
    );
  }, [pedidos, search, isAdmin, usuario]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deletePedido(deleteId);
      removePedido(deleteId);
    } catch (err) {
      Alert.alert('No se pudo eliminar el pedido', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removePedido]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Animated.View entering={FadeInRight.duration(600)} style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>PEDIDOS</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/pedidos/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="BUSCAR POR CLIENTE, ESTADO..."
          />
        </Animated.View>

        {loading && pedidos.length === 0 ? (
            <LoadingSpinner message="CARGANDO PEDIDOS..." />
        ) : (
            <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_pedido)}
            contentContainerStyle={[
                styles.listContent,
                filtered.length === 0 && styles.listEmpty,
            ]}
            renderItem={({ item, index }) => (
                <PedidoCard
                item={item}
                index={index}
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
                    ? 'NO HAY RESULTADOS.'
                    : 'AÚN NO HAY PEDIDOS REGISTRADOS.'
                }
                actionLabel={!search && !isAdmin ? 'CREAR PEDIDO' : undefined}
                onAction={!search && !isAdmin ? () => router.push('/pedidos/create') : undefined}
                />
            }
            showsVerticalScrollIndicator={false}
            />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="ELIMINAR PEDIDO"
          message={`¿DESEAS ELIMINAR EL PEDIDO #${deleteId}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="ELIMINAR"
          destructive
          loading={deleting}
        />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 0 },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    elevation: 0,
  },
  cardPressed: {
    transform: [{translateY: 2}, {translateX: 2}], 
    shadowOffset: {width: 2, height: 2}
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardId: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  cardBody: {
    gap: 6,
    borderTopWidth: 2,
    borderTopColor: Colors.dark,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anticipoRow: {
    marginTop: 4,
    backgroundColor: Colors.success + '20',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: Colors.dark,
    paddingTop: Spacing.md,
  },
  footerAction: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 0.5,
  },
});