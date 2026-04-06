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
import type { Escuela, Municipio } from '../../../src/types';

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
      showToast('Completa los campos obligatorios', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const input = {
        nombre: form.nombre.trim(),
        siglas: form.siglas.trim().toUpperCase(),
        municipio_id: Number(form.municipio_id),
        activa: form.activa,
      };

      if (isEditing && existing) {
        const updated = await updateEscuela({ id_escuela: existing.id_escuela, ...input });
        updateEscuelaStore({ 
          ...existing, 
          ...updated, 
          municipio: municipios.find(m => m.id_municipio === form.municipio_id)
        });
        showToast('Escuela actualizada', 'success');
      } else {
        const created = await createEscuela(input);
        addEscuela({
            ...created,
            municipio: municipios.find(m => m.id_municipio === form.municipio_id)
        });
        showToast('Escuela creada', 'success');
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>{isEditing ? 'Editar Escuela' : 'Nueva Escuela'}</Text>
            <View style={{width: 44}} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <Input label="NOMBRE *" value={form.nombre} onChangeText={v => setField('nombre', v)} placeholder="Nombre de la escuela" />
                <Input label="SIGLAS *" value={form.siglas} onChangeText={v => setField('siglas', v)} placeholder="Ej: UNAM" />
                
                <Text style={styles.label}>UBICACIÓN *</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setShowMunicipioModal(true)}>
                    <Text style={styles.selectorText}>{municipios.find(m => m.id_municipio === form.municipio_id)?.nombre || 'Seleccionar municipio'}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.dark} />
                </TouchableOpacity>

                <View style={styles.statusRow}>
                    <TouchableOpacity style={[styles.chip, form.activa && styles.chipActive]} onPress={() => setField('activa', true)}><Text style={styles.chipText}>ACTIVA</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.chip, !form.activa && styles.chipInactive]} onPress={() => setField('activa', false)}><Text style={styles.chipText}>INACTIVA</Text></TouchableOpacity>
                </View>
            </View>

            <Button title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR ESCUELA'} onPress={handleSubmit} loading={submitting} size="lg" style={styles.submit} />
            
            {isEditing && (
                <TouchableOpacity style={styles.delete} onPress={() => setShowDeleteConfirm(true)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                    <Text style={styles.deleteText}>ELIMINAR ESCUELA</Text>
                </TouchableOpacity>
            )}
        </ScrollView>

        <Modal visible={showMunicipioModal} animationType="slide" transparent>
            <SafeAreaView style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>MUNICIPIOS</Text>
                        <TouchableOpacity onPress={() => setShowMunicipioModal(false)}><MaterialCommunityIcons name="close" size={24} color={Colors.dark} /></TouchableOpacity>
                    </View>
                    <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar..." />
                    <FlatList
                        data={municipios.filter(m => m.nombre.toLowerCase().includes(searchQuery.toLowerCase()))}
                        keyExtractor={item => String(item.id_municipio)}
                        renderItem={({item}) => (
                            <TouchableOpacity style={styles.item} onPress={() => { setField('municipio_id', item.id_municipio); setShowMunicipioModal(false); }}>
                                <Text style={styles.itemText}>{item.nombre.toUpperCase()}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </SafeAreaView>
        </Modal>

        <ConfirmDialog visible={showDeleteConfirm} title="Eliminar" message="¿Estás seguro?" onConfirm={async () => {
            setDeleting(true);
            await deleteEscuela(existing!.id_escuela);
            removeEscuela(existing!.id_escuela);
            router.back();
        }} onCancel={() => setShowDeleteConfirm(false)} loading={deleting} />
      </SafeAreaView>
      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '900' },
  scroll: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, elevation: 0, marginBottom: 25 },
  label: { fontSize: 12, fontWeight: '900', marginBottom: 8 },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: Colors.dark, backgroundColor: '#F9FAFB', marginBottom: 20 },
  selectorText: { fontSize: 14, fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, borderWidth: 2, borderColor: '#EEE' },
  chipActive: { borderColor: Colors.success, backgroundColor: Colors.success + '10' },
  chipInactive: { borderColor: Colors.error, backgroundColor: Colors.error + '10' },
  chipText: { fontSize: 11, fontWeight: '900' },
  submit: { height: 60, borderWidth: 3, borderColor: Colors.dark },
  delete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 8 },
  deleteText: { color: Colors.error, fontWeight: '900', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.beige, height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, borderTopWidth: 5, borderColor: Colors.dark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  item: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  itemText: { fontSize: 15, fontWeight: '800' }
});
