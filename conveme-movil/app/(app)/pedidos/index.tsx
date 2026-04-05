import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getPedidos } from '@/src/services/pedido.service';
import { usePedidosStore } from '@/src/store/pedidosStore';
import { useSearch } from '@/src/hooks/useSearch';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Card } from '@/src/components/ui/Card';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { formatDate } from '@/src/utils/formatters';
import { parseApiError } from '@/src/utils/errors';
import type { Pedido } from '@/src/types/pedido';

export default function PedidosScreen() {
  const router = useRouter();
  const { pedidos, setPedidos, isLoading, setLoading, setError } = usePedidosStore();
  const { can } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const { query, setQuery, filtered, clearSearch } = useSearch<Pedido>(pedidos, ['estado']);

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPedidos();
      setPedidos(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [setPedidos, setLoading, setError]);

  useEffect(() => { loadPedidos(); }, [loadPedidos]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPedidos();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Pedido }) => (
    <Pressable onPress={() => router.push(`/(app)/pedidos/${item.id_pedido}` as any)}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.pedidoId}>Pedido #{item.id_pedido}</Text>
          <StatusBadge status={item.estado} size="small" />
        </View>
        {item.cliente && <Text style={styles.cliente}>{item.cliente.nombre_completo}</Text>}
        <View style={styles.cardFooter}>
          {item.fecha_pedido && <Text style={styles.date}>{formatDate(item.fecha_pedido)}</Text>}
          {item.fecha_entrega && (
            <Text style={styles.date}>Entrega: {formatDate(item.fecha_entrega)}</Text>
          )}
        </View>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos</Text>
        {can('pedidos:write') && (
          <Button
            title="+ Nuevo"
            onPress={() => router.push('/(app)/pedidos/create' as any)}
            size="small"
          />
        )}
      </View>
      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={clearSearch}
          placeholder="Buscar pedidos..."
        />
      </View>
      {isLoading && !refreshing ? (
        <LoadingSpinner message="Cargando pedidos..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id_pedido.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState title="Sin pedidos" message="No se encontraron pedidos" icon="📦" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.screenPadding, paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h1, color: Colors.text },
  searchContainer: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.sm },
  list: { padding: Spacing.screenPadding, paddingTop: 0, paddingBottom: 32 },
  card: { marginBottom: Spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pedidoId: { ...Typography.label, color: Colors.text },
  cliente: { ...Typography.body, color: Colors.text, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  date: { ...Typography.caption, color: Colors.textSecondary },
});
