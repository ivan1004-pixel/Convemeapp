import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createPromocion, updatePromocion } from '../../../src/services/promocion.service';
import { usePromocionStore } from '../../../src/store/promocionStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Promocion } from '../../../src/types';

type TipoPromocion = 'PORCENTAJE' | 'MONTO';

export default function PromocionCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { promociones, addPromocion, updatePromocion: updatePromocionStore } = usePromocionStore();

  const isEditing = !!id;
  const existing: Promocion | undefined = isEditing
    ? promociones.find((p) => p.id_promocion === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre: existing?.nombre ?? '',
    descripcion: existing?.descripcion ?? '',
    tipo_promocion: (existing?.tipo_promocion as TipoPromocion) ?? 'PORCENTAJE',
    valor_descuento: existing?.valor_descuento != null ? String(existing.valor_descuento) : '',
    fecha_inicio: existing?.fecha_inicio ?? '',
    fecha_fin: existing?.fecha_fin ?? '',
    activa: existing?.activa ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (typeof value === 'string' && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (form.valor_descuento.trim() && isNaN(Number(form.valor_descuento))) {
      newErrors.valor_descuento = 'Ingresa un número válido';
    }
    if (
      form.tipo_promocion === 'PORCENTAJE' &&
      form.valor_descuento.trim() &&
      (Number(form.valor_descuento) < 0 || Number(form.valor_descuento) > 100)
    ) {
      newErrors.valor_descuento = 'El porcentaje debe estar entre 0 y 100';
    }
    if (form.fecha_inicio.trim() && isNaN(Date.parse(form.fecha_inicio.trim()))) {
      newErrors.fecha_inicio = 'Ingresa una fecha válida (YYYY-MM-DD)';
    }
    if (form.fecha_fin.trim() && isNaN(Date.parse(form.fecha_fin.trim()))) {
      newErrors.fecha_fin = 'Ingresa una fecha válida (YYYY-MM-DD)';
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
        tipo_promocion: form.tipo_promocion,
        activa: form.activa,
      };
      if (form.descripcion.trim()) input.descripcion = form.descripcion.trim();
      if (form.valor_descuento.trim()) input.valor_descuento = parseFloat(form.valor_descuento);
      if (form.fecha_inicio.trim()) input.fecha_inicio = form.fecha_inicio.trim();
      if (form.fecha_fin.trim()) input.fecha_fin = form.fecha_fin.trim();

      if (isEditing && existing) {
        const updated = await updatePromocion({ id_promocion: existing.id_promocion, ...input });
        updatePromocionStore({ ...existing, ...updated });
      } else {
        const created = await createPromocion(input);
        addPromocion(created);
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
          {isEditing ? 'Editar Promoción' : 'Nueva Promoción'}
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
          placeholder="Nombre de la promoción"
          error={errors.nombre}
          autoCapitalize="sentences"
        />

        <Input
          label="Descripción"
          value={form.descripcion}
          onChangeText={(v) => setField('descripcion', v)}
          placeholder="Describe la promoción..."
          autoCapitalize="sentences"
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        {/* Tipo de promoción toggle */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Tipo de promoción</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: form.tipo_promocion === 'PORCENTAJE' ? Colors.primary : theme.surface,
                  borderColor: form.tipo_promocion === 'PORCENTAJE' ? Colors.primary : theme.border,
                },
              ]}
              onPress={() => setField('tipo_promocion', 'PORCENTAJE')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: form.tipo_promocion === 'PORCENTAJE' ? '#fff' : theme.text },
                ]}
              >
                % Porcentaje
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: form.tipo_promocion === 'MONTO' ? Colors.primary : theme.surface,
                  borderColor: form.tipo_promocion === 'MONTO' ? Colors.primary : theme.border,
                },
              ]}
              onPress={() => setField('tipo_promocion', 'MONTO')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: form.tipo_promocion === 'MONTO' ? '#fff' : theme.text },
                ]}
              >
                $ Monto fijo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Input
          label={form.tipo_promocion === 'PORCENTAJE' ? 'Porcentaje de descuento' : 'Monto de descuento'}
          value={form.valor_descuento}
          onChangeText={(v) => setField('valor_descuento', v)}
          placeholder={form.tipo_promocion === 'PORCENTAJE' ? 'Ej. 10 (para 10%)' : 'Ej. 50.00'}
          error={errors.valor_descuento}
          keyboardType="decimal-pad"
        />

        <Input
          label="Fecha inicio"
          value={form.fecha_inicio}
          onChangeText={(v) => setField('fecha_inicio', v)}
          placeholder="YYYY-MM-DD"
          error={errors.fecha_inicio}
          keyboardType="numeric"
        />

        <Input
          label="Fecha fin"
          value={form.fecha_fin}
          onChangeText={(v) => setField('fecha_fin', v)}
          placeholder="YYYY-MM-DD"
          error={errors.fecha_fin}
          keyboardType="numeric"
        />

        {/* Activa toggle */}
        <View style={[styles.switchRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.switchLabel, { color: theme.text }]}>Promoción activa</Text>
          <Switch
            value={form.activa}
            onValueChange={(v) => setField('activa', v)}
            trackColor={{ false: theme.border, true: Colors.primaryLight }}
            thumbColor={form.activa ? Colors.primary : theme.muted}
          />
        </View>

        <Button
          title={isEditing ? 'Guardar cambios' : 'Crear promoción'}
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
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: {
    ...Typography.button,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  switchLabel: {
    ...Typography.body,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
