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
import { getComprobantes, updateComprobante } from '../../../src/services/comprobante.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Comprobante } from '../../../src/types';

function InfoRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  const theme = isDark ? Colors.dark2 : Colors.light2;
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: theme.muted }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  label: { ...Typography.bodySmall, flex: 1 },
  value: { ...Typography.body, flex: 1.5, textAlign: 'right', fontWeight: '500' },
});

export default function ComprobanteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

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
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSaving(false);
    }
  }, [comprobante, saldoInput, montoInput, notasInput, fetchData]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingSpinner fullScreen message="Cargando comprobante..." />
      </SafeAreaView>
    );
  }

  if (!comprobante) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: Colors.primary }]}>‹ Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: theme.muted }]}>Comprobante no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPendiente = (comprobante.saldo_pendiente ?? 0) > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: Colors.primary }]}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Comprobante</Text>
        <Badge
          text={isPendiente ? 'Pendiente' : 'Liquidado'}
          color={isPendiente ? 'warning' : 'success'}
          size="sm"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Información general</Text>
          <InfoRow label="Fecha corte" value={formatDate(comprobante.fecha_corte)} isDark={isDark} />
          <InfoRow label="Vendedor" value={comprobante.vendedor?.nombre_completo ?? '—'} isDark={isDark} />
          <InfoRow label="Admin" value={comprobante.admin?.username ?? '—'} isDark={isDark} />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Montos</Text>
          <InfoRow label="Total vendido" value={formatCurrency(comprobante.total_vendido ?? 0)} isDark={isDark} />
          <InfoRow label="Comisión vendedor" value={formatCurrency(comprobante.comision_vendedor ?? 0)} isDark={isDark} />
          <InfoRow label="Monto entregado" value={formatCurrency(comprobante.monto_entregado ?? 0)} isDark={isDark} />
          <InfoRow
            label="Saldo pendiente"
            value={formatCurrency(comprobante.saldo_pendiente ?? 0)}
            isDark={isDark}
          />
        </View>

        {comprobante.notas ? (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notas</Text>
            <Text style={[styles.notes, { color: theme.muted }]}>{comprobante.notas}</Text>
          </View>
        ) : null}

        {editMode ? (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Actualizar saldo</Text>
            <Input
              label="Monto entregado"
              value={montoInput}
              onChangeText={setMontoInput}
              keyboardType="numeric"
              placeholder="0.00"
            />
            <Input
              label="Saldo pendiente"
              value={saldoInput}
              onChangeText={setSaldoInput}
              keyboardType="numeric"
              placeholder="0.00"
            />
            <Input
              label="Notas"
              value={notasInput}
              onChangeText={setNotasInput}
              placeholder="Observaciones..."
              multiline
            />
            <View style={styles.editActions}>
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setEditMode(false)}
                style={styles.actionBtn}
              />
              <Button
                title={saving ? 'Guardando...' : 'Guardar'}
                loading={saving}
                onPress={handleSave}
                style={styles.actionBtn}
              />
            </View>
          </View>
        ) : (
          <Button
            title="Actualizar saldo"
            variant="secondary"
            onPress={() => setEditMode(true)}
            style={styles.updateBtn}
          />
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
  backBtn: { marginRight: Spacing.xs },
  backText: { ...Typography.body, fontWeight: '600' },
  title: { ...Typography.h4, flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  section: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  notes: { ...Typography.body, lineHeight: 22 },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtn: { flex: 1 },
  updateBtn: { marginTop: Spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...Typography.body },
});
