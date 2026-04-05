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
import { createTamano, updateTamano } from '../../../src/services/tamano.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';

export default function TamanoCreateScreen() {
  const { id, descripcion: descParam } = useLocalSearchParams<{ id?: string; descripcion?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const isEditing = !!id;
  const [descripcion, setDescripcion] = useState(descParam ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!descripcion.trim()) {
      setError('La descripción es requerida.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await updateTamano({ id_tamano: Number(id), descripcion: descripcion.trim() });
      } else {
        await createTamano({ descripcion: descripcion.trim() });
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSaving(false);
    }
  }, [descripcion, isEditing, id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: Colors.primary }]}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          {isEditing ? 'Editar tamaño' : 'Nuevo tamaño'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input
          label="Descripción *"
          value={descripcion}
          onChangeText={(v) => {
            setDescripcion(v);
            if (error) setError('');
          }}
          placeholder="Ej. Grande, Mediano, XL..."
          autoFocus
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear tamaño'}
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
  backBtn: { marginRight: Spacing.xs },
  backText: { ...Typography.body, fontWeight: '600' },
  title: { ...Typography.h4, flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  errorText: { ...Typography.bodySmall, color: Colors.error, marginTop: -Spacing.xs },
  submitBtn: { marginTop: Spacing.md },
});
