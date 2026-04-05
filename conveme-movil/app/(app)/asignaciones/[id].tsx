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
import { getAsignaciones } from '../../../src/services/asignacion.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Badge } from '../../../src/components/ui/Badge';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatDate, formatCurrency, parseGraphQLError } from '../../../src/utils';
import type { Asignacion } from '../../../src/types';

const ESTADO_BADGE: Record<string, 'success' | 'secondary' | 'warning'> = {
  Activa: 'success',
  Cerrada: 'secondary',
  Pendiente: 'warning',
};

export default function AsignacionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list: Asignacion[] = await getAsignaciones();
      const found = list.find((a) => a.id_asignacion === Number(id));
      setAsignacion(found ?? null);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingSpinner fullScreen message="Cargando asignación..." />
      </SafeAreaView>
    );
  }

  if (!asignacion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backText, { color: Colors.primary }]}>‹ Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: theme.muted }]}>Asignación no encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const estado = asignacion.estado ?? 'Pendiente';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: Colors.primary }]}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          Asignación #{asignacion.id_asignacion}
        </Text>
        <Badge text={estado} color={ESTADO_BADGE[estado] ?? 'secondary'} size="sm" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Información</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Vendedor</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {asignacion.vendedor?.nombre_completo ?? '—'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Fecha asignación</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {formatDate(asignacion.fecha_asignacion)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Estado</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{estado}</Text>
          </View>
        </View>

        {asignacion.detalles && asignacion.detalles.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Productos ({asignacion.detalles.length})
            </Text>
            {asignacion.detalles.map((det) => (
              <View
                key={det.id_det_asignacion}
                style={[styles.detRow, { borderBottomColor: theme.border }]}
              >
                <View style={styles.detInfo}>
                  <Text style={[styles.detName, { color: theme.text }]}>
                    {det.producto?.nombre ?? 'Producto'}
                  </Text>
                  {det.producto?.sku ? (
                    <Text style={[styles.detSku, { color: theme.muted }]}>
                      SKU: {det.producto.sku}
                    </Text>
                  ) : null}
                  {det.producto?.precio_unitario != null && (
                    <Text style={[styles.detPrice, { color: theme.muted }]}>
                      {formatCurrency(det.producto.precio_unitario)} c/u
                    </Text>
                  )}
                </View>
                <View style={styles.detQty}>
                  <Text style={[styles.detQtyLabel, { color: theme.muted }]}>Cant.</Text>
                  <Text style={[styles.detQtyValue, { color: theme.text }]}>
                    {det.cantidad_asignada}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backText: { ...Typography.body, fontWeight: '600' },
  title: { ...Typography.h4, flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  section: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  sectionTitle: { ...Typography.label, marginBottom: Spacing.sm },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  infoLabel: { ...Typography.bodySmall, flex: 1 },
  infoValue: { ...Typography.body, flex: 1.5, textAlign: 'right', fontWeight: '500' },
  detRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detInfo: { flex: 1 },
  detName: { ...Typography.body, fontWeight: '500' },
  detSku: { ...Typography.caption },
  detPrice: { ...Typography.caption },
  detQty: { alignItems: 'center', minWidth: 48 },
  detQtyLabel: { ...Typography.caption },
  detQtyValue: { ...Typography.h4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...Typography.body },
});
