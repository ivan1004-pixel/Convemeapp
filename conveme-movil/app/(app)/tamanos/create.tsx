import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createTamano, updateTamano } from '../../../src/services/tamano.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { Button, Input } from '../../../src/components/ui';
import { parseGraphQLError } from '../../../src/utils';

export default function TamanoCreateScreen() {
  const { id, descripcion: descParam } = useLocalSearchParams<{ id?: string; descripcion?: string }>();
  const { toast, show, hide } = useToast();

  const isEditing = !!id;
  const [descripcion, setDescripcion] = useState(descParam ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!descripcion.trim()) {
      setError('LA DESCRIPCIÓN ES REQUERIDA');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await updateTamano({ id_tamano: Number(id), descripcion: descripcion.trim() });
        show('TAMAÑO ACTUALIZADO CON ÉXITO', 'success');
      } else {
        await createTamano({ descripcion: descripcion.trim() });
        show('TAMAÑO CREADO CON ÉXITO', 'success');
      }
      setTimeout(() => router.replace('/tamanos'), 1500);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setSaving(false);
    }
  }, [descripcion, isEditing, id, show]);

  return (
    <NeobrutalistBackground>
    <SafeAreaView style={styles.container} edges={['top']}>
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <View style={styles.header}>
    <TouchableOpacity
    onPress={() => router.replace('/tamanos')}
    style={styles.backBtn}
    >
    <MaterialCommunityIcons
    name="arrow-left"
    size={24}
    color={Colors.primary}
    />
    </TouchableOpacity>
    <Text style={styles.title}>
    {isEditing ? 'EDITAR TAMAÑO' : 'NUEVO TAMAÑO'}
    </Text>
    <View style={{ width: 40 }} />
    </View>

    <ScrollView
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    >
    <View style={styles.card}>
    <Text style={styles.sectionTitle}>DATOS DEL TAMAÑO</Text>

    <Input
    label="DESCRIPCIÓN DEL TAMAÑO *"
    value={descripcion}
    onChangeText={(v) => {
      setDescripcion(v);
      if (error) setError('');
    }}
    placeholder="EJ: GRANDE, MEDIANO, XL..."
    error={error}
    autoFocus
    autoCapitalize="characters"
    leftIcon={
      <MaterialCommunityIcons
      name="ruler"
      size={20}
      color={Colors.primary}
      />
    }
    />

    <Button
    title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR TAMAÑO'}
    loading={saving}
    onPress={handleSubmit}
    size="lg"
    style={styles.submitBtn}
    />
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
    <Toast
    visible={toast.visible}
    type={toast.type}
    message={toast.message}
    onHide={hide}
    />
    </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 160,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 20,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  submitBtn: {
    marginTop: 10,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5,
  },
});
