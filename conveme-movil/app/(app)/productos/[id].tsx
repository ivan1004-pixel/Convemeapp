import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getProductos, deleteProducto } from '../../../src/services/producto.service';
import { useProductoStore } from '../../../src/store/productoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, parseGraphQLError } from '../../../src/utils';
import type { Producto } from '../../../src/types';

function DetailRow({ label, value }: { label: string; value: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.label, { color: theme.muted }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light2.border,
  },
  label: { ...Typography.bodySmall },
  value: {
    ...Typography.bodySmall,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: Spacing.sm,
  },
});

export default function ProductoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

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
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }, [productoId, removeProducto]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingSpinner fullScreen message="Cargando producto..." />
      </SafeAreaView>
    );
  }

  if (!producto) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Producto</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.notFound}>
          <Text style={{ ...Typography.body, color: theme.muted }}>Producto no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {producto.nombre}
        </Text>
        <Pressable
          onPress={() => setShowDelete(true)}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel="Eliminar producto"
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroEmoji}>
              <Text style={styles.heroEmojiText}>🛍️</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: theme.text }]}>{producto.nombre}</Text>
              <Text style={[styles.heroSku, { color: theme.muted }]}>SKU: {producto.sku}</Text>
              {producto.categoria && (
                <Badge
                  text={producto.categoria.nombre}
                  color="primary"
                  size="sm"
                  style={styles.heroBadge}
                />
              )}
              {producto.tamano && (
                <Badge
                  text={producto.tamano.descripcion}
                  color="secondary"
                  size="sm"
                  style={styles.heroBadge}
                />
              )}
            </View>
          </View>
        </Card>

        {/* Pricing Card */}
        <Card title="Precios" style={styles.sectionCard}>
          <View style={styles.priceGrid}>
            <View style={[styles.priceItem, { borderColor: theme.border }]}>
              <Text style={[styles.priceLabel, { color: theme.muted }]}>Menudeo</Text>
              <Text style={[styles.priceValue, { color: Colors.primary }]}>
                {formatCurrency(producto.precio_unitario)}
              </Text>
            </View>
            {producto.precio_mayoreo > 0 && (
              <View style={[styles.priceItem, { borderColor: theme.border }]}>
                <Text style={[styles.priceLabel, { color: theme.muted }]}>Mayoreo</Text>
                <Text style={[styles.priceValue, { color: Colors.success }]}>
                  {formatCurrency(producto.precio_mayoreo)}
                </Text>
              </View>
            )}
            {producto.costo_produccion != null && producto.costo_produccion > 0 && (
              <View style={[styles.priceItem, { borderColor: theme.border }]}>
                <Text style={[styles.priceLabel, { color: theme.muted }]}>Costo</Text>
                <Text style={[styles.priceValue, { color: Colors.warning }]}>
                  {formatCurrency(producto.costo_produccion)}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Details Card */}
        <Card title="Detalles" style={styles.sectionCard}>
          <DetailRow label="SKU" value={producto.sku} />
          <DetailRow label="Categoría" value={producto.categoria?.nombre ?? 'Sin categoría'} />
          <DetailRow label="Tamaño" value={producto.tamano?.descripcion ?? 'No especificado'} />
          {producto.cantidad_minima_mayoreo != null && (
            <DetailRow
              label="Mín. mayoreo"
              value={`${producto.cantidad_minima_mayoreo} unidades`}
            />
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Editar"
            variant="outline"
            onPress={() => router.push(`/productos/create?id=${producto.id_producto}`)}
            style={styles.actionBtn}
          />
          <Button
            title="Eliminar"
            variant="danger"
            onPress={() => setShowDelete(true)}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showDelete}
        title="Eliminar producto"
        message={`¿Deseas eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  backIcon: { fontSize: 22, color: Colors.primary },
  title: { ...Typography.h4, flex: 1 },
  headerPlaceholder: { width: 32 },
  deleteBtn: { padding: Spacing.xs },
  deleteIcon: { fontSize: 20 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heroCard: { marginBottom: Spacing.md },
  heroContent: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  heroEmoji: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmojiText: { fontSize: 32 },
  heroInfo: { flex: 1 },
  heroName: { ...Typography.h4, marginBottom: Spacing.xs },
  heroSku: { ...Typography.caption, marginBottom: Spacing.sm },
  heroBadge: { marginBottom: Spacing.xs },
  sectionCard: { marginBottom: Spacing.md },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  priceItem: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  priceLabel: { ...Typography.caption, marginBottom: Spacing.xs },
  priceValue: { ...Typography.bodySmall, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
