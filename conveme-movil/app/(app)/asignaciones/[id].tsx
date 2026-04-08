import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAsignaciones } from '../../../src/services/asignacion.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Badge } from '../../../src/components/ui/Badge';
import { formatDate, formatCurrency, parseGraphQLError } from '../../../src/utils';
import type { AsignacionVendedor } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

const ESTADO_BADGE: Record<string, 'success' | 'secondary' | 'warning'> = {
  Entregado: 'success',
  Finalizado: 'success',
  Cerrada: 'secondary',
  Pendiente: 'warning',
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

export default function AsignacionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [asignacion, setAsignacion] = useState<AsignacionVendedor | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list: AsignacionVendedor[] = await getAsignaciones();
      const found = list.find((a) => a.id_asignacion === Number(id));
      setAsignacion(found ?? null);
    } catch (err) {
      Alert.alert('No se pudo cargar la asignación', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>DETALLE</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <LoadingSpinner fullScreen message="CARGANDO..." />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  if (!asignacion) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>NO ENCONTRADA</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <View style={styles.notFound}>
            <Text style={styles.notFoundText}>ASIGNACIÓN NO ENCONTRADA</Text>
          </View>
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  const estado = asignacion.estado ?? 'Pendiente';

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>ASIGNACIÓN</Text>
          <View style={styles.headerActions}>
            <Badge text={estado.toUpperCase()} color={ESTADO_BADGE[estado] ?? 'warning'} size="sm" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <MaterialCommunityIcons name="clipboard-account" size={36} color={Colors.primary} />
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{asignacion.vendedor?.nombre_completo?.toUpperCase() || 'SIN VENDEDOR'}</Text>
                <Text style={styles.heroId}>FOLIO #{asignacion.id_asignacion}</Text>
              </View>
            </View>
          </View>

          {/* Section Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>DETALLES DE ASIGNACIÓN</Text>
            <InfoRow label="VENDEDOR" value={asignacion.vendedor?.nombre_completo} icon="account-outline" />
            <InfoRow label="FECHA" value={formatDate(asignacion.fecha_asignacion)} icon="calendar-outline" />
            <InfoRow label="ESTADO" value={estado} icon="progress-check" />
          </View>

          {/* Products List */}
          {asignacion.detalles && asignacion.detalles.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>PRODUCTOS ASIGNADOS ({asignacion.detalles.length})</Text>
              {asignacion.detalles.map((det) => (
                <View key={det.id_det_asignacion} style={styles.detRow}>
                  <View style={styles.detInfo}>
                    <Text style={styles.detName}>{det.producto?.nombre?.toUpperCase() || 'PRODUCTO'}</Text>
                    <Text style={styles.detSku}>SKU: {det.producto?.sku || 'N/A'}</Text>
                  </View>
                  <View style={styles.detQtyContainer}>
                    <Text style={styles.detQtyLabel}>CANT.</Text>
                    <Text style={styles.detQtyValue}>{det.cantidad_asignada}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '900', color: Colors.dark, flex: 1, marginLeft: 15 },
  headerPlaceholder: { width: 40 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 100 },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    elevation: 6
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  heroId: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
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
  detQtyContainer: { alignItems: 'center', minWidth: 50 },
  detQtyLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.3)' },
  detQtyValue: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 50 },
  notFoundText: { fontSize: 14, fontWeight: '800', color: 'rgba(0,0,0,0.4)' },
});
