import React, { useState } from 'react';
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
    stock_actual: existing?.stock_actual != null ? String(existing.stock_actual) : '',
    stock_minimo_alerta: existing?.stock_minimo_alerta != null ? String(existing.stock_minimo_alerta) : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.unidad_medida.trim()) newErrors.unidad_medida = 'La unidad es requerida';
    if (form.stock_actual.trim() && isNaN(Number(form.stock_actual))) newErrors.stock_actual = 'Ingresa un número';
    if (form.stock_minimo_alerta.trim() && isNaN(Number(form.stock_minimo_alerta))) newErrors.stock_minimo_alerta = 'Ingresa un número';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEditing && existing) {
        const input: any = {
          id_insumo: existing.id_insumo,
          nombre: form.nombre.trim(),
          unidad_medida: form.unidad_medida.trim(),
          stock_actual: form.stock_actual.trim() ? parseFloat(form.stock_actual) : 0,
          stock_minimo_alerta: form.stock_minimo_alerta.trim() ? parseFloat(form.stock_minimo_alerta) : 0,
        };
        const updated = await updateInsumo(input);
        updateInsumoStore({ ...existing, ...updated, ...input });
        show(`Insumo "${input.nombre}" (${input.unidad_medida}) actualizado`, 'success');
      } else {
        // En creación, el backend no acepta stock_actual en el input
        const apiInput: any = {
          nombre: form.nombre.trim(),
          unidad_medida: form.unidad_medida.trim(),
          stock_minimo_alerta: form.stock_minimo_alerta.trim() ? parseFloat(form.stock_minimo_alerta) : 0,
        };
        
        const created = await createInsumo(apiInput);
        
        // Pero en el store local sí guardamos lo que el usuario escribió para que no salga "avisa"
        addInsumo({ 
          ...created, 
          ...apiInput, 
          stock_actual: form.stock_actual.trim() ? parseFloat(form.stock_actual) : 0 
        }); 
        
        show(`Insumo "${apiInput.nombre}" (${apiInput.unidad_medida}) registrado`, 'success');
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>{isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Datos del Material</Text>
                
                <Input
                    label="NOMBRE"
                    value={form.nombre}
                    onChangeText={(v) => setField('nombre', v)}
                    placeholder="Ej. bases metalicas 3.5 cm"
                    error={errors.nombre}
                    autoCapitalize="sentences"
                />

                <Input
                    label="UNIDAD DE MEDIDA"
                    value={form.unidad_medida}
                    onChangeText={(v) => setField('unidad_medida', v)}
                    placeholder="Ej. kg, lt, pzas"
                    error={errors.unidad_medida}
                    autoCapitalize="none"
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
                    <View style={{ flex: 1 }}>
                        <Input
                            label="ALERTA MÍNIMA"
                            value={form.stock_minimo_alerta}
                            onChangeText={(v) => setField('stock_minimo_alerta', v)}
                            placeholder="0"
                            error={errors.stock_minimo_alerta}
                            keyboardType="decimal-pad"
                        />
                    </View>
                </View>

                <Button
                    title={isEditing ? 'GUARDAR CAMBIOS' : 'REGISTRAR INSUMO'}
                    onPress={handleSubmit}
                    loading={submitting}
                    style={styles.submitBtn}
                />
            </View>
        </ScrollView>

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: { padding: 20 },
  formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 15 },
  submitBtn: { marginTop: 20, height: 55 },
});
