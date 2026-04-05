import React, { useState, useCallback } from 'react';
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
import { createVendedor, updateVendedor } from '../../../src/services/vendedor.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';

interface FormState {
  nombre_completo: string;
  email: string;
  telefono: string;
  instagram_handle: string;
  comision_fija_menudeo: string;
  comision_fija_mayoreo: string;
  meta_ventas_mensual: string;
}

export default function VendedorCreateScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    nombre_completo?: string;
    email?: string;
    telefono?: string;
    instagram_handle?: string;
    comision_fija_menudeo?: string;
    comision_fija_mayoreo?: string;
    meta_ventas_mensual?: string;
  }>();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const isEditing = !!params.id;

  const [form, setForm] = useState<FormState>({
    nombre_completo: params.nombre_completo ?? '',
    email: params.email ?? '',
    telefono: params.telefono ?? '',
    instagram_handle: params.instagram_handle ?? '',
    comision_fija_menudeo: params.comision_fija_menudeo ?? '',
    comision_fija_mayoreo: params.comision_fija_mayoreo ?? '',
    meta_ventas_mensual: params.meta_ventas_mensual ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const setField = useCallback((key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.nombre_completo.trim()) newErrors.nombre_completo = 'El nombre es requerido.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const input: Record<string, unknown> = {
        nombre_completo: form.nombre_completo.trim(),
      };
      if (form.email.trim()) input.email = form.email.trim();
      if (form.telefono.trim()) input.telefono = form.telefono.trim();
      if (form.instagram_handle.trim()) input.instagram_handle = form.instagram_handle.trim();
      if (form.comision_fija_menudeo) input.comision_fija_menudeo = parseFloat(form.comision_fija_menudeo);
      if (form.comision_fija_mayoreo) input.comision_fija_mayoreo = parseFloat(form.comision_fija_mayoreo);
      if (form.meta_ventas_mensual) input.meta_ventas_mensual = parseFloat(form.meta_ventas_mensual);

      if (isEditing) {
        await updateVendedor({ ...input, id_vendedor: Number(params.id) });
      } else {
        await createVendedor(input);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSaving(false);
    }
  }, [form, isEditing, params.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: Colors.primary }]}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          {isEditing ? 'Editar vendedor' : 'Nuevo vendedor'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input
          label="Nombre completo *"
          value={form.nombre_completo}
          onChangeText={(v) => setField('nombre_completo', v)}
          placeholder="Ej. María García López"
          error={errors.nombre_completo}
          autoFocus
        />
        <Input
          label="Email"
          value={form.email}
          onChangeText={(v) => setField('email', v)}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Teléfono"
          value={form.telefono}
          onChangeText={(v) => setField('telefono', v)}
          placeholder="10 dígitos"
          keyboardType="phone-pad"
        />
        <Input
          label="Instagram"
          value={form.instagram_handle}
          onChangeText={(v) => setField('instagram_handle', v)}
          placeholder="@usuario (sin @)"
          autoCapitalize="none"
        />
        <Input
          label="Comisión menudeo (%)"
          value={form.comision_fija_menudeo}
          onChangeText={(v) => setField('comision_fija_menudeo', v)}
          placeholder="Ej. 10"
          keyboardType="numeric"
        />
        <Input
          label="Comisión mayoreo (%)"
          value={form.comision_fija_mayoreo}
          onChangeText={(v) => setField('comision_fija_mayoreo', v)}
          placeholder="Ej. 15"
          keyboardType="numeric"
        />
        <Input
          label="Meta ventas mensual ($)"
          value={form.meta_ventas_mensual}
          onChangeText={(v) => setField('meta_ventas_mensual', v)}
          placeholder="Ej. 5000"
          keyboardType="numeric"
        />

        <Button
          title={saving ? 'Guardando...' : isEditing ? 'Actualizar vendedor' : 'Crear vendedor'}
          loading={saving}
          onPress={handleSubmit}
          style={styles.submitBtn}
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backText: { ...Typography.body, fontWeight: '600' },
  title: { ...Typography.h4, flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  submitBtn: { marginTop: Spacing.md },
});
