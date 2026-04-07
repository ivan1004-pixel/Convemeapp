import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createPromocion, updatePromocion } from '../../../src/services/promocion.service';
import { usePromocionStore } from '../../../src/store/promocionStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import type { Promocion } from '../../../src/types';

type TipoPromocion = 'PORCENTAJE' | 'MONTO';

const DatePickerModal = memo(({ visible, field, value, onConfirm, onCancel }: any) => {
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1);
    const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const initialParts = value?.split('-') || [];
    const [selYear, setSelYear] = useState(initialParts[0] || new Date().getFullYear().toString());
    const [selMonth, setSelMonth] = useState(initialParts[1] || '01');
    const [selDay, setSelDay] = useState(initialParts[2] || '01');

    useEffect(() => {
        if (value && value.includes('-')) {
            const parts = value.split('-');
            setSelYear(parts[0]);
            setSelMonth(parts[1]);
            setSelDay(parts[2]);
        }
    }, [value, visible]);

    if (!visible) return null;

    return (
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerCard}>
            <Text style={styles.datePickerTitle}>SELECCIONAR FECHA</Text>
            
            <View style={styles.datePickerLabels}>
                <Text style={styles.columnLabel}>AÑO</Text>
                <Text style={styles.columnLabel}>MES</Text>
                <Text style={styles.columnLabel}>DÍA</Text>
            </View>

            <View style={styles.datePickerRows}>
               <FlatList data={years} keyExtractor={y => `y-${y}`} renderItem={({item}) => (
                 <TouchableOpacity onPress={() => setSelYear(item.toString())} style={[styles.dateItem, selYear === item.toString() && styles.dateItemSel]}>
                   <Text style={[styles.dateItemText, selYear === item.toString() && styles.dateItemTextSel]}>{item}</Text>
                 </TouchableOpacity>
               )} style={{height: 150}} showsVerticalScrollIndicator={false} />
               <FlatList data={months} keyExtractor={m => `m-${m}`} renderItem={({item}) => (
                 <TouchableOpacity onPress={() => setSelMonth(item)} style={[styles.dateItem, selMonth === item && styles.dateItemSel]}>
                   <Text style={[styles.dateItemText, selMonth === item && styles.dateItemTextSel]}>{item}</Text>
                 </TouchableOpacity>
               )} style={{height: 150}} showsVerticalScrollIndicator={false} />
               <FlatList data={days} keyExtractor={d => `d-${d}`} renderItem={({item}) => (
                 <TouchableOpacity onPress={() => setSelDay(item)} style={[styles.dateItem, selDay === item && styles.dateItemSel]}>
                   <Text style={[styles.dateItemText, selDay === item && styles.dateItemTextSel]}>{item}</Text>
                 </TouchableOpacity>
               )} style={{height: 150}} showsVerticalScrollIndicator={false} />
            </View>
            <Button title="CONFIRMAR" onPress={() => onConfirm(field, `${selYear}-${selMonth}-${selDay}`)} style={{marginTop: 20}} />
            <TouchableOpacity onPress={onCancel} style={{marginTop: 15, alignItems: 'center'}}>
               <Text style={{fontWeight: '900', color: Colors.error}}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
});

