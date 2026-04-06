import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCortes, deleteCorte } from '../../../src/services/corte.service';
import { createComprobante } from '../../../src/services/comprobante.service';
import { useAuthStore } from '../../../src/store/authStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import { CorteTicket } from '../../../src/components/ui/CorteTicket';
import { Button } from '../../../src/components/ui/Button';

const COMISION_POR_UNIDAD = 6.5;

export default function CorteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { usuario } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [corte, setCorte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [isSavingComprobante, setIsSavingComprobante] = useState(false);

  const fetchCorte = useCallback(async () => {
    try {
      const all = await getCortes('');
      const found = all.find((c: any) => String(c.id_corte) === String(id));
      setCorte(found ?? null);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchCorte();
  }, [fetchCorte]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCorte(Number(id));
      router.back();
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteVisible(false);
    }
  };

  const handleSaveComprobante = async () => {
    if (!corte) return;
    setIsSavingComprobante(true);
    try {
        const bruteTotal = corte.detalles?.reduce((acc: number, d: any) => acc + (d.cantidad_vendida * (d.producto?.precio_unitario || 0)), 0) || 0;
        const totalUnits = corte.detalles?.reduce((acc: number, d: any) => acc + d.cantidad_vendida, 0) || 0;
        const comision = totalUnits * COMISION_POR_UNIDAD;

        await createComprobante({
            vendedor_id: Number(corte.vendedor?.id_vendedor),
            admin_id: Number(usuario?.id_usuario),
            total_vendido: bruteTotal,
            comision_vendedor: comision,
            monto_entregado: corte.dinero_total_entregado,
            saldo_pendiente: Math.abs(corte.diferencia_corte || 0),
            notas: corte.observaciones
        });
        showToast('Comprobante guardado con éxito', 'success');
    } catch (err) {
        showToast('Error al guardar comprobante', 'error');
    } finally {
        setIsSavingComprobante(false);
    }
  };

  function getDiferenciaColor(diferencia: number) {
    if (diferencia > 0.01) return Colors.success;
    if (Math.abs(diferencia) < 0.01) return Colors.dark;
    return Colors.error;
  }

  if (loading) return <LoadingSpinner message="Cargando detalles..." />;
  if (!corte)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFound, { color: theme.text }]}>Corte no encontrado</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Detalle de Corte</Text>
        <TouchableOpacity onPress={() => setDeleteVisible(true)} style={styles.deleteBtnTop}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.folioRow}>
            <Text style={styles.folioLabel}>CORTE FOLIO #{corte.id_corte}</Text>
            <Text style={styles.dateLabel}>{formatDate(corte.fecha_corte)}</Text>
        </View>

        <View style={[styles.card, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Vendedor</Text>
          <View style={styles.vendedorRow}>
              <MaterialCommunityIcons name="account-tie" size={24} color={Colors.primary} />
              <Text style={styles.vendedorName}>
                {corte.vendedor?.nombre_completo || 'N/A'}
              </Text>
          </View>
        </View>

        <View style={[styles.card, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Resumen Financiero</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Dinero Esperado:</Text>
            <Text style={styles.value}>{formatCurrency(corte.dinero_esperado)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Entregado:</Text>
            <Text style={styles.value}>{formatCurrency(corte.dinero_total_entregado)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={[styles.label, { fontWeight: '900' }]}>Diferencia:</Text>
            <Text style={[styles.difValue, { color: getDiferenciaColor(corte.diferencia_corte) }]}>
              {corte.diferencia_corte > 0.01 ? '+' : ''}{formatCurrency(corte.diferencia_corte)}
            </Text>
          </View>
        </View>

        {corte.observaciones ? (
          <View style={[styles.card, Shadows.sm]}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text style={styles.observaciones}>{corte.observaciones}</Text>
          </View>
        ) : null}

        {corte.detalles && corte.detalles.length > 0 && (
          <View style={[styles.card, Shadows.sm]}>
            <Text style={styles.sectionTitle}>Detalles de productos</Text>
            {corte.detalles.map((det: any, index: number) => (
              <View key={index} style={[styles.detalle, index === 0 && { borderTopWidth: 0 }]}>
                <Text style={styles.detalleName}>
                  {det.producto?.nombre?.toUpperCase() || `Producto #${det.producto_id}`}
                </Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>VENDIDO</Text>
                        <Text style={styles.statValue}>{det.cantidad_vendida}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>DEVUELTO</Text>
                        <Text style={styles.statValue}>{det.cantidad_devuelta || 0}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>MERMA</Text>
                        <Text style={styles.statValue}>{det.merma_reportada || 0}</Text>
                    </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="GUARDAR COMPROBANTE"
            variant="primary"
            onPress={handleSaveComprobante}
            loading={isSavingComprobante}
            style={styles.actionBtn}
            leftIcon={<MaterialCommunityIcons name="content-save-check" size={20} color="#FFF" />}
          />
          <Button
            title="VER TICKET DIGITAL"
            variant="outline"
            onPress={() => setShowTicket(true)}
            style={styles.actionBtn}
            leftIcon={<MaterialCommunityIcons name="receipt" size={20} color={Colors.primary} />}
          />
          <Button
            title="EDITAR CORTE"
            variant="outline"
            onPress={() => router.push({ pathname: '/(app)/cortes/create', params: { id: String(corte.id_corte) } })}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={deleteVisible}
        title="Eliminar corte"
        message="¿Estás seguro de que deseas eliminar este corte? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
        loading={deleting}
        destructive
      />

      <Modal visible={showTicket} transparent animationType="fade">
        <View style={styles.ticketOverlay}>
          <View style={styles.ticketModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
              <CorteTicket corte={corte} />
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

      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  title: { ...Typography.h4, fontWeight: '900' },
  deleteBtnTop: { padding: Spacing.xs },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  folioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg, alignItems: 'center' },
  folioLabel: { fontSize: 12, fontWeight: '900', color: Colors.primary },
  dateLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  vendedorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vendedorName: { fontSize: 16, fontWeight: '800', color: Colors.dark },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: 'rgba(0,0,0,0.6)' },
  value: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 8 },
  difValue: { fontSize: 18, fontWeight: '900' },
  observaciones: { fontSize: 14, color: Colors.dark, lineHeight: 20 },
  detalle: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 12,
  },
  detalleName: { fontSize: 13, fontWeight: '900', color: Colors.dark, marginBottom: 8 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8, alignItems: 'center' },
  statLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)' },
  statValue: { fontSize: 14, fontWeight: '900', color: Colors.primary },
  actions: { marginTop: Spacing.lg, gap: Spacing.sm },
  actionBtn: { height: 55 },
  notFound: { padding: Spacing.xl, textAlign: 'center', fontWeight: '700' },
  ticketOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  ticketModalContainer: { width: '100%', maxHeight: '90%' },
  closeTicketButton: { backgroundColor: Colors.dark, padding: 15, borderRadius: BorderRadius.full, marginTop: 20, alignItems: 'center' },
  closeTicketText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});
