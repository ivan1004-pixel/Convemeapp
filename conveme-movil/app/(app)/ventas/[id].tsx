import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  Modal,             // <-- ¡Agregado!
  TouchableOpacity,  // <-- ¡Agregado!
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getVentas, deleteVenta, updateVenta } from '../../../src/services/venta.service';
import { useVentaStore } from '../../../src/store/ventaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Venta } from '../../../src/types';

// IMPORTANTE: Asegúrate de importar tu componente SalesTicket aquí arriba
// import { SalesTicket } from '../../../src/components/ui/SalesTicket';

const ESTADO_BADGE: Record<string, 'warning' | 'success' | 'error'> = {
  Pendiente: 'warning',
  Completada: 'success',
  Cancelada: 'error',
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
  value: { ...Typography.bodySmall, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: Spacing.sm },
});

export default function VentaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { ventas, setVentas, removeVenta } = useVentaStore();
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTicket, setShowTicket] = useState(false);

  const ventaId = Number(id);
  const venta: Venta | undefined = ventas.find((v) => v.id_venta === ventaId);

  const fetchIfNeeded = useCallback(async () => {
    if (!venta) {
      setLoading(true);
      try {
        const data = await getVentas();
        setVentas(data);
      } catch (err) {
        Alert.alert('Error', parseGraphQLError(err));
      } finally {
        setLoading(false);
      }
    }
  }, [venta, setVentas]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteVenta(ventaId);
      removeVenta(ventaId);
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }, [ventaId, removeVenta]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LoadingSpinner fullScreen message="Cargando venta..." />
      </SafeAreaView>
    );
  }

  if (!venta) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
      <Text style={styles.backIcon}>←</Text>
      </Pressable>
      <Text style={[styles.title, { color: theme.text }]}>Venta</Text>
      <View style={styles.headerPlaceholder} />
      </View>
      <View style={styles.notFound}>
      <Text style={{ ...Typography.body, color: theme.muted }}>Venta no encontrada.</Text>
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
    <Text style={[styles.title, { color: theme.text }]}>Venta #{venta.id_venta}</Text>
    <Pressable
    onPress={() => setShowDelete(true)}
    style={styles.deleteBtn}
    accessibilityRole="button"
    accessibilityLabel="Eliminar venta"
    >
    <Text style={styles.deleteIcon}>X</Text>
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
    text={venta.estado ?? 'Pendiente'}
    color={ESTADO_BADGE[venta.estado ?? 'Pendiente'] ?? 'secondary'}
    />
    </View>
    <Text style={[styles.amount, { color: Colors.primary }]}>
    {formatCurrency(venta.monto_total)}
    </Text>
    </Card>

    {/* Details Card */}
    <Card title="Información" style={styles.sectionCard}>
    <DetailRow label="Fecha" value={formatDate(venta.fecha_venta)} />
    <DetailRow label="Método de pago" value={venta.metodo_pago ?? 'No especificado'} />
    <DetailRow label="Estado" value={venta.estado ?? 'Pendiente'} />
    <DetailRow
    label="Vendedor"
    value={venta.vendedor?.nombre_completo ?? 'No asignado'}
    />
    </Card>

    {/* Detalles Card */}
    {venta.detalles && venta.detalles.length > 0 && (
      <Card title={`Productos (${venta.detalles.length})`} style={styles.sectionCard}>
      {venta.detalles.map((det, i) => (
        <View
        key={i}
        style={[
          styles.detalleRow,
          i < venta.detalles!.length - 1 && {
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
    title="Ver Ticket"
    variant="primary"
    onPress={() => setShowTicket(true)}
    style={styles.actionBtn}
    />
    <Button
    title="Editar venta"
    variant="outline"
    onPress={() => router.push(`/ventas/create?id=${venta.id_venta}`)}
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
    title="Eliminar venta"
    message={`¿Deseas eliminar la venta #${venta.id_venta}? Esta acción no se puede deshacer.`}
    onConfirm={handleDelete}
    onCancel={() => setShowDelete(false)}
    confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
    destructive
    />

    {/* Modal del Ticket */}
    <Modal
    visible={showTicket}
    transparent
    animationType="fade"
    onRequestClose={() => setShowTicket(false)}
    >
    <View style={styles.ticketModalOverlay}>
    <View style={styles.ticketModalContainer}>
    <ScrollView
    contentContainerStyle={styles.ticketScrollContent}
    showsVerticalScrollIndicator={false}
    >
    {/* NOTA: Asegúrate de importar SalesTicket arriba */}
    {/* <SalesTicket venta={venta} /> */}
    <Text style={{color: 'white'}}>Ticket temporal</Text>
    </ScrollView>

    {/* Botón cerrar */}
    <TouchableOpacity
    style={styles.closeTicketButton}
    onPress={() => setShowTicket(false)}
    activeOpacity={0.7}
    >
    <Text style={styles.closeTicketText}>✕ CERRAR</Text>
    </TouchableOpacity>
    </View>
    </View>
    </Modal>
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Estilos del modal del ticket
  ticketModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
                                 justifyContent: 'center',
                                 alignItems: 'center',
                                 padding: Spacing.lg,
  },
  ticketModalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  ticketScrollContent: {
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  closeTicketButton: {
    backgroundColor: Colors.blue,
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.dark,
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  closeTicketText: {
    ...Typography.body,
    fontWeight: '900',
    color: Colors.light,
    letterSpacing: 1,
  },
});
