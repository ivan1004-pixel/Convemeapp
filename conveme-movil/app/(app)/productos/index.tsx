import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getProductos } from '@/src/services/producto.service';
import { useProductosStore } from '@/src/store/productosStore';
import { useSearch } from '@/src/hooks/useSearch';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Card } from '@/src/components/ui/Card';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { formatCurrency } from '@/src/utils/formatters';
import { parseApiError } from '@/src/utils/errors';
import type { Producto } from '@/src/types/producto';

export default function ProductosScreen() {
  const router = useRouter();
  const { productos, setProductos, isLoading, setLoading, setError } = useProductosStore();
  const { can } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const { query, setQuery, filtered, clearSearch } = useSearch<Producto>(
    productos, ['nombre', 'sku']
  );

  const loadProductos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [setProductos, setLoading, setError]);

  useEffect(() => { loadProductos(); }, [loadProductos]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProductos();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Producto }) => (
    <Pressable onPress={() => router.push(`/(app)/productos/${item.id_producto}` as any)}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.price}>{formatCurrency(item.precio_unitario)}</Text>
        </View>
        <Text style={styles.sku}>SKU: {item.sku}</Text>
        {item.categoria && <Badge label={item.categoria.nombre} size="small" />}
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Productos</Text>
        {can('productos:write') && (
          <Button
            title="+ Nuevo"
            onPress={() => router.push('/(app)/productos/create' as any)}
            size="small"
          />
        )}
      </View>
      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={clearSearch}
          placeholder="Buscar por nombre o SKU..."
        />
      </View>
      {isLoading && !refreshing ? (
        <LoadingSpinner message="Cargando productos..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id_producto.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState title="Sin productos" icon="🛍️" />}
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
  nombre: { ...Typography.label, color: Colors.text, flex: 1, marginRight: 8 },
  price: { ...Typography.label, color: Colors.success, fontWeight: '700' },
  sku: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 6 },
});
