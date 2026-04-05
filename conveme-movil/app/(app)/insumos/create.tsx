import React, { useState } from 'react';
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
import { createInsumo, updateInsumo } from '../../../src/services/insumo.service';
import { useInsumoStore } from '../../../src/store/insumoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Insumo } from '../../../src/types';

export default function InsumoCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { insumos, addInsumo, updateInsumo: updateInsumoStore } = useInsumoStore();

  const isEditing = !!id;
  const existing: Insumo | undefined = isEditing
    ? insumos.find((i) => i.id_insumo === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre: existing?.nombre ?? '',
    unidad_medida: existing?.unidad_medida ?? '',
    stock_actual: existing?.stock_actual != null ? String(existing.stock_actual) : '',
    stock_minimo_alerta: existing?.stock_minimo_alerta != null ? String(existing.stock_minimo_alerta) : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!form.unidad_medida.trim()) {
      newErrors.unidad_medida = 'La unidad de medida es requerida';
    }
    if (form.stock_actual.trim() && isNaN(Number(form.stock_actual))) {
      newErrors.stock_actual = 'Ingresa un número válido';
    }
    if (form.stock_minimo_alerta.trim() && isNaN(Number(form.stock_minimo_alerta))) {
      newErrors.stock_minimo_alerta = 'Ingresa un número válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const input: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        unidad_medida: form.unidad_medida.trim(),
      };
      if (form.stock_actual.trim()) input.stock_actual = parseFloat(form.stock_actual);
      if (form.stock_minimo_alerta.trim()) input.stock_minimo_alerta = parseFloat(form.stock_minimo_alerta);

      if (isEditing && existing) {
        const updated = await updateInsumo({ id_insumo: existing.id_insumo, ...input });
        updateInsumoStore({ ...existing, ...updated });
      } else {
        const created = await createInsumo(input);
        addInsumo(created);
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
          <Text style={[styles.backIcon, { color: Colors.primary }]}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>
          {isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Nombre *"
          value={form.nombre}
          onChangeText={(v) => setField('nombre', v)}
          placeholder="Ej. Harina de trigo"
          error={errors.nombre}
          autoCapitalize="sentences"
        />

        <Input
          label="Unidad de medida *"
          value={form.unidad_medida}
          onChangeText={(v) => setField('unidad_medida', v)}
          placeholder="Ej. kg, lt, pzas"
          error={errors.unidad_medida}
          autoCapitalize="none"
        />

        <Input
          label="Stock actual"
          value={form.stock_actual}
          onChangeText={(v) => setField('stock_actual', v)}
          placeholder="0"
          error={errors.stock_actual}
          keyboardType="decimal-pad"
          helperText="Cantidad disponible actualmente"
        />

        <Input
          label="Stock mínimo alerta"
          value={form.stock_minimo_alerta}
          onChangeText={(v) => setField('stock_minimo_alerta', v)}
          placeholder="0"
          error={errors.stock_minimo_alerta}
          keyboardType="decimal-pad"
          helperText="Se mostrará una advertencia al llegar a este nivel"
        />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Crear insumo'}
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '500',
  },
  title: {
    ...Typography.h3,
  },
  headerPlaceholder: {
    width: 34,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
