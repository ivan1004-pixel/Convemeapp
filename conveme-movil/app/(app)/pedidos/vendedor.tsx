import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, Layout, FadeInRight } from 'react-native-reanimated';
import { getPedidos } from '../../../src/services/pedido.service';
import { usePedidoStore } from '../../../src/store/pedidoStore';
import { Colors } from '../../../src/theme/colors';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Pedido } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { useAuth } from '../../../src/hooks/useAuth';

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: Colors.warning,
  CONFIRMADO: Colors.primary,
  ENTREGADO: Colors.success,
  CANCELADO: Colors.error,
};

function PedidoCard({ item, index, onPress }: { item: Pedido; index: number; onPress: () => void }) {
  const statusColor = ESTADO_BADGE[item.estado?.toUpperCase() ?? 'PENDIENTE'] ?? Colors.dark;

  return (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).duration(500).springify()}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>PEDIDO #{item.id_pedido}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.estado?.toUpperCase() ?? 'PENDIENTE'}</Text>
          </View>
        </View>

        <Text style={styles.cardAmount}>{formatCurrency(item.monto_total)}</Text>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account" size={16} color={Colors.dark} />
              <Text style={styles.cardMeta}>CLIENTE: {item.cliente?.nombre_completo?.toUpperCase() ?? 'SIN CLIENTE'}</Text>
          </View>
          <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={16} color={Colors.dark} />
              <Text style={styles.cardMeta}>FECHA: {formatDate(item.fecha_pedido).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
           <Text style={styles.footerAction}>VER DETALLES</Text>
           <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.dark} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function VendedorPedidosScreen() {
  const { usuario } = useAuth();
  const { pedidos, setPedidos } = usePedidoStore();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPedidos();
      // Filtrar por el vendedor logueado usando id_vendedor
      const myPedidos = data.filter(p => 
        p.vendedor?.id_vendedor === usuario?.id_vendedor || 
        p.id_vendedor === usuario?.id_vendedor
      );
      setPedidos(myPedidos);
    } catch (err) {
      console.error(parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [usuario, setPedidos]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return pedidos;
    const q = search.toLowerCase();
    return pedidos.filter(
      (p) =>
        p.cliente?.nombre_completo?.toLowerCase().includes(q) ||
        String(p.id_pedido).includes(q)
    );
  }, [pedidos, search]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Animated.View entering={FadeInRight.duration(600)} style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>MIS PEDIDOS</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/pedidos/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.searchContainer}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="BUSCAR POR CLIENTE..." />
        </Animated.View>

        {loading && pedidos.length === 0 ? (
            <LoadingSpinner message="CARGANDO..." />
        ) : (
            <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_pedido)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
                <PedidoCard item={item} index={index} onPress={() => router.push(`/pedidos/${item.id_pedido}`)} />
            )}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={Colors.primary} />}
            ListEmptyComponent={
                <EmptyState
                icon="package-variant"
                title="SIN PEDIDOS"
                message="AÚN NO TIENES PEDIDOS REGISTRADOS."
                actionLabel="CREAR PEDIDO"
                onAction={() => router.push('/pedidos/create')}
                />
            }
            />
        )}
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
  title: { fontSize: 24, fontWeight: '900', color: Colors.dark, textTransform: 'uppercase' },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1 },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1 },
  cardPressed: { transform: [{translateY: 2}, {translateX: 2}], shadowOffset: {width: 2, height: 2} },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardId: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 2, borderColor: Colors.dark },
  statusText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  cardAmount: { fontSize: 24, fontWeight: '900', color: Colors.dark, marginBottom: Spacing.md },
  cardBody: { gap: 6, borderTopWidth: 2, borderTopColor: Colors.dark, paddingTop: Spacing.md, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardMeta: { fontSize: 12, fontWeight: '700', color: Colors.dark },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 2, borderTopColor: Colors.dark, paddingTop: Spacing.md },
  footerAction: { fontSize: 11, fontWeight: '900', color: Colors.dark, letterSpacing: 0.5 },
});
