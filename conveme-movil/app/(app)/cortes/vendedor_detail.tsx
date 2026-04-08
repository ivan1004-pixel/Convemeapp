import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCortes } from '../../../src/services/corte.service';
import { useAuth } from '../../../src/hooks/useAuth';
import { Colors } from '../../../src/theme/colors';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Toast, useToast } from '../../../src/components/Toast';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import { CorteTicket } from '../../../src/components/ui/CorteTicket';
import { Button } from '../../../src/components/ui/Button';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

export default function VendedorCorteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { usuario } = useAuth();

  const [corte, setCorte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTicket, setShowTicket] = useState(false);

  const fetchCorte = useCallback(async () => {
    try {
      const all = await getCortes('');
      const found = all.find((c: any) => 
        String(c.id_corte) === String(id) && (
          c.vendedor?.id_vendedor === usuario?.id_vendedor || 
          c.id_vendedor === usuario?.id_vendedor
        )
      );
      setCorte(found ?? null);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast, usuario]);

  useEffect(() => {
    fetchCorte();
  }, [fetchCorte]);

  function getDiferenciaColor(diferencia: number) {
    if (diferencia > 0.01) return Colors.success;
    if (Math.abs(diferencia) < 0.01) return Colors.dark;
    return Colors.error;
  }

  if (loading) return <LoadingSpinner fullScreen message="CARGANDO DETALLES..." />;
  if (!corte)
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <Text style={styles.notFound}>CORTE NO ENCONTRADO</Text>
        </SafeAreaView>
      </NeobrutalistBackground>
    );

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>DETALLE DE CORTE</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.folioRow}>
              <Text style={styles.folioLabel}>CORTE FOLIO #{corte.id_corte}</Text>
              <Text style={styles.dateLabel}>{formatDate(corte.fecha_corte).toUpperCase()}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>VENDEDOR</Text>
            <View style={styles.vendedorRow}>
                <MaterialCommunityIcons name="account-tie" size={24} color={Colors.primary} />
                <Text style={styles.vendedorName}>
                  {corte.vendedor?.nombre_completo?.toUpperCase() || 'N/A'}
                </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>RESUMEN FINANCIERO</Text>
            <View style={styles.row}>
              <Text style={styles.label}>DINERO ESPERADO:</Text>
              <Text style={styles.value}>{formatCurrency(corte.dinero_esperado)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>TOTAL ENTREGADO:</Text>
              <Text style={styles.value}>{formatCurrency(corte.dinero_total_entregado)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={[styles.label, { fontWeight: '900' }]}>DIFERENCIA:</Text>
              <Text style={[styles.difValue, { color: getDiferenciaColor(corte.diferencia_corte) }]}>
                {corte.diferencia_corte > 0.01 ? '+' : ''}{formatCurrency(corte.diferencia_corte)}
              </Text>
            </View>
          </View>

          {corte.observaciones ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
              <Text style={styles.observaciones}>{corte.observaciones.toUpperCase()}</Text>
            </View>
          ) : null}

          {corte.detalles && corte.detalles.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>DETALLES DE PRODUCTOS</Text>
              {corte.detalles.map((det: any, index: number) => (
                <View key={index} style={[styles.detalle, index === 0 && { borderTopWidth: 0 }]}>
                  <Text style={styles.detalleName}>
                    {det.producto?.nombre?.toUpperCase() || `PRODUCTO #${det.producto_id}`}
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
              title="VER TICKET DIGITAL"
              variant="outline"
              onPress={() => setShowTicket(true)}
              style={styles.actionBtn}
              leftIcon={<MaterialCommunityIcons name="receipt" size={20} color={Colors.primary} />}
            />
          </View>
        </ScrollView>

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
    paddingVertical: Spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 18, fontWeight: '900', color: Colors.dark },
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
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 3,
  },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  vendedorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vendedorName: { fontSize: 16, fontWeight: '800', color: Colors.dark },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 8 },
  difValue: { fontSize: 18, fontWeight: '900' },
  observaciones: { fontSize: 13, fontWeight: '700', color: Colors.dark, lineHeight: 18 },
  detalle: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 12,
  },
  detalleName: { fontSize: 13, fontWeight: '900', color: Colors.dark, marginBottom: 8 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)' },
  statValue: { fontSize: 14, fontWeight: '900', color: Colors.primary },
  actions: { marginTop: Spacing.lg, gap: Spacing.sm },
  actionBtn: { height: 55, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 },
  notFound: { padding: Spacing.xl, textAlign: 'center', fontWeight: '900', color: 'rgba(0,0,0,0.3)', marginTop: 100 },
  ticketOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  ticketModalContainer: { width: '100%', maxHeight: '90%' },
  closeTicketButton: { backgroundColor: Colors.dark, padding: 15, borderRadius: BorderRadius.full, marginTop: 20, alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  closeTicketText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});
