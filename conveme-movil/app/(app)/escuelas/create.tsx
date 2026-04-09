import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createEscuela, updateEscuela, deleteEscuela } from '../../../src/services/escuela.service';
import { getMunicipios } from '../../../src/services/ubicacion.service';
import { useEscuelaStore } from '../../../src/store/escuelaStore';
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
import type { Municipio } from '../../../src/types';

export default function EscuelaCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { escuelas, addEscuela, updateEscuela: updateEscuelaStore, removeEscuela } = useEscuelaStore();

  const isEditing = !!id;
  const existing = escuelas.find((e) => e.id_escuela === Number(id));

  const [form, setForm] = useState({
    nombre: '',
    siglas: '',
    municipio_id: null as number | null,
    activa: true,
  });

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [showMunicipioModal, setShowMunicipioModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getMunicipios();
      setMunicipios(data || []);
    })();
  }, []);

  useEffect(() => {
    if (isEditing && existing) {
      setForm({
        nombre: existing.nombre || '',
        siglas: existing.siglas || '',
        municipio_id: existing.municipio?.id_municipio ?? null,
        activa: existing.activa ?? true,
      });
    }
  }, [id, existing]);

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.siglas.trim() || !form.municipio_id) {
      showToast('COMPLETA LOS CAMPOS OBLIGATORIOS', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      // 🟢 1. Preparamos solo los datos básicos que el backend acepta siempre
      const input: any = {
        nombre: form.nombre.trim(),
        siglas: form.siglas.trim().toUpperCase(),
        municipio_id: Number(form.municipio_id),
      };

      if (isEditing && existing) {
        // 🟢 2. Si estamos EDITANDO, le agregamos el ID y el campo 'activa'
        input.id_escuela = existing.id_escuela;
        input.activa = form.activa;

        const updated = await updateEscuela(input);
        updateEscuelaStore({
          ...existing,
          ...updated,
          municipio: municipios.find(m => m.id_municipio === form.municipio_id)
        });
        showToast('ESCUELA ACTUALIZADA', 'success');
      } else {
        // 🟢 3. Si estamos CREADO, mandamos el input limpio (sin 'activa')
        const created = await createEscuela(input);
        addEscuela({
          ...created,
          municipio: municipios.find(m => m.id_municipio === form.municipio_id)
        });
        showToast('ESCUELA CREADA', 'success');
      }
      setTimeout(() => router.replace('/escuelas'), 1500);
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
      // 🟢 AQUÍ ESTABA EL BUG: existing.id_evento en lugar de existing.id_escuela
      await deleteEscuela(existing.id_escuela);
      removeEscuela(existing.id_escuela);
      showToast('ESCUELA ELIMINADA', 'success');
      setTimeout(() => router.replace('/escuelas'), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [isEditing, existing, removeEscuela, showToast]);

  const selectedMunicipio = municipios.find(m => m.id_municipio === form.municipio_id);

  return (
    <NeobrutalistBackground>
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={styles.header}>
    <Pressable onPress={() => router.replace('/escuelas')} style={styles.backBtn}>
    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
    </Pressable>
    <Text style={styles.title}>{isEditing ? 'EDITAR ESCUELA' : 'NUEVA ESCUELA'}</Text>
    <View style={styles.headerPlaceholder} />
    </View>

    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View style={styles.card}>
    <Text style={styles.sectionTitle}>DETALLES GENERALES</Text>
    <Input label="NOMBRE *" value={form.nombre} onChangeText={v => setField('nombre', v)} placeholder="EJ: COLEGIO NACIONAL" autoCapitalize="characters" />
    <Input label="SIGLAS *" value={form.siglas} onChangeText={v => setField('siglas', v)} placeholder="EJ: COLNAC" autoCapitalize="characters" />

    <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>MUNICIPIO / UBICACIÓN *</Text>
    <TouchableOpacity style={styles.selector} onPress={() => setShowMunicipioModal(true)}>
    <MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary} />
    <Text style={[styles.selectorText, !selectedMunicipio && styles.placeholderText]}>
    {selectedMunicipio ? selectedMunicipio.nombre.toUpperCase() : 'SELECCIONAR MUNICIPIO'}
    </Text>
    <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />
    </TouchableOpacity>
    </View>

    <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>ESTADO DE LA ESCUELA</Text>
    <View style={styles.statusRow}>
    <TouchableOpacity style={[styles.chip, form.activa && styles.chipActive]} onPress={() => setField('activa', true)}>
    <MaterialCommunityIcons name={form.activa ? "check-circle" : "circle-outline"} size={16} color={form.activa ? Colors.success : 'rgba(0,0,0,0.3)'} />
    <Text style={[styles.chipText, form.activa && styles.chipTextActive]}>ACTIVA</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.chip, !form.activa && styles.chipInactive]} onPress={() => setField('activa', false)}>
    <MaterialCommunityIcons name={!form.activa ? "close-circle" : "circle-outline"} size={16} color={!form.activa ? Colors.error : 'rgba(0,0,0,0.3)'} />
    <Text style={[styles.chipText, !form.activa && styles.chipTextInactive]}>INACTIVA</Text>
    </TouchableOpacity>
    </View>
    </View>
    </View>

    <Button title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR ESCUELA'} onPress={handleSubmit} loading={submitting} size="lg" style={styles.submitBtn} />

    {isEditing && (
      <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteConfirm(true)}>
      <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
      <Text style={styles.deleteBtnText}>ELIMINAR ESCUELA</Text>
      </TouchableOpacity>
    )}
    </ScrollView>
    </KeyboardAvoidingView>

    <Modal visible={showMunicipioModal} animationType="slide" transparent>
    <SafeAreaView style={styles.modalOverlay}>
    <View style={styles.modalListContent}>
    <View style={styles.modalHeader}>
    <Text style={styles.modalTitle}>MUNICIPIOS</Text>
    <TouchableOpacity onPress={() => setShowMunicipioModal(false)}><MaterialCommunityIcons name="close-thick" size={28} color={Colors.dark} /></TouchableOpacity>
    </View>
    <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="BUSCAR MUNICIPIO..." />
    <FlatList
    data={municipios.filter(m => m.nombre.toLowerCase().includes(searchQuery.toLowerCase()))}
    keyExtractor={item => String(item.id_municipio)}
    renderItem={({item}) => (
      <TouchableOpacity style={styles.modalListItem} onPress={() => { setField('municipio_id', item.id_municipio); setShowMunicipioModal(false); }}>
      <Text style={styles.modalListItemText}>{item.nombre.toUpperCase()}</Text>
      {form.municipio_id === item.id_municipio && <MaterialCommunityIcons name="check-bold" size={20} color={Colors.success} />}
      </TouchableOpacity>
    )}
    />
    </View>
    </SafeAreaView>
    </Modal>

    <ConfirmDialog visible={showDeleteConfirm} title="ELIMINAR ESCUELA" message="¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTA ESCUELA?" onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} loading={deleting} destructive />
    </SafeAreaView>
    <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  headerPlaceholder: { width: 40 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 150 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 3 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15 },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.4)', marginBottom: 6, textTransform: 'uppercase' },
                                 selector: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: Colors.dark, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: '#F9FAFB', gap: Spacing.sm },
                                 selectorText: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.dark },
                                 placeholderText: { color: 'rgba(0,0,0,0.3)' },
                                 statusRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
                                 chip: { flex: 1, flexDirection: 'row', padding: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)', gap: 6 },
                                 chipActive: { borderColor: Colors.success, backgroundColor: Colors.success + '10' },
                                 chipInactive: { borderColor: Colors.error, backgroundColor: Colors.error + '10' },
                                 chipText: { fontSize: 11, fontWeight: '900', color: 'rgba(0,0,0,0.3)' },
                                 chipTextActive: { color: Colors.success },
                                 chipTextInactive: { color: Colors.error },
                                 submitBtn: { marginTop: Spacing.sm, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 },
                                 deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
                                 deleteBtnText: { color: Colors.error, fontWeight: '900', fontSize: 12, textDecorationLine: 'underline' },
                                 modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
                                 modalListContent: { backgroundColor: Colors.beige, width: '100%', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, height: '80%', position: 'absolute', bottom: 0, borderTopWidth: 4, borderColor: Colors.dark },
                                 modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, borderBottomWidth: 2, borderBottomColor: Colors.dark, paddingBottom: 10 },
                                 modalTitle: { fontSize: 18, fontWeight: '900' },
                                 modalListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', justifyContent: 'space-between' },
                                 modalListItemText: { fontSize: 15, fontWeight: '800' },
});
