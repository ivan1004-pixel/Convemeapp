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
import { createEvento, updateEvento } from '../../../src/services/evento.service';
import { useEventoStore } from '../../../src/store/eventoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Evento } from '../../../src/types';

export default function EventoCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { eventos, addEvento, updateEvento: updateEventoStore } = useEventoStore();

  const isEditing = !!id;
  const existing: Evento | undefined = isEditing
    ? eventos.find((e) => e.id_evento === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre: existing?.nombre ?? '',
    descripcion: existing?.descripcion ?? '',
    fecha_inicio: existing?.fecha_inicio ?? '',
    fecha_fin: existing?.fecha_fin ?? '',
    costo_stand: existing?.costo_stand != null ? String(existing.costo_stand) : '',
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
    if (form.fecha_inicio.trim() && isNaN(Date.parse(form.fecha_inicio.trim()))) {
      newErrors.fecha_inicio = 'Ingresa una fecha válida (YYYY-MM-DD)';
    }
    if (form.fecha_fin.trim() && isNaN(Date.parse(form.fecha_fin.trim()))) {
      newErrors.fecha_fin = 'Ingresa una fecha válida (YYYY-MM-DD)';
    }
    if (form.costo_stand.trim() && isNaN(Number(form.costo_stand))) {
      newErrors.costo_stand = 'Ingresa un número válido';
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
      };
      if (form.descripcion.trim()) input.descripcion = form.descripcion.trim();
      if (form.fecha_inicio.trim()) input.fecha_inicio = form.fecha_inicio.trim();
      if (form.fecha_fin.trim()) input.fecha_fin = form.fecha_fin.trim();
      if (form.costo_stand.trim()) input.costo_stand = parseFloat(form.costo_stand);

      if (isEditing && existing) {
        const updated = await updateEvento({ id_evento: existing.id_evento, ...input });
        updateEventoStore({ ...existing, ...updated });
      } else {
        const created = await createEvento(input);
        addEvento(created);
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
          {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
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
          placeholder="Nombre del evento"
          error={errors.nombre}
          autoCapitalize="words"
        />

        <Input
          label="Descripción"
          value={form.descripcion}
          onChangeText={(v) => setField('descripcion', v)}
          placeholder="Descripción del evento..."
          autoCapitalize="sentences"
          multiline
          numberOfLines={3}
          style={styles.multiline}
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

        <Input
          label="Costo stand"
          value={form.costo_stand}
          onChangeText={(v) => setField('costo_stand', v)}
          placeholder="0.00"
          error={errors.costo_stand}
          keyboardType="decimal-pad"
        />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Crear evento'}
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
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
