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
import { createEscuela, updateEscuela } from '../../../src/services/escuela.service';
import { useEscuelaStore } from '../../../src/store/escuelaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Escuela } from '../../../src/types';

export default function EscuelaCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { escuelas, addEscuela, updateEscuela: updateEscuelaStore } = useEscuelaStore();

  const isEditing = !!id;
  const existing: Escuela | undefined = isEditing
    ? escuelas.find((e) => e.id_escuela === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre: existing?.nombre ?? '',
    siglas: existing?.siglas ?? '',
    municipio_id: existing?.municipio?.id_municipio != null
      ? String(existing.municipio.id_municipio)
      : '',
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
    if (!form.siglas.trim()) {
      newErrors.siglas = 'Las siglas son requeridas';
    }
    if (form.municipio_id.trim() && isNaN(Number(form.municipio_id))) {
      newErrors.municipio_id = 'Ingresa un ID numérico válido';
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
        siglas: form.siglas.trim().toUpperCase(),
      };
      if (form.municipio_id.trim()) input.municipio_id = parseInt(form.municipio_id, 10);

      if (isEditing && existing) {
        const updated = await updateEscuela({ id_escuela: existing.id_escuela, ...input } as any);
        updateEscuelaStore({ ...existing, ...updated });
      } else {
        const created = await createEscuela(input as any);
        addEscuela(created);
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
          {isEditing ? 'Editar Escuela' : 'Nueva Escuela'}
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
          placeholder="Nombre completo de la escuela"
          error={errors.nombre}
          autoCapitalize="words"
        />

        <Input
          label="Siglas *"
          value={form.siglas}
          onChangeText={(v) => setField('siglas', v.toUpperCase())}
          placeholder="Ej. UNAM, IPN"
          error={errors.siglas}
          autoCapitalize="characters"
          maxLength={10}
        />

        <Input
          label="ID Municipio"
          value={form.municipio_id}
          onChangeText={(v) => setField('municipio_id', v)}
          placeholder="ID numérico del municipio"
          error={errors.municipio_id}
          keyboardType="numeric"
          helperText="Ingresa el ID del municipio al que pertenece"
        />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Crear escuela'}
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
