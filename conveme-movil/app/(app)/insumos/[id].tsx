import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInsumos, deleteInsumo } from '../../../src/services/insumo.service';
import { useInsumoStore } from '../../../src/store/insumoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import type { Insumo } from '../../../src/types';

function DetailRow({ label, value, icon, color = Colors.dark }: { label: string; value: string; icon: any; color?: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIconBox, { backgroundColor: color + '10' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.detailInfo}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function InsumoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show, hide } = useToast();
  const { insumos, setInsumos, removeInsumo } = useInsumoStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const insumo: Insumo | undefined = insumos.find((i) => i.id_insumo === Number(id));

  const fetchData = useCallback(async () => {
    if (insumo) return;
    setLoading(true);
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [insumo, setInsumos, show]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(async () => {
    if (!insumo) return;
    setDeleting(true);
    try {
      await deleteInsumo(insumo.id_insumo);
      removeInsumo(insumo.id_insumo);
      show('Insumo eliminado correctamente', 'success');
      setTimeout(() => router.push('/(app)'), 1500);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [insumo, removeInsumo, show]);

  if (loading || !insumo) return <LoadingSpinner fullScreen message="Cargando material..." />;

  const isLowStock =
    insumo.stock_minimo_alerta != null &&
    insumo.stock_actual != null &&
    insumo.stock_actual <= insumo.stock_minimo_alerta;

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>DETALLE MATERIAL</Text>
            <TouchableOpacity onPress={() => router.push(`/insumos/create?id=${insumo.id_insumo}`)} style={styles.editBtn}>
                <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Main Info Card */}
            <View style={[styles.mainCard, isLowStock && { borderColor: Colors.error }]}>
                <View style={[styles.heroIcon, { backgroundColor: isLowStock ? Colors.error + '15' : Colors.info + '15' }]}>
                    <MaterialCommunityIcons 
                        name={isLowStock ? "alert-decagram" : "flask"} 
                        size={40} 
                        color={isLowStock ? Colors.error : Colors.info} 
                    />
                </View>
                <Text style={styles.insumoName}>{insumo.nombre.toUpperCase()}</Text>
                <Badge 
                    text={isLowStock ? "REABASTECIMIENTO REQUERIDO" : "STOCK SALUDABLE"} 
                    color={isLowStock ? "error" : "success"} 
                    style={{ marginTop: 10 }}
                />
            </View>

            <Text style={styles.sectionTitle}>ESTADO DE INVENTARIO</Text>
            
            <View style={styles.detailsContainer}>
                <DetailRow 
                    label="STOCK ACTUAL" 
                    value={`${insumo.stock_actual} ${insumo.unidad_medida?.toUpperCase()}`} 
                    icon="database-outline" 
                    color={isLowStock ? Colors.error : Colors.success}
                />
                <View style={styles.divider} />
                <DetailRow 
                    label="PUNTO DE ALERTA" 
                    value={`${insumo.stock_minimo_alerta || 0} ${insumo.unidad_medida?.toUpperCase()}`} 
                    icon="bell-ring-outline" 
                    color={Colors.warning}
                />
                <View style={styles.divider} />
                <DetailRow 
                    label="UNIDAD DE MEDIDA" 
                    value={insumo.unidad_medida?.toUpperCase() || 'N/A'} 
                    icon="ruler" 
                    color={Colors.info}
                />
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowConfirm(true)}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                <Text style={styles.deleteBtnText}>ELIMINAR INSUMO</Text>
            </TouchableOpacity>
        </ScrollView>

        <ConfirmDialog
          visible={showConfirm}
          title="Eliminar insumo"
          message={`¿Deseas eliminar "${insumo.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
          destructive
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  editBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: { padding: 20 },
  mainCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 4, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 8, height: 8 }, shadowOpacity: 1, marginBottom: 25 },
  heroIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  insumoName: { fontSize: 24, fontWeight: '900', color: Colors.dark, textAlign: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  detailsContainer: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, marginBottom: 25 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 5 },
  detailIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailInfo: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' },
  detailValue: { fontSize: 16, fontWeight: '900' },
  divider: { height: 2, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 15, borderWidth: 3, borderColor: Colors.error, backgroundColor: Colors.error + '05', marginBottom: 40 },
  deleteBtnText: { color: Colors.error, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});
