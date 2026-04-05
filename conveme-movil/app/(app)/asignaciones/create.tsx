import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createAsignacion, updateAsignacion } from '../../../src/services/asignacion.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';

const ESTADOS = ['Pendiente', 'Activa', 'Cerrada'] as const;
type Estado = (typeof ESTADOS)[number];

interface SelectorProps {
  label: string;
  options: readonly string[];
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

export default function AsignacionCreateScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    vendedor_id?: string;
    estado?: string;
  }>();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const isEditing = !!params.id;

  const [vendedorId, setVendedorId] = useState(params.vendedor_id ?? '');
  const [estado, setEstado] = useState<Estado>((params.estado as Estado) ?? 'Pendiente');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ vendedor_id?: string }>({});

  const validate = (): boolean => {
    const newErrors: { vendedor_id?: string } = {};
    if (!vendedorId.trim() || isNaN(Number(vendedorId))) {
      newErrors.vendedor_id = 'Ingresa un ID de vendedor válido.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const input = {
        vendedor_id: Number(vendedorId),
        estado,
      };
      if (isEditing) {
        await updateAsignacion({ ...input, id_asignacion: Number(params.id) });
      } else {
        await createAsignacion(input);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSaving(false);
    }
  }, [vendedorId, estado, isEditing, params.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: Colors.primary }]}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          {isEditing ? 'Editar asignación' : 'Nueva asignación'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input
          label="ID Vendedor *"
          value={vendedorId}
          onChangeText={(v) => {
            setVendedorId(v);
            setErrors({});
          }}
          placeholder="Ej. 3"
          keyboardType="numeric"
          error={errors.vendedor_id}
          autoFocus
        />

        <Selector
          label="Estado"
          options={ESTADOS}
          selected={estado}
          onSelect={(v) => setEstado(v as Estado)}
          isDark={isDark}
        />

        <Button
          title={saving ? 'Guardando...' : isEditing ? 'Actualizar asignación' : 'Crear asignación'}
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
