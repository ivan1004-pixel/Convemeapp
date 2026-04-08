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
        { backgroundColor: '#FFF', borderColor: Colors.dark, width: CARD_WIDTH },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.productIconContainer}>
        <MaterialCommunityIcons name="package-variant-closed" size={28} color={Colors.primary} />
      </View>
      {item.categoria && (
        <View style={styles.categoryBadgeContainer}>
            <Text style={styles.categoryBadgeText}>{item.categoria.nombre.toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.productName} numberOfLines={2}>
        {item.nombre.toUpperCase()}
      </Text>
      <Text style={styles.productSku} numberOfLines={1}>
        {item.sku}
      </Text>
      <View style={styles.priceContainer}>
        <Text style={styles.productPrice}>
            {formatCurrency(item.precio_unitario)}
        </Text>
        {item.precio_mayoreo > 0 && (
            <Text style={styles.productMayoreo}>
            M: {formatCurrency(item.precio_mayoreo)}
            </Text>
        )}
      </View>
    </Pressable>
  );
}

import { useAuth } from '../../../src/hooks/useAuth';

export default function ProductosScreen() {
  const { isAdmin } = useAuth();
  const colorScheme = useColorScheme();
  
  if (!isAdmin) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/(app)')} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <EmptyState 
            icon="shield-lock" 
            title="ACCESO DENEGADO" 
            message="No tienes permisos para ver esta sección." 
            actionLabel="VOLVER AL INICIO"
            onAction={() => router.replace('/(app)')}
          />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

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
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>PRODUCTOS</Text>
                    <Text style={styles.subtitle}>CARGANDO...</Text>
                </View>
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
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>PRODUCTOS</Text>
                    <Text style={styles.subtitle}>{filtered.length} ARTÍCULOS</Text>
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
            placeholder="BUSCAR POR NOMBRE, SKU..."
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
              icon="package-variant"
              title="Sin productos"
              message={
                search
                  ? 'No hay productos que coincidan con tu búsqueda.'
                  : 'Aún no hay productos registrados.'
              }
              actionLabel={!search ? 'AGREGAR PRODUCTO' : undefined}
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
          confirmText={deleting ? 'ELIMINANDO...' : 'ELIMINAR'}
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
  title: { fontSize: 22, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 5 },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140, // Espacio extra para que no estorbe la barra de abajo
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
    borderWidth: 2,
    padding: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  productIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  categoryBadgeContainer: { 
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.primary,
  },
  productName: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 2,
    lineHeight: 16,
  },
  productSku: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.4)',
    marginBottom: Spacing.sm,
  },
  priceContainer: {
      marginTop: 'auto',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  productMayoreo: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
    marginTop: 1,
  },
});

