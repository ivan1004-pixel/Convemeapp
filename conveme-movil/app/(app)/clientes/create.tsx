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
import { createCliente, updateCliente } from '../../../src/services/cliente.service';
import { useClienteStore } from '../../../src/store/clienteStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Cliente } from '../../../src/types';

export default function ClienteCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { clientes, addCliente, updateCliente: updateClienteStore } = useClienteStore();

  const isEditing = !!id;
  const existing: Cliente | undefined = isEditing
    ? clientes.find((c) => c.id_cliente === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre_completo: existing?.nombre_completo ?? '',
    email: existing?.email ?? '',
    telefono: existing?.telefono ?? '',
    direccion_envio: existing?.direccion_envio ?? '',
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
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    if (form.telefono && form.telefono.replace(/\D/g, '').length !== 10) {
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
      };
      if (form.email.trim()) input.email = form.email.trim();
      if (form.telefono.trim()) input.telefono = form.telefono.trim();
      if (form.direccion_envio.trim()) input.direccion_envio = form.direccion_envio.trim();

      if (isEditing && existing) {
        const updated = await updateCliente({ id_cliente: existing.id_cliente, ...input });
        updateClienteStore({ ...existing, ...updated });
      } else {
        const created = await createCliente(input);
        addCliente(created);
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
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
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
          placeholder="Ej. María García López"
          error={errors.nombre_completo}
          autoCapitalize="words"
        />

        <Input
          label="Email"
          value={form.email}
          onChangeText={(v) => setField('email', v)}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          helperText="Opcional"
        />

        <Input
          label="Teléfono"
          value={form.telefono}
          onChangeText={(v) => setField('telefono', v)}
          placeholder="10 dígitos"
          keyboardType="phone-pad"
          error={errors.telefono}
          helperText="Opcional – 10 dígitos sin espacios"
        />

        <Input
          label="Dirección de envío"
          value={form.direccion_envio}
          onChangeText={(v) => setField('direccion_envio', v)}
          placeholder="Calle, número, colonia..."
          autoCapitalize="sentences"
          helperText="Opcional"
        />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Registrar cliente'}
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
