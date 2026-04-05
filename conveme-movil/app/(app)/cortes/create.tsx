import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getCortes, createCorte, updateCorte } from '../../../src/services/corte.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';

export default function CorteCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [vendedor_id, setVendedorId] = useState('');
  const [asignacion_id, setAsignacionId] = useState('');
  const [dinero_total_entregado, setDineroEntregado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const all = await getCortes('');
        const found = all.find((c: any) => String(c.id_corte) === String(id));
        if (found) {
          setVendedorId(String(found.vendedor?.id_vendedor ?? ''));
          setAsignacionId(String(found.asignacion?.id_asignacion ?? ''));
          setDineroEntregado(String(found.dinero_total_entregado ?? ''));
          setObservaciones(found.observaciones ?? '');
        }
      } catch (err) {
        Alert.alert('Error', parseGraphQLError(err));
      } finally {
        setInitializing(false);
      }
    })();
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!dinero_total_entregado) {
      Alert.alert('Validación', 'El dinero entregado es requerido.');
      return;
    }
    setLoading(true);
    try {
      const input: any = {
        dinero_total_entregado: parseFloat(dinero_total_entregado),
      };
      if (vendedor_id) input.vendedor_id = parseInt(vendedor_id, 10);
      if (asignacion_id) input.asignacion_id = parseInt(asignacion_id, 10);
      if (observaciones) input.observaciones = observaciones;

      if (isEdit) {
        input.id_corte = parseInt(id!, 10);
        await updateCorte(input);
      } else {
        await createCorte(input);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  };

  if (initializing) return <LoadingSpinner />;

  const inputStyle = [styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: Colors.primary }]}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{isEdit ? 'Editar Corte' : 'Nuevo Corte'}</Text>

        <Text style={[styles.label, { color: theme.muted }]}>Vendedor ID</Text>
        <TextInput
          style={inputStyle}
          value={vendedor_id}
          onChangeText={setVendedorId}
          placeholder="ID del vendedor"
          placeholderTextColor={theme.muted}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.muted }]}>Asignación ID</Text>
        <TextInput
          style={inputStyle}
          value={asignacion_id}
          onChangeText={setAsignacionId}
          placeholder="ID de la asignación"
          placeholderTextColor={theme.muted}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.muted }]}>Dinero Total Entregado *</Text>
        <TextInput
          style={inputStyle}
          value={dinero_total_entregado}
          onChangeText={setDineroEntregado}
          placeholder="0.00"
          placeholderTextColor={theme.muted}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, { color: theme.muted }]}>Observaciones</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={observaciones}
          onChangeText={setObservaciones}
          placeholder="Observaciones opcionales..."
          placeholderTextColor={theme.muted}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: Colors.primary }, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Corte'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  backRow: { marginBottom: Spacing.sm },
  back: { fontSize: 16, fontWeight: '500' },
  title: { ...Typography.h2, marginBottom: Spacing.lg },
  label: { fontSize: 13, marginBottom: 4, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  disabledButton: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
