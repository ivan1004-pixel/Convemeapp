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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getProductos, deleteProducto } from '../../../src/services/producto.service';
import { useProductoStore } from '../../../src/store/productoStore';
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
import { formatCurrency, parseGraphQLError } from '../../../src/utils';
import type { Producto } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - COLUMN_GAP) / 2;

function ProductoCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Producto;
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
        styles.productCard,
        { backgroundColor: theme.card, borderColor: theme.border, width: CARD_WIDTH },
        Shadows.sm,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.productEmoji}>
        <Text style={styles.productEmojiText}>🛍️</Text>
      </View>
      {item.categoria && (
        <Badge text={item.categoria.nombre} color="primary" size="sm" style={styles.categoryBadge} />
      )}
      <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
        {item.nombre}
      </Text>
      <Text style={[styles.productSku, { color: theme.muted }]} numberOfLines={1}>
        {item.sku}
      </Text>
      <Text style={[styles.productPrice, { color: Colors.primary }]}>
        {formatCurrency(item.precio_unitario)}
      </Text>
      {item.precio_mayoreo > 0 && (
        <Text style={[styles.productMayoreo, { color: theme.muted }]}>
          M: {formatCurrency(item.precio_mayoreo)}
        </Text>
      )}
    </Pressable>
  );
}

export default function ProductosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { productos, setProductos, removeProducto } = useProductoStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [setProductos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, [setProductos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return productos;
    const q = search.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoria?.nombre.toLowerCase().includes(q)
    );
  }, [productos, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteProducto(deleteId);
      removeProducto(deleteId);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeProducto]);

  const deleteTarget = productos.find((p) => p.id_producto === deleteId);

  if (loading && productos.length === 0) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Productos</Text>
              <Text style={styles.subtitle}>Cargando artículos...</Text>
            </View>
          </View>
          <LoadingSpinner fullScreen message="Cargando productos..." />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Productos</Text>
                    <Text style={styles.subtitle}>{filtered.length} artículos</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/productos/create')} style={styles.addBtn}>
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
            placeholder="Buscar por nombre, SKU..."
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_producto)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listEmpty,
          ]}
          renderItem={({ item }) => (
            <ProductoCard
              item={item}
              onPress={() => router.push(`/productos/${item.id_producto}`)}
              onLongPress={() => setDeleteId(item.id_producto)}
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
              icon="shopping"
              title="Sin productos"
              message={
                search
                  ? 'No hay productos que coincidan con tu búsqueda.'
                  : 'Aún no hay productos registrados.'
              }
              actionLabel={!search ? 'Agregar producto' : undefined}
              onAction={!search ? () => router.push('/productos/create') : undefined}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        <ConfirmDialog
          visible={deleteId !== null}
          title="Eliminar producto"
          message={`¿Deseas eliminar "${deleteTarget?.nombre ?? ''}"? Esta acción no se puede deshacer.`}
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActions: { flexDirection: 'row', gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  productCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.85 },
  productEmoji: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  productEmojiText: { fontSize: 24 },
  categoryBadge: { marginBottom: Spacing.xs },
  productName: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  productSku: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  productPrice: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  productMayoreo: {
    ...Typography.caption,
    marginTop: 2,
  },
});
