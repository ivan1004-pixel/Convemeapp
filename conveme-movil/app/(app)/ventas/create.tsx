import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createVenta, updateVenta } from '../../../src/services/venta.service';
import { useVentaStore } from '../../../src/store/ventaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Venta } from '../../../src/types';

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];
const ESTADOS_VENTA = ['Pendiente', 'Completada', 'Cancelada'];

interface SelectorProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  isDark: boolean;
}

function Selector({ label, options, selected, onSelect, isDark }: SelectorProps) {
  const theme = isDark ? Colors.dark2 : Colors.light2;
  return (
    <View style={selectorStyles.container}>
      <Text style={[selectorStyles.label, { color: theme.text }]}>{label}</Text>
      <View style={selectorStyles.row}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={({ pressed }) => [
              selectorStyles.chip,
              { borderColor: selected === opt ? Colors.primary : theme.border },
              selected === opt && selectorStyles.chipSelected,
              pressed && selectorStyles.chipPressed,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                selectorStyles.chipText,
                { color: selected === opt ? Colors.primary : theme.muted },
                selected === opt && selectorStyles.chipTextSelected,
              ]}
            >
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { ...Typography.label, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipSelected: { backgroundColor: Colors.primaryLight },
  chipPressed: { opacity: 0.75 },
  chipText: { ...Typography.bodySmall },
  chipTextSelected: { fontWeight: '600' },
});

export default function VentaCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { ventas, addVenta, updateVenta: updateVentaStore } = useVentaStore();

  const isEditing = !!id;
  const existing: Venta | undefined = isEditing
    ? ventas.find((v) => v.id_venta === Number(id))
    : undefined;

  const [form, setForm] = useState({
    metodo_pago: existing?.metodo_pago ?? 'Efectivo',
    estado: existing?.estado ?? 'Pendiente',
    monto_total: existing ? String(existing.monto_total) : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.monto_total.trim()) {
      newErrors.monto_total = 'El monto total es requerido';
    } else if (isNaN(Number(form.monto_total)) || Number(form.monto_total) < 0) {
      newErrors.monto_total = 'Ingresa un monto válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEditing && existing) {
        const updated = await updateVenta({
          id_venta: existing.id_venta,
          metodo_pago: form.metodo_pago,
          estado: form.estado,
        });
        updateVentaStore({ ...existing, ...updated });
      } else {
        const created = await createVenta({
          metodo_pago: form.metodo_pago,
          estado: form.estado,
          monto_total: Number(form.monto_total),
        });
        addVenta(created);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>
          {isEditing ? 'Editar Venta' : 'Nueva Venta'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Monto Total *"
          value={form.monto_total}
          onChangeText={(v) => setField('monto_total', v)}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.monto_total}
          editable={!isEditing}
        />

        <Selector
          label="Método de Pago"
          options={METODOS_PAGO}
          selected={form.metodo_pago}
          onSelect={(v) => setField('metodo_pago', v)}
          isDark={isDark}
        />

        <Selector
          label="Estado"
          options={ESTADOS_VENTA}
          selected={form.estado}
          onSelect={(v) => setField('estado', v)}
          isDark={isDark}
        />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Registrar venta'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitBtn}
        />

        <Button
          title="Cancelar"
          variant="ghost"
          onPress={() => router.back()}
          disabled={submitting}
          style={styles.cancelBtn}
        />
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
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  backIcon: { fontSize: 22, color: Colors.primary },
  title: { ...Typography.h4, flex: 1 },
  headerPlaceholder: { width: 32 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  submitBtn: { marginTop: Spacing.md },
  cancelBtn: { marginTop: Spacing.sm },
});
