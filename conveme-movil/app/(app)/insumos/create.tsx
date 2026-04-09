import React, { useState } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createInsumo, updateInsumo } from '../../../src/services/insumo.service';
import { useInsumoStore } from '../../../src/store/insumoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import type { Insumo } from '../../../src/types';

export default function InsumoCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toast, show, hide } = useToast();
  const { insumos, addInsumo, updateInsumo: updateInsumoStore } = useInsumoStore();

  const isEditing = !!id;
  const existing: Insumo | undefined = isEditing
  ? insumos.find((i) => i.id_insumo === Number(id))
  : undefined;

  const [form, setForm] = useState({
    nombre: existing?.nombre ?? '',
    unidad_medida: existing?.unidad_medida ?? '',
    stock_actual:
    existing?.stock_actual != null ? String(existing.stock_actual) : '',
                                   stock_minimo_alerta:
                                   existing?.stock_minimo_alerta != null
                                   ? String(existing.stock_minimo_alerta)
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
    if (!form.nombre.trim()) newErrors.nombre = 'REQUERIDO';
    if (!form.unidad_medida.trim())
      newErrors.unidad_medida = 'REQUERIDO';
    if (form.stock_actual.trim() && isNaN(Number(form.stock_actual)))
      newErrors.stock_actual = 'NÚMERO INVÁLIDO';
    if (
      form.stock_minimo_alerta.trim() &&
        isNaN(Number(form.stock_minimo_alerta))
    )
      newErrors.stock_minimo_alerta = 'NÚMERO INVÁLIDO';

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      show('COMPLETA LOS CAMPOS REQUERIDOS', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      if (isEditing && existing) {
        const input: any = {
          id_insumo: existing.id_insumo,
          nombre: form.nombre.trim(),
          unidad_medida: form.unidad_medida.trim(),
          stock_actual: form.stock_actual.trim()
          ? parseFloat(form.stock_actual)
          : 0,
          stock_minimo_alerta: form.stock_minimo_alerta.trim()
          ? parseFloat(form.stock_minimo_alerta)
          : 0,
        };
        const updated = await updateInsumo(input);
        updateInsumoStore({ ...existing, ...updated, ...input });
        show('MATERIAL ACTUALIZADO CON ÉXITO', 'success');
      } else {
        const apiInput: any = {
          nombre: form.nombre.trim(),
          unidad_medida: form.unidad_medida.trim(),
          stock_minimo_alerta: form.stock_minimo_alerta.trim()
          ? parseFloat(form.stock_minimo_alerta)
          : 0,
        };
        const created = await createInsumo(apiInput);
        addInsumo({
          ...created,
          ...apiInput,
          stock_actual: form.stock_actual.trim()
          ? parseFloat(form.stock_actual)
          : 0,
        });
        show('MATERIAL REGISTRADO CON ÉXITO', 'success');
      }
      setTimeout(() => router.replace('/insumos'), 1200);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NeobrutalistBackground>
    <SafeAreaView style={styles.container} edges={['top']}>
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <View style={styles.header}>
    <TouchableOpacity
    onPress={() => router.replace('/insumos')}
    style={styles.backBtn}
    >
    <MaterialCommunityIcons
    name="arrow-left"
    size={24}
    color={Colors.primary}
    />
    </TouchableOpacity>
    <Text style={styles.title}>
    {isEditing ? 'EDITAR INSUMO' : 'NUEVO INSUMO'}
    </Text>
    <View style={{ width: 40 }} />
    </View>

    <ScrollView
    contentContainerStyle={styles.scrollContent}
    keyboardShouldPersistTaps="handled"
    >
    <View style={styles.card}>
    <Text style={styles.sectionTitle}>
    DETALLES DEL MATERIAL
    </Text>

    <Input
    label="NOMBRE DEL MATERIAL *"
    value={form.nombre}
    onChangeText={(v) => setField('nombre', v)}
    placeholder="EJ: BASES METÁLICAS 3.5 CM"
    error={errors.nombre}
    autoCapitalize="characters"
    leftIcon={
      <MaterialCommunityIcons
      name="package-variant"
      size={20}
      color={Colors.primary}
      />
    }
    />

    <Input
    label="UNIDAD DE MEDIDA *"
    value={form.unidad_medida}
    onChangeText={(v) => setField('unidad_medida', v)}
    placeholder="EJ: KG, LT, PZAS, MTS"
    error={errors.unidad_medida}
    autoCapitalize="characters"
    leftIcon={
      <MaterialCommunityIcons
      name="scale"
      size={20}
      color={Colors.primary}
      />
    }
    />

    <View style={styles.row}>
    <View style={{ flex: 1 }}>
    <Input
    label="STOCK ACTUAL"
    value={form.stock_actual}
    onChangeText={(v) => setField('stock_actual', v)}
    placeholder="0"
    error={errors.stock_actual}
    keyboardType="decimal-pad"
    />
    </View>
    <View style={{ width: 15 }} />
    <View style={{ flex: 1 }}>
    <Input
    label="ALERTA MÍNIMA"
    value={form.stock_minimo_alerta}
    onChangeText={(v) =>
      setField('stock_minimo_alerta', v)
    }
    placeholder="0"
    error={errors.stock_minimo_alerta}
    keyboardType="decimal-pad"
    />
    </View>
    </View>
    </View>

    <Button
    title={
      isEditing ? 'GUARDAR CAMBIOS' : 'REGISTRAR MATERIAL'
    }
    onPress={handleSubmit}
    loading={submitting}
    size="lg"
    style={styles.submitBtn}
    />
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
    paddingBottom: 100,
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
  row: { flexDirection: 'row' },
  submitBtn: {
    marginTop: 10,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5,
  },
});
