import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getProductos, deleteProducto } from '../../../src/services/producto.service';
import { useProductoStore } from '../../../src/store/productoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { formatCurrency, parseGraphQLError } from '../../../src/utils';
import type { Producto } from '../../../src/types';

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.labelContainer}>
        {icon && <MaterialCommunityIcons name={icon as any} size={16} color="rgba(0,0,0,0.4)" style={{ marginRight: 6 }} />}
        <Text style={rowStyles.label}>{label}</Text>
      </View>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  labelContainer: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' },
  value: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: Spacing.sm,
  },
});

export default function ProductoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { productos, setProductos, removeProducto } = useProductoStore();
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const productoId = Number(id);
  const producto: Producto | undefined = productos.find((p) => p.id_producto === productoId);

  const fetchIfNeeded = useCallback(async () => {
    if (!producto) {
      setLoading(true);
      try {
        const data = await getProductos();
        setProductos(data);
      } catch (err) {
        Alert.alert('Error', parseGraphQLError(err));
      } finally {
        setLoading(false);
      }
    }
  }, [producto, setProductos]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteProducto(productoId);
      removeProducto(productoId);
      router.push('/(app)');
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }, [productoId, removeProducto]);

  if (loading) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <LoadingSpinner fullScreen message="CARGANDO DETALLES..." />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  if (!producto) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>PRODUCTO</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <View style={styles.notFound}>
            <MaterialCommunityIcons name="package-variant-remove" size={64} color="rgba(0,0,0,0.1)" />
            <Text style={{ ...Typography.body, color: 'rgba(0,0,0,0.4)', fontWeight: '700', marginTop: 10 }}>PRODUCTO NO ENCONTRADO</Text>
          </View>
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            DETALLE PRODUCTO
          </Text>
          <TouchableOpacity
            onPress={() => setShowDelete(true)}
            style={styles.deleteHeaderBtn}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <MaterialCommunityIcons name="package-variant-closed" size={40} color={Colors.primary} />
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{producto.nombre.toUpperCase()}</Text>
                <Text style={styles.heroSku}>SKU: {producto.sku}</Text>
                <View style={styles.badgeRow}>
                    {producto.categoria && (
                        <Badge
                        text={producto.categoria.nombre.toUpperCase()}
                        color="primary"
                        size="sm"
                        />
                    )}
                    {producto.tamano && (
                        <Badge
                        text={producto.tamano.descripcion.toUpperCase()}
                        color="secondary"
                        size="sm"
                        />
                    )}
                </View>
              </View>
            </View>
          </View>

          {/* Pricing Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ESTRUCTURA DE PRECIOS</Text>
            <View style={styles.priceGrid}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>MENUDEO</Text>
                <Text style={[styles.priceValue, { color: Colors.primary }]}>
                  {formatCurrency(producto.precio_unitario)}
                </Text>
              </View>
              {producto.precio_mayoreo > 0 && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>MAYOREO</Text>
                  <Text style={[styles.priceValue, { color: Colors.success }]}>
                    {formatCurrency(producto.precio_mayoreo)}
                  </Text>
                </View>
              )}
              {producto.costo_produccion != null && producto.costo_produccion > 0 && (
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>COSTO</Text>
                  <Text style={[styles.priceValue, { color: Colors.warning }]}>
                    {formatCurrency(producto.costo_produccion)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ESPECIFICACIONES</Text>
            <DetailRow label="SKU / CÓDIGO" value={producto.sku} icon="barcode-scan" />
            <DetailRow label="CATEGORÍA" value={producto.categoria?.nombre?.toUpperCase() ?? 'SIN CATEGORÍA'} icon="shape-outline" />
            <DetailRow label="TAMAÑO / TALLA" value={producto.tamano?.descripcion?.toUpperCase() ?? 'NO ESPECIFICADO'} icon="ruler" />
            {producto.cantidad_minima_mayoreo != null && (
              <DetailRow
                label="MÍN. MAYOREO"
                value={`${producto.cantidad_minima_mayoreo} UNIDADES`}
                icon="account-group-outline"
              />
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="EDITAR PRODUCTO"
              onPress={() => router.push(`/productos/create?id=${producto.id_producto}`)}
              style={styles.actionBtn}
              variant="primary"
              size="lg"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.deleteFooterBtn}
            onPress={() => setShowDelete(true)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
            <Text style={styles.deleteFooterText}>ELIMINAR ESTE ARTÍCULO</Text>
          </TouchableOpacity>
        </ScrollView>

        <ConfirmDialog
          visible={showDelete}
          title="Eliminar producto"
          message={`¿Deseas eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          confirmText={deleting ? 'ELIMINANDO...' : 'ELIMINAR'}
          destructive
        />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.lg, 
    paddingTop: Spacing.md, 
    paddingBottom: Spacing.sm 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: '#FFF', 
    borderWidth: 2, 
    borderColor: Colors.dark, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: { ...Typography.h4, fontWeight: '900', color: Colors.dark },
  headerPlaceholder: { width: 40 },
  deleteHeaderBtn: { padding: Spacing.xs },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  heroCard: { 
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    elevation: 6
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroIconContainer: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '900', color: Colors.dark, marginBottom: 2 },
  heroSku: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', marginBottom: Spacing.sm },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.lg, 
    marginBottom: Spacing.lg, 
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 0.1, 
    elevation: 3 
  },
  sectionTitle: { 
    fontSize: 10,
    fontWeight: '900', 
    color: Colors.primary, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5, 
    marginBottom: Spacing.md 
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  priceItem: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  priceLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: '900' },
  actions: { marginTop: Spacing.sm },
  actionBtn: { 
    shadowColor: Colors.dark, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    elevation: 5 
  },
  deleteFooterBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: Spacing.xl, 
    gap: 8 
  },
  deleteFooterText: { 
    fontSize: 11, 
    fontWeight: '900', 
    color: Colors.error, 
    textDecorationLine: 'underline' 
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
});

