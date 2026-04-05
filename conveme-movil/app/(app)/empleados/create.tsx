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
import { createEmpleado, updateEmpleado } from '../../../src/services/empleado.service';
import { useEmpleadoStore } from '../../../src/store/empleadoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Empleado } from '../../../src/types';

export default function EmpleadoCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { empleados, addEmpleado, updateEmpleado: updateEmpleadoStore } = useEmpleadoStore();

  const isEditing = !!id;
  const existing: Empleado | undefined = isEditing
    ? empleados.find((e) => e.id_empleado === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre_completo: existing?.nombre_completo ?? '',
    email: existing?.email ?? '',
    telefono: existing?.telefono ?? '',
    puesto: existing?.puesto ?? '',
    calle_y_numero: existing?.calle_y_numero ?? '',
    colonia: existing?.colonia ?? '',
    codigo_postal: existing?.codigo_postal ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre es requerido';
    }
    if (!form.puesto.trim()) {
      newErrors.puesto = 'El puesto es requerido';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    if (form.telefono.trim() && form.telefono.replace(/\D/g, '').length !== 10) {
      newErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const input: Record<string, unknown> = {
        nombre_completo: form.nombre_completo.trim(),
        puesto: form.puesto.trim(),
      };
      if (form.email.trim()) input.email = form.email.trim();
      if (form.telefono.trim()) input.telefono = form.telefono.trim();
      if (form.calle_y_numero.trim()) input.calle_y_numero = form.calle_y_numero.trim();
      if (form.colonia.trim()) input.colonia = form.colonia.trim();
      if (form.codigo_postal.trim()) input.codigo_postal = form.codigo_postal.trim();

      if (isEditing && existing) {
        const updated = await updateEmpleado({ id_empleado: existing.id_empleado, ...input });
        updateEmpleadoStore({ ...existing, ...updated });
      } else {
        const created = await createEmpleado(input);
        addEmpleado(created);
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
          {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Nombre completo *"
          value={form.nombre_completo}
          onChangeText={(v) => setField('nombre_completo', v)}
          placeholder="Ej. Juan Pérez Hernández"
          error={errors.nombre_completo}
          autoCapitalize="words"
        />

        <Input
          label="Puesto *"
          value={form.puesto}
          onChangeText={(v) => setField('puesto', v)}
          placeholder="Ej. Vendedor, Gerente..."
          error={errors.puesto}
          autoCapitalize="words"
        />

        <Input
          label="Email"
          value={form.email}
          onChangeText={(v) => setField('email', v)}
          placeholder="correo@ejemplo.com"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Input
          label="Teléfono"
          value={form.telefono}
          onChangeText={(v) => setField('telefono', v)}
          placeholder="10 dígitos"
          error={errors.telefono}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>Dirección</Text>

        <Input
          label="Calle y número"
          value={form.calle_y_numero}
          onChangeText={(v) => setField('calle_y_numero', v)}
          placeholder="Ej. Av. Independencia 123"
          autoCapitalize="words"
        />

        <Input
          label="Colonia"
          value={form.colonia}
          onChangeText={(v) => setField('colonia', v)}
          placeholder="Ej. Centro"
          autoCapitalize="words"
        />

        <Input
          label="Código postal"
          value={form.codigo_postal}
          onChangeText={(v) => setField('codigo_postal', v)}
          placeholder="5 dígitos"
          keyboardType="numeric"
          maxLength={5}
        />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Crear empleado'}
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
  sectionLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
