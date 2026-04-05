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
import { getPedidos, deletePedido, updateEstadoPedido } from '../../../src/services/pedido.service';
import { usePedidoStore } from '../../../src/store/pedidoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Pedido } from '../../../src/types';

const ESTADO_BADGE: Record<string, 'warning' | 'primary' | 'success' | 'error'> = {
  Pendiente: 'warning',
  Confirmado: 'primary',
  Entregado: 'success',
  Cancelado: 'error',
};

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

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { pedidos, setPedidos, removePedido } = usePedidoStore();
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const pedidoId = Number(id);
  const pedido: Pedido | undefined = pedidos.find((p) => p.id_pedido === pedidoId);

  const fetchIfNeeded = useCallback(async () => {
    if (!pedido) {
      setLoading(true);
      try {
        const data = await getPedidos();
        setPedidos(data);
      } catch (err) {
        Alert.alert('Error', parseGraphQLError(err));
      } finally {
        setLoading(false);
      }
    }
  }, [pedido, setPedidos]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deletePedido(pedidoId);
      removePedido(pedidoId);
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }, [pedidoId, removePedido]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingSpinner fullScreen message="Cargando pedido..." />
      </SafeAreaView>
    );
  }

  if (!pedido) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Pedido</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.notFound}>
          <Text style={{ ...Typography.body, color: theme.muted }}>Pedido no encontrado.</Text>
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
        <Text style={[styles.title, { color: theme.text }]}>Pedido #{pedido.id_pedido}</Text>
        <Pressable
          onPress={() => setShowDelete(true)}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel="Eliminar pedido"
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={[styles.amountLabel, { color: theme.muted }]}>Monto Total</Text>
            <Badge
              text={pedido.estado ?? 'Pendiente'}
              color={ESTADO_BADGE[pedido.estado ?? 'Pendiente'] ?? 'secondary'}
            />
          </View>
          <Text style={[styles.amount, { color: Colors.primary }]}>
            {formatCurrency(pedido.monto_total)}
          </Text>
          {pedido.anticipo != null && pedido.anticipo > 0 && (
            <Text style={[styles.anticipo, { color: Colors.success }]}>
              Anticipo: {formatCurrency(pedido.anticipo)}
            </Text>
          )}
        </Card>

        {/* Details Card */}
        <Card title="Información" style={styles.sectionCard}>
          <DetailRow label="Fecha pedido" value={formatDate(pedido.fecha_pedido)} />
          <DetailRow
            label="Fecha entrega"
            value={formatDate(pedido.fecha_entrega_estimada)}
          />
          <DetailRow label="Estado" value={pedido.estado ?? 'Pendiente'} />
          <DetailRow
            label="Cliente"
            value={pedido.cliente?.nombre_completo ?? 'No asignado'}
          />
          <DetailRow
            label="Vendedor"
            value={pedido.vendedor?.nombre_completo ?? 'No asignado'}
          />
        </Card>

        {/* Detalles */}
        {pedido.detalles && pedido.detalles.length > 0 && (
          <Card title={`Productos (${pedido.detalles.length})`} style={styles.sectionCard}>
            {pedido.detalles.map((det, i) => (
              <View
                key={i}
                style={[
                  styles.detalleRow,
                  i < pedido.detalles!.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={styles.detalleInfo}>
                  <Text style={[styles.detalleName, { color: theme.text }]}>
                    {det.producto?.nombre ?? 'Producto'}
                  </Text>
                  <Text style={[styles.detalleSku, { color: theme.muted }]}>
                    SKU: {det.producto?.sku ?? '-'}
                  </Text>
                </View>
                <View style={styles.detalleRight}>
                  <Text style={[styles.detalleCantidad, { color: theme.text }]}>
                    ×{det.cantidad}
                  </Text>
                  <Text style={[styles.detallePrecio, { color: Colors.primary }]}>
                    {formatCurrency(det.precio_unitario)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Editar pedido"
            variant="outline"
            onPress={() => router.push(`/pedidos/create?id=${pedido.id_pedido}`)}
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
        title="Eliminar pedido"
        message={`¿Deseas eliminar el pedido #${pedido.id_pedido}? Esta acción no se puede deshacer.`}
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
  summaryCard: { marginBottom: Spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  amountLabel: { ...Typography.bodySmall },
  amount: { ...Typography.h2, marginTop: Spacing.xs },
  anticipo: { ...Typography.bodySmall, marginTop: Spacing.xs, fontWeight: '600' },
  sectionCard: { marginBottom: Spacing.md },
  detalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detalleInfo: { flex: 1, marginRight: Spacing.sm },
  detalleName: { ...Typography.bodySmall, fontWeight: '600' },
  detalleSku: { ...Typography.caption },
  detalleRight: { alignItems: 'flex-end' },
  detalleCantidad: { ...Typography.bodySmall },
  detallePrecio: { ...Typography.bodySmall, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
