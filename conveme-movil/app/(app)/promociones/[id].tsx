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
import { getPromociones, deletePromocion } from '../../../src/services/promocion.service';
import { usePromocionStore } from '../../../src/store/promocionStore';
import { Colors } from '../../../src/theme/colors';
import { Spacing } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError, formatDate, formatCurrency } from '../../../src/utils';
import type { Promocion } from '../../../src/types';

export default function PromocionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { promociones, setPromociones, removePromocion } = usePromocionStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const promocion: Promocion | undefined = promociones.find(
    (p) => p.id_promocion === Number(id)
  );

  const fetchIfNeeded = useCallback(async () => {
    if (promocion) return;
    setLoading(true);
    try {
      const data = await getPromociones();
      setPromociones(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [promocion, setPromociones, showToast]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    if (!promocion) return;
    setDeleting(true);
    try {
      await deletePromocion(promocion.id_promocion);
      removePromocion(promocion.id_promocion);
      showToast('Promoción eliminada con éxito', 'success');
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [promocion, removePromocion, showToast]);

  if (loading || !promocion) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>Detalle</Text>
            <View style={{ width: 40 }} />
          </View>
          <LoadingSpinner message="Cargando..." />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  const descuentoText =
    promocion.valor_descuento != null
      ? promocion.tipo_promocion === 'PORCENTAJE'
        ? `${promocion.valor_descuento}%`
        : formatCurrency(promocion.valor_descuento)
      : null;

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>Promoción</Text>
            <TouchableOpacity 
                onPress={() => router.push(`/promociones/create?id=${promocion.id_promocion}`)}
                style={styles.editBtnHeader}
            >
                <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
            </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <View style={styles.mainCard}>
            <View style={styles.heroRow}>
                <View style={styles.heroInfo}>
                    <Text style={styles.heroName}>{promocion.nombre}</Text>
                    <Text style={styles.heroTipo}>{promocion.tipo_promocion === 'PORCENTAJE' ? 'PORCENTAJE' : 'MONTO FIJO'}</Text>
                </View>
                <Badge
                    text={promocion.activa ? 'ACTIVA' : 'INACTIVA'}
                    color={promocion.activa ? 'success' : 'secondary'}
                />
            </View>

            <View style={styles.descuentoBox}>
                <Text style={styles.descuentoLabel}>VALOR DEL DESCUENTO</Text>
                <Text style={styles.descuentoValue}>{descuentoText}</Text>
            </View>

            {promocion.descripcion && (
                <View style={styles.descBox}>
                    <Text style={styles.sectionTitle}>DESCRIPCIÓN</Text>
                    <Text style={styles.descriptionText}>{promocion.descripcion}</Text>
                </View>
            )}
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>VIGENCIA Y ESTADO</Text>
            <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-range" size={20} color={Colors.primary} />
                <View>
                    <Text style={styles.infoLabel}>FECHA INICIO</Text>
                    <Text style={styles.infoValue}>{promocion.fecha_inicio ? formatDate(promocion.fecha_inicio) : 'No definida'}</Text>
                </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-check" size={20} color={Colors.primary} />
                <View>
                    <Text style={styles.infoLabel}>FECHA FIN</Text>
                    <Text style={styles.infoValue}>{promocion.fecha_fin ? formatDate(promocion.fecha_fin) : 'No definida'}</Text>
                </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
                <MaterialCommunityIcons name={promocion.activa ? "check-circle" : "close-circle"} size={20} color={promocion.activa ? Colors.success : Colors.error} />
                <View>
                    <Text style={styles.infoLabel}>ESTADO ACTUAL</Text>
                    <Text style={styles.infoValue}>{promocion.activa ? 'ACTIVA Y VISIBLE' : 'INACTIVA'}</Text>
                </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => setShowConfirm(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
            <Text style={styles.deleteBtnText}>ELIMINAR PROMOCIÓN</Text>
          </TouchableOpacity>
        </ScrollView>

        <ConfirmDialog
          visible={showConfirm}
          title="Eliminar promoción"
          message={`¿Deseas eliminar "${promocion.nombre}"?`}
          confirmText="ELIMINAR"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
          destructive
        />

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
  editBtnHeader: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  scrollContent: { padding: 20, paddingBottom: 100 },
  mainCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, marginBottom: 25 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 24, fontWeight: '900', color: Colors.dark, marginBottom: 4 },
  heroTipo: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
  descuentoBox: { backgroundColor: Colors.primary + '10', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '20', marginBottom: 20 },
  descuentoLabel: { fontSize: 10, fontWeight: '900', color: Colors.primary, marginBottom: 5 },
  descuentoValue: { fontSize: 32, fontWeight: '900', color: Colors.primary },
  descBox: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 15 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 12, letterSpacing: 1 },
  descriptionText: { fontSize: 14, fontWeight: '700', color: 'rgba(0,0,0,0.7)', lineHeight: 20 },
  detailsCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, marginBottom: 25 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 5 },
  infoLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  infoDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingVertical: 15, gap: Spacing.sm },
  deleteBtnText: { color: Colors.error, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
});
