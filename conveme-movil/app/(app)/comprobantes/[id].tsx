import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getComprobantes, updateComprobante } from '../../../src/services/comprobante.service';
import { Colors } from '../../../src/theme/colors';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Comprobante } from '../../../src/types';

export default function ComprobanteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  
  const [comprobante, setComprobante] = useState<Comprobante | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saldoInput, setSaldoInput] = useState('');
  const [notasInput, setNotasInput] = useState('');
  const [montoInput, setMontoInput] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list: Comprobante[] = await getComprobantes();
      const found = list.find((c) => c.id_comprobante === Number(id));
      if (found) {
        setComprobante(found);
        setSaldoInput(String(found.saldo_pendiente ?? ''));
        setNotasInput(found.notas ?? '');
        setMontoInput(String(found.monto_entregado ?? ''));
      }
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = useCallback(async () => {
    if (!comprobante) return;
    setSaving(true);
    try {
      await updateComprobante({
        id_comprobante: comprobante.id_comprobante,
        saldo_pendiente: parseFloat(saldoInput) || 0,
        monto_entregado: parseFloat(montoInput) || 0,
        notas: notasInput,
      });
      await fetchData();
      setEditMode(false);
      showToast('Comprobante actualizado', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSaving(false);
    }
  }, [comprobante, saldoInput, montoInput, notasInput, fetchData, showToast]);

  if (loading) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <LoadingSpinner message="Cargando comprobante..." />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  if (!comprobante) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
          </View>
          <View style={styles.center}>
            <Text style={styles.notFound}>Comprobante no encontrado.</Text>
          </View>
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  const isPendiente = (comprobante.saldo_pendiente ?? 0) > 0;

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>Comprobante</Text>
            <Badge
                text={isPendiente ? 'PENDIENTE' : 'LIQUIDADO'}
                color={isPendiente ? 'warning' : 'success'}
            />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Card */}
          <View style={styles.mainCard}>
            <View style={styles.heroHeader}>
                <View style={styles.heroInfo}>
                    <Text style={styles.heroVendedor}>{comprobante.vendedor?.nombre_completo ?? 'SIN VENDEDOR'}</Text>
                    <Text style={styles.heroAdmin}>Atendido por: {comprobante.admin?.username ?? 'Admin'}</Text>
                </View>
                <MaterialCommunityIcons name="file-document-outline" size={32} color={Colors.primary} />
            </View>
            
            <View style={styles.descuentoBox}>
                <Text style={styles.descuentoLabel}>SALDO PENDIENTE</Text>
                <Text style={[styles.descuentoValue, { color: isPendiente ? Colors.error : Colors.success }]}>
                    {formatCurrency(comprobante.saldo_pendiente ?? 0)}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
                <View>
                    <Text style={styles.infoLabel}>FECHA DE CORTE</Text>
                    <Text style={styles.infoValue}>{formatDate(comprobante.fecha_corte)}</Text>
                </View>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>RESUMEN FINANCIERO</Text>
            <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>TOTAL VENDIDO</Text>
                <Text style={styles.amountValue}>{formatCurrency(comprobante.total_vendido ?? 0)}</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>COMISIÓN VENDEDOR</Text>
                <Text style={styles.amountValue}>{formatCurrency(comprobante.comision_vendedor ?? 0)}</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>MONTO ENTREGADO</Text>
                <Text style={styles.amountValue}>{formatCurrency(comprobante.monto_entregado ?? 0)}</Text>
            </View>
          </View>

          {comprobante.notas ? (
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>NOTAS / OBSERVACIONES</Text>
              <Text style={styles.notesText}>{comprobante.notas}</Text>
            </View>
          ) : null}

          {editMode ? (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>ACTUALIZAR LIQUIDACIÓN</Text>
              <Input
                label="MONTO ENTREGADO"
                value={montoInput}
                onChangeText={setMontoInput}
                keyboardType="numeric"
                placeholder="0.00"
              />
              <Input
                label="SALDO PENDIENTE"
                value={saldoInput}
                onChangeText={setSaldoInput}
                keyboardType="numeric"
                placeholder="0.00"
              />
              <Input
                label="NOTAS"
                value={notasInput}
                onChangeText={setNotasInput}
                placeholder="Observaciones adicionales..."
                multiline
                numberOfLines={3}
              />
              <View style={styles.editActions}>
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.cancelBtn]} 
                    onPress={() => setEditMode(false)}
                >
                    <Text style={styles.cancelBtnText}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.saveBtn]} 
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveBtnText}>{saving ? '...' : 'GUARDAR'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
                style={styles.updateBtn} 
                onPress={() => setEditMode(true)}
            >
                <Text style={styles.updateBtnText}>ACTUALIZAR SALDO</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: { padding: 20, paddingBottom: 100 },
  mainCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, marginBottom: 25 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroInfo: { flex: 1 },
  heroVendedor: { fontSize: 22, fontWeight: '900', color: Colors.dark, marginBottom: 4 },
  heroAdmin: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1, textTransform: 'uppercase' },
  descuentoBox: { backgroundColor: Colors.primary + '10', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '20', marginBottom: 20 },
  descuentoLabel: { fontSize: 10, fontWeight: '900', color: Colors.primary, marginBottom: 5 },
  descuentoValue: { fontSize: 32, fontWeight: '900', color: Colors.primary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  detailsCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, marginBottom: 25 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 15, letterSpacing: 1, textTransform: 'uppercase' },
  amountItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.5)' },
  amountValue: { fontSize: 14, fontWeight: '900', color: Colors.dark },
  amountDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
  notesText: { fontSize: 14, fontWeight: '700', color: 'rgba(0,0,0,0.7)', lineHeight: 20 },
  formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, marginBottom: 25 },
  editActions: { flexDirection: 'row', gap: 15, marginTop: 10 },
  actionBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  cancelBtn: { backgroundColor: '#FFF' },
  cancelBtnText: { fontWeight: '900', color: Colors.dark, fontSize: 12 },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnText: { fontWeight: '900', color: '#FFF', fontSize: 12 },
  updateBtn: { height: 55, backgroundColor: Colors.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1 },
  updateBtnText: { fontWeight: '900', color: '#FFF', fontSize: 14, letterSpacing: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  notFound: { fontSize: 16, fontWeight: '800', color: 'rgba(0,0,0,0.3)' },
});
