import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createCliente, updateCliente } from '../../../src/services/cliente.service';
import { useClienteStore } from '../../../src/store/clienteStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Toast, useToast } from '../../../src/components/Toast';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Cliente } from '../../../src/types';

export default function ClienteCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { toast, show: showToast, hide: hideToast } = useToast();
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('Por favor completa los campos requeridos', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const input: any = {
        nombre_completo: form.nombre_completo.trim(),
      };
      if (form.email?.trim()) input.email = form.email.trim();
      if (form.telefono?.trim()) input.telefono = form.telefono.trim();
      if (form.direccion_envio?.trim()) input.direccion_envio = form.direccion_envio.trim();

      if (isEditing && existing) {
        const updated = await updateCliente({ id_cliente: existing.id_cliente, ...input });
        updateClienteStore({ ...existing, ...updated });
        showToast('Cliente actualizado con éxito', 'success');
      } else {
        const created = await createCliente(input);
        addCliente(created);
        showToast('Cliente registrado con éxito', 'success');
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <Text style={styles.title}>
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
            
            <Input
              label="Nombre completo *"
              value={form.nombre_completo}
              onChangeText={(v) => setField('nombre_completo', v)}
              placeholder="Ej. María García"
              error={errors.nombre_completo}
              autoCapitalize="words"
              leftIcon={<MaterialCommunityIcons name="account-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              placeholder="correo@ejemplo.com"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<MaterialCommunityIcons name="email-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="Teléfono"
              value={form.telefono}
              onChangeText={(v) => setField('telefono', v)}
              placeholder="10 dígitos"
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<MaterialCommunityIcons name="phone-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="Dirección de envío"
              value={form.direccion_envio}
              onChangeText={(v) => setField('direccion_envio', v)}
              placeholder="Calle, número, colonia..."
              leftIcon={<MaterialCommunityIcons name="map-marker-outline" size={20} color={Colors.primary} />}
              multiline
            />
          </View>

          <Button
            title={isEditing ? 'GUARDAR CAMBIOS' : 'REGISTRAR CLIENTE'}
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            style={styles.submitBtn}
          />
        </ScrollView>

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
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
  title: {
    ...Typography.h3,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  headerPlaceholder: {
    width: 34,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  submitBtn: {
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
