import React, { useEffect, useState } from 'react';
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
import { getOrdenesProduccion } from '../../../src/services/produccion.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatDate, parseGraphQLError } from '../../../src/utils';

const ESTADO_BADGE: Record<string, 'warning' | 'primary' | 'success' | 'error'> = {
  Pendiente: 'warning',
  'En Proceso': 'primary',
  Finalizada: 'success',
  Cancelada: 'error',
};

export default function ProduccionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [orden, setOrden] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await getOrdenesProduccion();
        const found = all.find((o: any) => String(o.id_orden_produccion) === String(id));
        setOrden(found ?? null);
      } catch (err) {
        Alert.alert('Error', parseGraphQLError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!orden)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFound, { color: theme.text }]}>Orden no encontrada</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: Colors.primary }]}>← Volver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>Orden #{orden.id_orden_produccion}</Text>
          <Badge
            text={orden.estado ?? 'Pendiente'}
            color={ESTADO_BADGE[orden.estado ?? 'Pendiente'] ?? 'secondary'}
          />
        </View>
        <Text style={[styles.date, { color: theme.muted }]}>{formatDate(orden.fecha_orden)}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Producto</Text>
          <Text style={[styles.value, { color: theme.text }]}>{orden.producto?.nombre ?? 'N/A'}</Text>
          {orden.producto?.sku && (
            <Text style={[styles.meta, { color: theme.muted }]}>SKU: {orden.producto.sku}</Text>
          )}
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.muted }]}>Cantidad a producir:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{orden.cantidad_a_producir}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Empleado</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {orden.empleado?.nombre_completo ?? 'N/A'}
          </Text>
        </View>

        {orden.detalles && orden.detalles.length > 0 ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Insumos consumidos</Text>
            {orden.detalles.map((det: any) => (
              <View key={det.id_det_orden} style={[styles.detalle, { borderColor: theme.border }]}>
                <Text style={[styles.detalleName, { color: theme.text }]}>
                  {det.insumo?.nombre ?? `Insumo #${det.id_det_orden}`}
                </Text>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, { color: theme.muted }]}>Cantidad consumida:</Text>
                  <Text style={[styles.detalleValue, { color: theme.text }]}>{det.cantidad_consumida}</Text>
                </View>
                {det.insumo?.unidad_medida && (
                  <View style={styles.detalleRow}>
                    <Text style={[styles.detalleLabel, { color: theme.muted }]}>Unidad:</Text>
                    <Text style={[styles.detalleValue, { color: theme.text }]}>{det.insumo.unidad_medida}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: Colors.primary }]}
          onPress={() =>
            router.push({ pathname: '/(app)/produccion/create', params: { id: String(orden.id_orden_produccion) } })
          }
        >
          <Text style={styles.buttonText}>✏️ Editar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  backRow: { marginBottom: Spacing.sm },
  back: { fontSize: 16, fontWeight: '500' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  title: { ...Typography.h2 },
  date: { fontSize: 13, marginBottom: Spacing.md },
  notFound: { padding: Spacing.xl, textAlign: 'center' },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.subtitle, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13 },
  value: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, marginBottom: 4 },
  detalle: { borderTopWidth: 1, paddingTop: Spacing.sm, marginTop: Spacing.sm },
  detalleName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  detalleLabel: { fontSize: 12 },
  detalleValue: { fontSize: 12, fontWeight: '600' },
  editButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
