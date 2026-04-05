import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVentasStore } from '@/src/store/ventasStore';
import { deleteVenta } from '@/src/services/venta.service';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { Divider } from '@/src/components/ui/Divider';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { formatCurrency, formatDate } from '@/src/utils/formatters';
import { parseApiError } from '@/src/utils/errors';

export default function VentaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { ventas, removeVenta } = useVentasStore();
  const { can } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);

  const venta = ventas.find((v) => v.id_venta === Number(id));

  const handleDelete = () => {
    Alert.alert(
      'Eliminar venta',
      '¿Estás seguro de que quieres eliminar esta venta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!venta) return;
            setIsDeleting(true);
            try {
              await deleteVenta(venta.id_venta);
              removeVenta(venta.id_venta);
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

  if (!venta) return <LoadingSpinner fullScreen message="Cargando..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
        {can('ventas:delete') && (
          <Button
            title="Eliminar"
            onPress={handleDelete}
            variant="danger"
            size="small"
            loading={isDeleting}
          />
        )}
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.ventaId}>Venta #{venta.id_venta}</Text>
            {venta.estado && <StatusBadge status={venta.estado} />}
          </View>
          <Text style={styles.amount}>{formatCurrency(venta.monto_total)}</Text>
          {venta.fecha_venta && (
            <Text style={styles.date}>{formatDate(venta.fecha_venta)}</Text>
          )}
        </Card>

        {venta.vendedor && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Vendedor</Text>
            <Text style={styles.sectionValue}>{venta.vendedor.nombre_completo}</Text>
          </Card>
        )}

        {venta.detalles && venta.detalles.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Productos</Text>
            {venta.detalles.map((d, i) => (
              <View key={i}>
                {i > 0 && <Divider />}
                <View style={styles.detalleRow}>
                  <View style={styles.detalleInfo}>
                    <Text style={styles.productName}>{d.producto?.nombre ?? 'Producto'}</Text>
                    <Text style={styles.productSku}>{d.producto?.sku}</Text>
                  </View>
                  <View style={styles.detalleNumbers}>
                    <Text style={styles.cantidad}>x{d.cantidad}</Text>
                    <Text style={styles.precio}>{formatCurrency(d.precio_unitario)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}

        {venta.notas && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.sectionValue}>{venta.notas}</Text>
          </Card>
        )}
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
  scroll: { padding: Spacing.screenPadding, paddingTop: 0, paddingBottom: 40 },
  mainCard: { marginBottom: Spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ventaId: { ...Typography.h3, color: Colors.text },
  amount: { ...Typography.stat, color: Colors.success, marginBottom: 4 },
  date: { ...Typography.caption, color: Colors.textSecondary },
  section: { marginBottom: Spacing.sm },
  sectionTitle: {
    ...Typography.label, color: Colors.textSecondary, marginBottom: 8,
    textTransform: 'uppercase', fontSize: 11,
  },
  sectionValue: { ...Typography.body, color: Colors.text },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detalleInfo: { flex: 1 },
  productName: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  productSku: { ...Typography.caption, color: Colors.textSecondary },
  detalleNumbers: { alignItems: 'flex-end' },
  cantidad: { ...Typography.caption, color: Colors.textSecondary },
  precio: { ...Typography.label, color: Colors.text },
});
