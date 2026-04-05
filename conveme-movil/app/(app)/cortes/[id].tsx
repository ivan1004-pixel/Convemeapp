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
import { getCortes, deleteCorte } from '../../../src/services/corte.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';

export default function CorteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [corte, setCorte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const all = await getCortes('');
        const found = all.find((c: any) => String(c.id_corte) === String(id));
        setCorte(found ?? null);
      } catch (err) {
        Alert.alert('Error', parseGraphQLError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCorte(Number(id));
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteVisible(false);
    }
  };

  function getDiferenciaColor(diferencia: number) {
    if (diferencia > 0) return Colors.error;
    if (diferencia === 0) return Colors.success;
    return Colors.warning;
  }

  if (loading) return <LoadingSpinner />;
  if (!corte)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFound, { color: theme.text }]}>Corte no encontrado</Text>
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

        <Text style={[styles.title, { color: theme.text }]}>Corte #{corte.id_corte}</Text>
        <Text style={[styles.date, { color: theme.muted }]}>{formatDate(corte.fecha_corte)}</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Vendedor</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {corte.vendedor?.nombre_completo ?? 'N/A'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Montos</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.muted }]}>Dinero Esperado:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{formatCurrency(corte.dinero_esperado)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.muted }]}>Total Entregado:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{formatCurrency(corte.dinero_total_entregado)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.muted }]}>Diferencia:</Text>
            <Text style={[styles.difValue, { color: getDiferenciaColor(corte.diferencia_corte) }]}>
              {formatCurrency(corte.diferencia_corte)}
            </Text>
          </View>
        </View>

        {corte.observaciones ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Observaciones</Text>
            <Text style={[styles.observaciones, { color: theme.text }]}>{corte.observaciones}</Text>
          </View>
        ) : null}

        {corte.detalles && corte.detalles.length > 0 ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Detalles de productos</Text>
            {corte.detalles.map((det: any) => (
              <View key={det.id_det_corte} style={[styles.detalle, { borderColor: theme.border }]}>
                <Text style={[styles.detalleName, { color: theme.text }]}>
                  {det.producto?.nombre ?? `Producto #${det.id_det_corte}`}
                </Text>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, { color: theme.muted }]}>Vendida:</Text>
                  <Text style={[styles.detalleValue, { color: theme.text }]}>{det.cantidad_vendida}</Text>
                </View>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, { color: theme.muted }]}>Devuelta:</Text>
                  <Text style={[styles.detalleValue, { color: theme.text }]}>{det.cantidad_devuelta}</Text>
                </View>
                <View style={styles.detalleRow}>
                  <Text style={[styles.detalleLabel, { color: theme.muted }]}>Merma:</Text>
                  <Text style={[styles.detalleValue, { color: theme.text }]}>{det.merma_reportada}</Text>
                </View>
                {det.producto?.precio_unitario != null && (
                  <View style={styles.detalleRow}>
                    <Text style={[styles.detalleLabel, { color: theme.muted }]}>Precio unitario:</Text>
                    <Text style={[styles.detalleValue, { color: theme.text }]}>
                      {formatCurrency(det.producto.precio_unitario)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: Colors.primary }]}
            onPress={() =>
              router.push({ pathname: '/(app)/cortes/create', params: { id: String(corte.id_corte) } })
            }
          >
            <Text style={styles.buttonText}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: Colors.error }]}
            onPress={() => setDeleteVisible(true)}
          >
            <Text style={styles.buttonText}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={deleteVisible}
        title="Eliminar corte"
        message="¿Deseas eliminar este corte?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  backRow: { marginBottom: Spacing.sm },
  back: { fontSize: 16, fontWeight: '500' },
  title: { ...Typography.h2, marginBottom: 4 },
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
  value: { fontSize: 13, fontWeight: '600' },
  difValue: { fontSize: 16, fontWeight: '800' },
  observaciones: { fontSize: 14, lineHeight: 20 },
  detalle: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  detalleName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  detalleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  detalleLabel: { fontSize: 12 },
  detalleValue: { fontSize: 12, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  editButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
