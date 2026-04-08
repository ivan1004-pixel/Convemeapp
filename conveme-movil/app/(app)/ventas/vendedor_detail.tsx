import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getVentas, deleteVenta } from '../../../src/services/venta.service';
import { useVentaStore } from '../../../src/store/ventaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Venta } from '../../../src/types';
import { SalesTicket } from '../../../src/components/ui/SalesTicket';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

const ESTADO_BADGE: Record<string, 'warning' | 'success' | 'error'> = {
  Pendiente: 'warning',
  Completada: 'success',
  Cancelada: 'error',
};

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.labelContainer}>
        {icon && <MaterialCommunityIcons name={icon as any} size={16} color="rgba(0,0,0,0.4)" style={{ marginRight: 6 }} />}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value.toUpperCase()}</Text>
    </View>
  );
}

import { useAuth } from '../../../src/hooks/useAuth';

export default function VendedorVentaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin, usuario } = useAuth();
  const { ventas, setVentas, removeVenta } = useVentaStore();
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTicket, setShowTicket] = useState(false);

  const ventaId = Number(id);
  
  // Primero buscar la venta en el store
  const ventaFromStore: Venta | undefined = ventas.find((v) => v.id_venta === ventaId);
  
  // Luego verificar si el vendedor tiene acceso a esta venta
  const venta: Venta | undefined = ventaFromStore && (
    ventaFromStore.vendedor?.id_vendedor === usuario?.id_vendedor || 
    ventaFromStore.id_vendedor === usuario?.id_vendedor
  ) ? ventaFromStore : undefined;

  const fetchIfNeeded = useCallback(async () => {
    if (!ventaFromStore) {
      setLoading(true);
      try {
        const data = await getVentas();
        setVentas(data);
      } catch (err) {
        Alert.alert('No se pudo cargar la venta', parseGraphQLError(err));
      } finally {
        setLoading(false);
      }
    }
  }, [ventaFromStore, setVentas]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteVenta(ventaId);
      removeVenta(ventaId);
      router.push('/(app)');
    } catch (err) {
      Alert.alert('No se pudo eliminar la venta', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }, [ventaId, removeVenta]);

  if (loading || !venta) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>DETALLE</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <LoadingSpinner fullScreen message="CARGANDO..." />
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
          <Text style={styles.headerTitle}>DETALLE DE VENTA</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Summary Card */}
          <View style={styles.heroCard}>
            <View style={styles.summaryTop}>
                <Text style={styles.heroId}>VENTA #{venta.id_venta}</Text>
                <Badge
                    text={venta.estado?.toUpperCase() ?? 'PENDIENTE'}
                    color={ESTADO_BADGE[venta.estado ?? 'Pendiente'] ?? 'warning'}
                />
            </View>
            <Text style={styles.heroAmount}>{formatCurrency(venta.monto_total)}</Text>
            <View style={styles.metodoBox}>
                <MaterialCommunityIcons name="credit-card-outline" size={16} color={Colors.primary} />
                <Text style={styles.metodoText}>PAGO: {venta.metodo_pago?.toUpperCase() || 'NO ESPECIFICADO'}</Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>INFORMACIÓN GENERAL</Text>
            <InfoRow label="FECHA" value={formatDate(venta.fecha_venta)} icon="calendar-outline" />
            <InfoRow label="MÉTODO DE PAGO" value={venta.metodo_pago} icon="cash-multiple" />
            <InfoRow label="VENDEDOR" value={venta.vendedor?.nombre_completo} icon="account-tie-outline" />
            <InfoRow label="ESTADO" value={venta.estado} icon="check-circle-outline" />
          </View>

          {/* Products List */}
          {venta.detalles && venta.detalles.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>PRODUCTOS VENDIDOS ({venta.detalles.reduce((acc, det) => acc + det.cantidad, 0)})</Text>
              {venta.detalles.map((det, i) => (
                <View key={i} style={styles.detRow}>
                  <View style={styles.detInfo}>
                    <Text style={styles.detName}>{det.producto?.nombre?.toUpperCase() || 'PRODUCTO'}</Text>
                    <Text style={styles.detSku}>SKU: {det.producto?.sku || 'N/A'}</Text>
                  </View>
                  <View style={styles.detRight}>
                    <Text style={styles.detQty}>×{det.cantidad}</Text>
                    <Text style={styles.detPrice}>{formatCurrency(det.precio_unitario)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title="VER TICKET"
              onPress={() => setShowTicket(true)}
              style={styles.actionBtn}
              size="lg"
            />
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={showDelete}
          title="ELIMINAR VENTA"
          message={`¿DESEAS ELIMINAR LA VENTA #${venta.id_venta}?`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
          destructive
        />

        <Modal visible={showTicket} transparent animationType="fade">
          <View style={styles.ticketOverlay}>
            <View style={styles.ticketModalContainer}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                <SalesTicket venta={venta} />
              </ScrollView>
              <TouchableOpacity
                style={styles.closeTicketButton}
                onPress={() => setShowTicket(false)}
              >
                <Text style={styles.closeTicketText}>✕ CERRAR TICKET</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.dark, flex: 1, marginLeft: 15 },
  headerPlaceholder: { width: 40 },
  deleteHeaderBtn: { padding: Spacing.xs },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 100 },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    elevation: 6
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  heroId: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
  heroAmount: { fontSize: 28, fontWeight: '900', color: Colors.dark },
  metodoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: Colors.primary + '10', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  metodoText: { fontSize: 11, fontWeight: '900', color: Colors.primary },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 3,
  },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: Colors.primary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 1.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  labelContainer: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, fontWeight: '800', color: Colors.dark, textAlign: 'right', flexShrink: 1, marginLeft: 10 },
  detRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  detInfo: { flex: 1 },
  detName: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  detSku: { fontSize: 10, fontWeight: '600', color: 'rgba(0,0,0,0.4)' },
  detRight: { alignItems: 'flex-end' },
  detQty: { fontSize: 12, fontWeight: '900', color: Colors.primary },
  detPrice: { fontSize: 13, fontWeight: '800', color: Colors.dark },
  actions: { marginTop: Spacing.sm },
  actionBtn: { shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 },
  ticketOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  ticketModalContainer: { width: '100%', maxHeight: '90%' },
  closeTicketButton: { backgroundColor: Colors.dark, padding: 15, borderRadius: BorderRadius.full, marginTop: 20, alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  closeTicketText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});
