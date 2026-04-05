import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getVentas } from '@/src/services/venta.service';
import { useVentasStore } from '@/src/store/ventasStore';
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
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { parseApiError } from '@/src/utils/errors';
import type { Venta } from '@/src/types/venta';

export default function VentasScreen() {
  const router = useRouter();
  const { ventas, setVentas, isLoading, setLoading, setError } = useVentasStore();
  const { can } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const { query, setQuery, filtered, clearSearch } = useSearch<Venta>(
    ventas, ['estado', 'metodo_pago']
  );

  const loadVentas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVentas();
      setVentas(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [setVentas, setLoading, setError]);

  useEffect(() => { loadVentas(); }, [loadVentas]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVentas();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Venta }) => (
    <Pressable onPress={() => router.push(`/(app)/ventas/${item.id_venta}` as any)}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.ventaId}>Venta #{item.id_venta}</Text>
          {item.estado && <StatusBadge status={item.estado} size="small" />}
        </View>
        <Text style={styles.amount}>{formatCurrency(item.monto_total)}</Text>
        <View style={styles.cardFooter}>
          {item.fecha_venta && (
            <Text style={styles.date}>{formatDate(item.fecha_venta)}</Text>
          )}
          {item.vendedor && (
            <Text style={styles.vendedor}>{item.vendedor.nombre_completo}</Text>
          )}
        </View>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ventas</Text>
        {can('ventas:write') && (
          <Button
            title="+ Nueva"
            onPress={() => router.push('/(app)/ventas/create' as any)}
            size="small"
          />
        )}
      </View>
      <View style={styles.searchContainer}>
        <SearchBar value={query} onChangeText={setQuery} onClear={clearSearch} placeholder="Buscar ventas..." />
      </View>
      {isLoading && !refreshing ? (
        <LoadingSpinner message="Cargando ventas..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id_venta.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              title="Sin ventas"
              message="No se encontraron ventas"
              icon="💸"
              actionText={can('ventas:write') ? 'Crear venta' : undefined}
              onAction={can('ventas:write') ? () => router.push('/(app)/ventas/create' as any) : undefined}
            />
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
  ventaId: { ...Typography.label, color: Colors.text },
  amount: { ...Typography.price, color: Colors.success },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  date: { ...Typography.caption, color: Colors.textSecondary },
  vendedor: { ...Typography.caption, color: Colors.textSecondary },
});
