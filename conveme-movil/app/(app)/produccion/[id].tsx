import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getOrdenesProduccion } from '../../../src/services/produccion.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { formatDate, parseGraphQLError } from '../../../src/utils';

const ESTADO_COLORS: Record<string, 'warning' | 'primary' | 'success' | 'error'> = {
  Pendiente: 'warning',
  'En Proceso': 'primary',
  Finalizada: 'success',
  Cancelada: 'error',
};

export default function ProduccionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show, hide } = useToast();
  const [orden, setOrden] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrden = useCallback(async () => {
    try {
      const all = await getOrdenesProduccion();
      const found = all.find((o: any) => String(o.id_orden_produccion) === String(id));
      setOrden(found ?? null);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, show]);

  useEffect(() => {
    fetchOrden();
  }, [fetchOrden]);

  if (loading) return <LoadingSpinner fullScreen />;

  if (!orden)
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={64} color={Colors.error} />
            <Text style={styles.errorText}>ORDEN NO ENCONTRADA</Text>
            <Button title="VOLVER" onPress={() => router.push('/(app)')} style={{ marginTop: 20 }} />
          </View>
        </SafeAreaView>
      </NeobrutalistBackground>
    );

  const estado = orden.estado ?? 'Pendiente';

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>DETALLE DE ORDEN</Text>
            <TouchableOpacity 
                onPress={() => router.push({ pathname: '/produccion/create', params: { id: String(orden.id_orden_produccion) } })} 
                style={styles.editHeaderBtn}
            >
                <MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.dark} />
            </TouchableOpacity>
        </View>

        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrden(); }} />}
        >
            <View style={styles.mainCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.idBox}>
                        <Text style={styles.idLabel}>ID ORDEN</Text>
                        <Text style={styles.idValue}>#{orden.id_orden_produccion}</Text>
                    </View>
                    <Badge
                        text={estado.toUpperCase()}
                        color={ESTADO_COLORS[estado] || 'secondary'}
                        size="md"
                    />
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>PRODUCTO</Text>
                    <Text style={styles.sectionValue}>{orden.producto?.nombre?.toUpperCase()}</Text>
                    {orden.producto?.sku && (
                        <View style={styles.skuBadge}>
                            <Text style={styles.skuText}>SKU: {orden.producto.sku}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>CANTIDAD</Text>
                        <Text style={styles.infoValue}>{orden.cantidad_a_producir}</Text>
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>FECHA</Text>
                        <Text style={styles.infoValue}>{formatDate(orden.fecha_orden, 'DD/MM/YYYY')}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>EMPLEADO RESPONSABLE</Text>
                    <View style={styles.employeeRow}>
                        <View style={styles.employeeAvatar}>
                            <MaterialCommunityIcons name="account" size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.employeeName}>{orden.empleado?.nombre_completo?.toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            {orden.detalles && orden.detalles.length > 0 && (
                <View style={[styles.mainCard, { marginTop: 20 }]}>
                    <Text style={styles.sectionLabel}>INSUMOS / MATERIALES</Text>
                    {orden.detalles.map((det: any, idx: number) => (
                        <View key={det.id_det_orden} style={[styles.detalleItem, idx === 0 && { borderTopWidth: 0 }]}>
                            <View style={styles.detalleInfo}>
                                <Text style={styles.detalleName}>{det.insumo?.nombre?.toUpperCase()}</Text>
                                <Text style={styles.detalleUnit}>{det.insumo?.unidad_medida?.toUpperCase()}</Text>
                            </View>
                            <View style={styles.detalleQtyBox}>
                                <Text style={styles.detalleQty}>{det.cantidad_consumida}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  editHeaderBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 16, fontWeight: '900', color: Colors.dark, letterSpacing: 1 },
  scrollContent: { padding: 20 },
  mainCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  idBox: { gap: 2 },
  idLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: 0.5 },
  idValue: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  divider: { height: 2, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: 1, marginBottom: 5 },
  sectionValue: { fontSize: 18, fontWeight: '900', color: Colors.dark },
  skuBadge: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  skuText: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.5)' },
  infoGrid: { flexDirection: 'row', gap: 15, marginTop: 20 },
  infoBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.dark, gap: 4 },
  infoLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: 0.5 },
  infoValue: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  employeeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.dark },
  employeeAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '30' },
  employeeName: { fontSize: 14, fontWeight: '900', color: Colors.dark, flex: 1 },
  detalleItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  detalleInfo: { gap: 2 },
  detalleName: { fontSize: 13, fontWeight: '900', color: Colors.dark },
  detalleUnit: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)' },
  detalleQtyBox: { backgroundColor: Colors.dark, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  detalleQty: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText: { fontSize: 18, fontWeight: '900', color: Colors.dark, marginTop: 20 },
});