export default function PromocionCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { promociones, addPromocion, updatePromocion: updatePromocionStore } = usePromocionStore();

  const isEditing = !!id;
  const existing: Promocion | undefined = isEditing
    ? promociones.find((p) => p.id_promocion === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre: existing?.nombre ?? '',
    descripcion: existing?.descripcion ?? '',
    tipo_promocion: (existing?.tipo_promocion as TipoPromocion) ?? 'PORCENTAJE',
    valor_descuento: existing?.valor_descuento != null ? String(existing.valor_descuento) : '',
    fecha_inicio: existing?.fecha_inicio ? existing.fecha_inicio.split('T')[0] : '',
    fecha_fin: existing?.fecha_fin ? existing.fecha_fin.split('T')[0] : '',
    activa: existing?.activa ?? true,
  });

  const [showDatePicker, setShowDatePicker] = useState<{ visible: boolean; field: 'fecha_inicio' | 'fecha_fin' }>({ visible: false, field: 'fecha_inicio' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre.trim()) newErrors.nombre = 'REQUERIDO';
    if (!form.valor_descuento.trim()) newErrors.valor_descuento = 'REQUERIDO';
    if (isNaN(Number(form.valor_descuento))) newErrors.valor_descuento = 'NÚMERO INVÁLIDO';
    
    if (
      form.tipo_promocion === 'PORCENTAJE' &&
      form.valor_descuento.trim() &&
      (Number(form.valor_descuento) < 0 || Number(form.valor_descuento) > 100)
    ) {
      newErrors.valor_descuento = '0-100%';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('COMPLETA LOS CAMPOS REQUERIDOS', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const input: any = {
        nombre: form.nombre.trim(),
        tipo_promocion: form.tipo_promocion,
        activa: form.activa,
        valor_descuento: parseFloat(form.valor_descuento),
      };
      if (form.descripcion.trim()) input.descripcion = form.descripcion.trim();
      if (form.fecha_inicio.trim()) input.fecha_inicio = form.fecha_inicio.trim();
      if (form.fecha_fin.trim()) input.fecha_fin = form.fecha_fin.trim();

      if (isEditing && existing) {
        const updated = await updatePromocion({ id_promocion: existing.id_promocion, ...input });
        updatePromocionStore({ ...existing, ...updated, ...input });
        showToast('PROMOCIÓN ACTUALIZADA', 'success');
      } else {
        const created = await createPromocion(input);
        addPromocion({ ...created, ...input });
        showToast('PROMOCIÓN CREADA', 'success');
      }
      setTimeout(() => router.push('/(app)'), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
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
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isEditing ? 'EDITAR PROMOCIÓN' : 'NUEVA PROMOCIÓN'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>DETALLES DE LA OFERTA</Text>
                
                <Input
                  label="NOMBRE DE LA PROMOCIÓN *"
                  value={form.nombre}
                  onChangeText={(v) => setField('nombre', v)}
                  placeholder="EJ: DESCUENTO DE VERANO"
                  error={errors.nombre}
                  autoCapitalize="characters"
                />

                <Input
                  label="DESCRIPCIÓN"
                  value={form.descripcion}
                  onChangeText={(v) => setField('descripcion', v)}
                  placeholder="DETALLES ADICIONALES..."
                  autoCapitalize="characters"
                  multiline
                  numberOfLines={3}
                  style={styles.multiline}
                />

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>TIPO DE DESCUENTO</Text>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        form.tipo_promocion === 'PORCENTAJE' && styles.toggleBtnActive
                      ]}
                      onPress={() => setField('tipo_promocion', 'PORCENTAJE')}
                    >
                      <MaterialCommunityIcons 
                        name="percent" 
                        size={18} 
                        color={form.tipo_promocion === 'PORCENTAJE' ? '#FFF' : Colors.dark} 
                      />
                      <Text style={[styles.toggleBtnText, form.tipo_promocion === 'PORCENTAJE' && styles.toggleBtnTextActive]}>
                        PORCENTAJE
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        form.tipo_promocion === 'MONTO' && styles.toggleBtnActive
                      ]}
                      onPress={() => setField('tipo_promocion', 'MONTO')}
                    >
                      <MaterialCommunityIcons 
                        name="cash-multiple" 
                        size={18} 
                        color={form.tipo_promocion === 'MONTO' ? '#FFF' : Colors.dark} 
                      />
                      <Text style={[styles.toggleBtnText, form.tipo_promocion === 'MONTO' && styles.toggleBtnTextActive]}>
                        MONTO FIJO
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Input
                  label={form.tipo_promocion === 'PORCENTAJE' ? 'PORCENTAJE (%) *' : 'MONTO DE DESCUENTO ($) *'}
                  value={form.valor_descuento}
                  onChangeText={(v) => setField('valor_descuento', v)}
                  placeholder="0.00"
                  error={errors.valor_descuento}
                  keyboardType="decimal-pad"
                />

                <View style={styles.row}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDatePicker({ visible: true, field: 'fecha_inicio' })}>
                        <Text style={styles.fieldLabel}>FECHA INICIO</Text>
                        <View style={styles.selector}>
                            <Text style={[styles.selectorText, !form.fecha_inicio && styles.placeholderText]}>
                                {form.fecha_inicio || 'YYYY-MM-DD'}
                            </Text>
                            <MaterialCommunityIcons name="calendar-range" size={18} color={Colors.primary} />
                        </View>
                    </TouchableOpacity>
                    <View style={{ width: 15 }} />
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDatePicker({ visible: true, field: 'fecha_fin' })}>
                        <Text style={styles.fieldLabel}>FECHA FIN</Text>
                        <View style={styles.selector}>
                            <Text style={[styles.selectorText, !form.fecha_fin && styles.placeholderText]}>
                                {form.fecha_fin || 'YYYY-MM-DD'}
                            </Text>
                            <MaterialCommunityIcons name="calendar-check" size={18} color={Colors.primary} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.switchRow}>
                  <View>
                      <Text style={styles.switchTitle}>PROMOCIÓN ACTIVA</Text>
                      <Text style={styles.switchSubtitle}>Visible para nuevas ventas</Text>
                  </View>
                  <Switch
                    value={form.activa}
                    onValueChange={(v) => setField('activa', v)}
                    trackColor={{ false: '#D1D5DB', true: Colors.success + '80' }}
                    thumbColor={form.activa ? Colors.success : '#9CA3AF'}
                  />
                </View>
            </View>

            <Button
              title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR PROMOCIÓN'}
              onPress={handleSubmit}
              loading={submitting}
              size="lg"
              style={styles.submitBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>

        <DatePickerModal 
          visible={showDatePicker.visible} 
          field={showDatePicker.field} 
          value={form[showDatePicker.field]}
          onConfirm={(field: any, value: any) => {
              setField(field, value);
              setShowDatePicker({ visible: false, field: 'fecha_inicio' });
          }}
          onCancel={() => setShowDatePicker({ visible: false, field: 'fecha_inicio' })}
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 160 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: 20, marginBottom: 25, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 3 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.4)', marginBottom: 6, textTransform: 'uppercase' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)', backgroundColor: '#F9FAFB' },
  toggleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.dark },
  toggleBtnText: { fontSize: 11, fontWeight: '900', color: 'rgba(0,0,0,0.3)' },
  toggleBtnTextActive: { color: '#FFF' },
  row: { flexDirection: 'row', marginBottom: Spacing.md },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: Colors.dark, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F9FAFB' },
  selectorText: { fontSize: 13, fontWeight: '800', color: Colors.dark },
  placeholderText: { color: 'rgba(0,0,0,0.3)' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', marginTop: 10 },
  switchTitle: { fontSize: 12, fontWeight: '900', color: Colors.dark },
  switchSubtitle: { fontSize: 10, fontWeight: '700', color: 'rgba(0,0,0,0.4)' },
  submitBtn: { marginTop: 10, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  datePickerCard: { backgroundColor: Colors.beige, width: '85%', borderRadius: 24, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  datePickerTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 15, color: Colors.dark },
  datePickerLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 },
  columnLabel: { fontSize: 10, fontWeight: '900', color: Colors.primary, opacity: 0.6 },
  datePickerRows: { flexDirection: 'row', justifyContent: 'space-between' },
  dateItem: { padding: 10, alignItems: 'center', borderRadius: 8 },
  dateItemSel: { backgroundColor: Colors.primary },
  dateItemText: { fontWeight: '800', fontSize: 16, color: Colors.dark },
  dateItemTextSel: { color: '#FFFFFF' },
});
