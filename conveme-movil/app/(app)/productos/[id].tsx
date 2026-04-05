import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProductosStore } from '@/src/store/productosStore';
import { deleteProducto } from '@/src/services/producto.service';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { Divider } from '@/src/components/ui/Divider';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { formatCurrency } from '@/src/utils/formatters';
import { parseApiError } from '@/src/utils/errors';

export default function ProductoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { productos, removeProducto } = useProductosStore();
  const { can } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);

  const producto = productos.find((p) => p.id_producto === Number(id));

  const handleDelete = () => {
    if (!producto) return;
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteProducto(producto.id_producto);
              removeProducto(producto.id_producto);
              router.back();
            } catch (err) {
              Alert.alert('Error', parseApiError(err));
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!producto) return <LoadingSpinner fullScreen message="Cargando..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
        <View style={styles.navActions}>
          {can('productos:write') && (
            <Button
              title="Editar"
              onPress={() => router.push(`/(app)/productos/${producto.id_producto}/edit` as any)}
              variant="outline"
              size="small"
              style={styles.editBtn}
            />
          )}
          {can('productos:delete') && (
            <Button
              title="Eliminar"
              onPress={handleDelete}
              variant="danger"
              size="small"
              loading={isDeleting}
            />
          )}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.mainCard}>
          <Text style={styles.nombre}>{producto.nombre}</Text>
          <Text style={styles.sku}>SKU: {producto.sku}</Text>
          <Text style={styles.price}>{formatCurrency(producto.precio_unitario)}</Text>
          {producto.categoria && (
            <View style={styles.badge}>
              <Badge label={producto.categoria.nombre} />
            </View>
          )}
          {producto.tamano && (
            <View style={styles.badge}>
              <Badge label={producto.tamano.descripcion} variant="secondary" />
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Precio unitario</Text>
            <Text style={styles.infoValue}>{formatCurrency(producto.precio_unitario)}</Text>
          </View>
          {producto.precio_mayoreo !== undefined && (
            <>
              <Divider />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Precio mayoreo</Text>
                <Text style={styles.infoValue}>{formatCurrency(producto.precio_mayoreo)}</Text>
              </View>
            </>
          )}
          {producto.cantidad_minima_mayoreo !== undefined && (
            <>
              <Divider />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mínimo mayoreo</Text>
                <Text style={styles.infoValue}>{producto.cantidad_minima_mayoreo} uds</Text>
              </View>
            </>
          )}
          {producto.costo_produccion !== undefined && (
            <>
              <Divider />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Costo producción</Text>
                <Text style={styles.infoValue}>{formatCurrency(producto.costo_produccion)}</Text>
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  navBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  backBtn: { padding: 4 },
  backText: { ...Typography.body, color: Colors.primary },
  navActions: { flexDirection: 'row', gap: 8 },
  editBtn: { marginRight: 0 },
  scroll: { padding: Spacing.screenPadding, paddingTop: 0, paddingBottom: 40 },
  mainCard: { marginBottom: Spacing.sm },
  nombre: { ...Typography.h2, color: Colors.text, marginBottom: 4 },
  sku: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 8 },
  price: { ...Typography.stat, color: Colors.success, marginBottom: 12 },
  badge: { marginBottom: 4 },
  section: { marginBottom: Spacing.sm },
  sectionTitle: {
    ...Typography.label, color: Colors.textSecondary, marginBottom: 12,
    textTransform: 'uppercase', fontSize: 11,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { ...Typography.body, color: Colors.textSecondary },
  infoValue: { ...Typography.body, color: Colors.text, fontWeight: '600' },
});
