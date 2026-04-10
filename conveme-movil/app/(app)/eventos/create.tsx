import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { createEvento, updateEvento, deleteEvento } from '../../../src/services/evento.service';
import { getEscuelas } from '../../../src/services/escuela.service';
import { getMunicipios } from '../../../src/services/ubicacion.service';
import { useEventoStore } from '../../../src/store/eventoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { parseGraphQLError } from '../../../src/utils';
import type { Evento, Escuela, Municipio } from '../../../src/types';

const DatePickerModal = memo(({ visible, field, value, onConfirm, onCancel }: any) => {
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1);
    const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const initialParts = value?.split('-') || [];
    const [selYear, setSelYear] = useState(initialParts[0] || new Date().getFullYear().toString());
    const [selMonth, setSelMonth] = useState(initialParts[1] || '01');
    const [selDay, setSelDay] = useState(initialParts[2] || '01');

    useEffect(() => {
        if (value) {
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
            <TouchableOpacity onPress={onCancel} style={{marginTop: 10, alignItems: 'center'}}>
               <Text style={{fontWeight: '900', color: Colors.error}}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
});

export default function EventoCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { eventos, addEvento, updateEvento: updateEventoStore, removeEvento } = useEventoStore();

  const isEditing = !!id;
  const existing = eventos.find((e) => e.id_evento === Number(id));

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    costo_stand: '',
    escuela_id: null as number | null,
    municipio_id: null as number | null,
  });

  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [showEscuelaModal, setShowEscuelaModal] = useState(false);
  const [showMunicipioModal, setShowMunicipioModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<{ visible: boolean; field: 'fecha_inicio' | 'fecha_fin' }>({ visible: false, field: 'fecha_inicio' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [registeringCalendar, setRegisteringCalendar] = useState(false);

  useEffect(() => {
    loadSelectors();
  }, []);

  useEffect(() => {
    if (isEditing && existing) {
      setForm({
        nombre: existing.nombre || '',
        descripcion: existing.descripcion || '',
        fecha_inicio: existing.fecha_inicio ? existing.fecha_inicio.split('T')[0] : '',
        fecha_fin: existing.fecha_fin ? existing.fecha_fin.split('T')[0] : '',
        costo_stand: existing.costo_stand != null ? String(existing.costo_stand) : '',
        escuela_id: existing.escuela?.id_escuela ?? null,
        municipio_id: existing.municipio?.id_municipio ?? null,
      });
    }
  }, [id, existing]);

  const loadSelectors = async () => {
    try {
      const [e, m] = await Promise.all([getEscuelas(), getMunicipios()]);
      setEscuelas(e || []);
      setMunicipios(m || []);
    } catch (err) {
      
    }
  };

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre.trim()) newErrors.nombre = 'REQUERIDO';
    if (!form.municipio_id) newErrors.municipio_id = 'REQUERIDO';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('Por favor completa los campos requeridos', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const input: any = {
        nombre: form.nombre.trim(),
        municipio_id: Number(form.municipio_id),
      };
      if (form.descripcion.trim()) input.descripcion = form.descripcion.trim();
      if (form.fecha_inicio.trim()) input.fecha_inicio = form.fecha_inicio.trim();
      if (form.fecha_fin.trim()) input.fecha_fin = form.fecha_fin.trim();
      if (form.costo_stand.trim()) input.costo_stand = parseFloat(form.costo_stand);
      if (form.escuela_id) input.escuela_id = Number(form.escuela_id);

      if (isEditing && existing) {
        const updated = await updateEvento({ id_evento: existing.id_evento, ...input });
        updateEventoStore({ 
          ...existing, 
          ...updated, 
          escuela: escuelas.find(e => e.id_escuela === form.escuela_id),
          municipio: municipios.find(m => m.id_municipio === form.municipio_id)
        });
        showToast('Evento actualizado con éxito', 'success');
      } else {
        const created = await createEvento(input);
        addEvento({
            ...created,
            escuela: escuelas.find(e => e.id_escuela === form.escuela_id),
            municipio: municipios.find(m => m.id_municipio === form.municipio_id)
        });
        showToast('Evento creado con éxito', 'success');
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!isEditing || !existing) return;
    setDeleting(true);
    try {
        await deleteEvento(existing.id_evento);
        removeEvento(existing.id_evento);
        showToast('Evento eliminado con éxito', 'success');
        setTimeout(() => router.back(), 1500);
    } catch (err) {
        showToast(parseGraphQLError(err), 'error');
    } finally {
        setDeleting(false);
        setShowDeleteConfirm(false);
    }
  }, [isEditing, existing, removeEvento, showToast]);

  const handleRegisterCalendar = async () => {
    if (!isEditing || !existing) {
        Alert.alert('Atención', 'Primero debes guardar el evento para registrarlo en tu calendario.');
        return;
    }

    setRegisteringCalendar(true);
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permisos de calendario denegados', 'error');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(c => c.isPrimary) || calendars[0];

      if (!defaultCalendar) {
        showToast('No se encontró un calendario disponible', 'error');
        return;
      }

      const startDate = new Date(existing.fecha_inicio || new Date());
      const endDate = new Date(existing.fecha_fin || startDate);

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: existing.nombre,
        startDate,
        endDate,
        location: existing.escuela?.nombre || '',
        notes: existing.descripcion || '',
        timeZone: 'GMT-6',
      });

      showToast('¡LISTO! EL EVENTO SE GUARDÓ EN TU CALENDARIO', 'success');
    } catch (err) {
      showToast('UPS, NO PUDIMOS GUARDAR EL EVENTO', 'error');
      
    } finally {
      setRegisteringCalendar(false);
    }
  };

  const selectedEscuela = escuelas.find(e => e.id_escuela === form.escuela_id);
  const selectedMunicipio = municipios.find(m => m.id_municipio === form.municipio_id);

  const filteredEscuelas = escuelas.filter(e => e.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredMunicipios = municipios.filter(m => m.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.push('/(app)')} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </Pressable>
            <Text style={styles.title}>
              {isEditing ? 'EDITAR EVENTO' : 'NUEVO EVENTO'}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Detalles del Evento</Text>
              
              <Input
                label="NOMBRE DEL EVENTO *"
                value={form.nombre}
                onChangeText={(v) => setField('nombre', v)}
                placeholder="Ej: Expo Feria 2024"
                error={errors.nombre}
                autoCapitalize="words"
                leftIcon={<MaterialCommunityIcons name="calendar-star" size={20} color={Colors.primary} />}
              />

              <Input
                label="DESCRIPCIÓN"
                value={form.descripcion}
                onChangeText={(v) => setField('descripcion', v)}
                placeholder="Detalles del evento..."
                autoCapitalize="sentences"
                multiline
                numberOfLines={3}
                style={styles.multiline}
              />

              {/* Selector de Municipio */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>MUNICIPIO *</Text>
                <TouchableOpacity
                  style={[styles.selector, errors.municipio_id && styles.selectorError]}
                  onPress={() => { setSearchQuery(''); setShowMunicipioModal(true); }}
                >
                  <MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary} />
                  <Text style={[styles.selectorText, !selectedMunicipio && styles.placeholderText]}>
                    {selectedMunicipio ? selectedMunicipio.nombre.toUpperCase() : 'SELECCIONAR MUNICIPIO'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />
                </TouchableOpacity>
                {errors.municipio_id && <Text style={styles.errorText}>{errors.municipio_id}</Text>}
              </View>

              {/* Selector de Escuela */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ESCUELA (OPCIONAL)</Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => { setSearchQuery(''); setShowEscuelaModal(true); }}
                >
                  <MaterialCommunityIcons name="school" size={20} color={Colors.primary} />
                  <Text style={[styles.selectorText, !selectedEscuela && styles.placeholderText]}>
                    {selectedEscuela ? selectedEscuela.nombre.toUpperCase() : 'SELECCIONAR ESCUELA'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDatePicker({ visible: true, field: 'fecha_inicio' })}>
                      <Text style={styles.fieldLabel}>FECHA INICIO</Text>
                      <View style={styles.selector}>
                          <Text style={[styles.selectorText, !form.fecha_inicio && styles.placeholderText]}>
                              {form.fecha_inicio || 'YYYY-MM-DD'}
                          </Text>
                      </View>
                  </TouchableOpacity>
                  <View style={{ width: Spacing.md }} />
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDatePicker({ visible: true, field: 'fecha_fin' })}>
                      <Text style={styles.fieldLabel}>FECHA FIN</Text>
                      <View style={styles.selector}>
                          <Text style={[styles.selectorText, !form.fecha_fin && styles.placeholderText]}>
                              {form.fecha_fin || 'YYYY-MM-DD'}
                          </Text>
                      </View>
                  </TouchableOpacity>
              </View>

              <Input
                label="COSTO DEL STAND"
                value={form.costo_stand}
                onChangeText={(v) => setField('costo_stand', v)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                leftIcon={<MaterialCommunityIcons name="cash" size={20} color={Colors.primary} />}
              />
            </View>

            <Button
              title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR EVENTO'}
              onPress={handleSubmit}
              loading={submitting}
              size="lg"
              style={styles.submitBtn}
            />

            {isEditing && (
                <View style={styles.extraActions}>
                    <Button 
                        title="REGISTRAR EN CALENDARIO" 
                        onPress={handleRegisterCalendar}
                        loading={registeringCalendar}
                        variant="outline"
                        leftIcon={<MaterialCommunityIcons name="calendar-plus" size={20} color={Colors.primary} />}
                        style={styles.calendarBtn}
                    />
                    
                    <TouchableOpacity 
                        style={styles.deleteBtn} 
                        onPress={() => setShowDeleteConfirm(true)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                        <Text style={styles.deleteBtnText}>ELIMINAR EVENTO</Text>
                    </TouchableOpacity>
                </View>
            )}
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

        {/* Modales de Selección ... */}
        <Modal visible={showMunicipioModal} animationType="slide" transparent>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalListContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>MUNICIPIO</Text>
                <TouchableOpacity onPress={() => setShowMunicipioModal(false)}>
                  <MaterialCommunityIcons name="close-thick" size={28} color={Colors.dark} />
                </TouchableOpacity>
              </View>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="BUSCAR..." />
              <FlatList
                data={filteredMunicipios}
                keyExtractor={(item) => `m-${item.id_municipio}`}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                      style={styles.modalListItem} 
                      onPress={() => { setField('municipio_id', item.id_municipio); setShowMunicipioModal(false); }}
                  >
                    <Text style={styles.modalListItemText}>{item.nombre.toUpperCase()}</Text>
                    {form.municipio_id === item.id_municipio && <MaterialCommunityIcons name="check-bold" size={20} color={Colors.success} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </SafeAreaView>
        </Modal>

        <Modal visible={showEscuelaModal} animationType="slide" transparent>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalListContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>ESCUELA</Text>
                <TouchableOpacity onPress={() => setShowEscuelaModal(false)}>
                  <MaterialCommunityIcons name="close-thick" size={28} color={Colors.dark} />
                </TouchableOpacity>
              </View>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="BUSCAR..." />
              <FlatList
                data={filteredEscuelas}
                keyExtractor={(item) => `e-${item.id_escuela}`}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                      style={styles.modalListItem} 
                      onPress={() => { setField('escuela_id', item.id_escuela); setShowEscuelaModal(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalListItemText}>{item.nombre.toUpperCase()}</Text>
                    </View>
                    {form.escuela_id === item.id_escuela && <MaterialCommunityIcons name="check-bold" size={20} color={Colors.success} />}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => { setField('escuela_id', null); setShowEscuelaModal(false); }} style={styles.modalRemoveBtn}>
                  <Text style={styles.modalRemoveText}>QUITAR SELECCIÓN</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        <ConfirmDialog
            visible={showDeleteConfirm}
            title="Eliminar Evento"
            message={`¿Estás seguro de que deseas eliminar "${existing?.nombre}"? Esta acción no se puede deshacer.`}
            confirmText="ELIMINAR"
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            loading={deleting}
            destructive
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backBtn: { padding: Spacing.xs },
  title: { ...Typography.h3, fontWeight: '900', color: '#1A1A1A' },
  headerPlaceholder: { width: 34 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 160 },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.lg, 
    marginBottom: Spacing.lg, 
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    elevation: 3 
  },
  sectionTitle: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: Colors.primary, 
    marginBottom: Spacing.md, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5 
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: 'rgba(0,0,0,0.4)', 
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  selector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: Colors.dark, 
    borderRadius: BorderRadius.lg, 
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.md, 
    backgroundColor: '#F9FAFB', 
    gap: Spacing.sm 
  },
  selectorError: { borderColor: Colors.error },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.dark },
  placeholderText: { color: 'rgba(0,0,0,0.3)' },
  row: { flexDirection: 'row', marginBottom: Spacing.md },
  submitBtn: { 
    marginTop: Spacing.sm, 
    shadowColor: Colors.dark, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    elevation: 5 
  },
  extraActions: { marginTop: Spacing.xl, gap: Spacing.md },
  calendarBtn: { borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1 },
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: Spacing.md, 
    gap: Spacing.sm 
  },
  deleteBtnText: { 
    color: Colors.error, 
    fontWeight: '900', 
    fontSize: 12, 
    letterSpacing: 0.5,
    textDecorationLine: 'underline'
  },
  errorText: { color: Colors.error, fontSize: 10, fontWeight: '800', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  datePickerCard: { 
    backgroundColor: Colors.beige, 
    width: '85%', 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.lg,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
  },
  datePickerTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
  datePickerLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 },
  columnLabel: { fontSize: 10, fontWeight: '900', color: Colors.primary, opacity: 0.6 },
  datePickerRows: { flexDirection: 'row', justifyContent: 'space-between' },
  dateItem: { padding: 10, alignItems: 'center', borderRadius: 8 },
  dateItemSel: { backgroundColor: Colors.primary },
  dateItemText: { fontWeight: '800', fontSize: 16 },
  dateItemTextSel: { color: '#FFFFFF' },
  modalListContent: { 
    backgroundColor: Colors.beige, 
    width: '100%', 
    borderTopLeftRadius: BorderRadius.xxl, 
    borderTopRightRadius: BorderRadius.xxl, 
    padding: Spacing.lg, 
    height: '80%', 
    position: 'absolute', 
    bottom: 0,
    borderTopWidth: 4,
    borderColor: Colors.dark
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark,
    paddingBottom: 10
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalListItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(0,0,0,0.05)' 
  },
  modalListItemText: { fontSize: 15, fontWeight: '800', color: Colors.dark },
  modalRemoveBtn: { 
    marginTop: 10, 
    padding: 15, 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.error,
    marginBottom: 10
  },
  modalRemoveText: { fontWeight: '900', color: Colors.error, fontSize: 12 },
});
