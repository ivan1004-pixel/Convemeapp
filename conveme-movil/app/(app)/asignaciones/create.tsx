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
import { createAsignacion, updateAsignacion, deleteAsignacion } from '../../../src/services/asignacion.service';
import { getVendedores } from '../../../src/services/vendedor.service';
import { getProductos } from '../../../src/services/producto.service';
import { useAsignacionStore } from '../../../src/store/asignacionStore';
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
import type { Asignacion, Vendedor, Producto } from '../../../src/types';

export default function AsignacionCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { asignaciones, addAsignacion, updateAsignacion: updateAsignacionStore, removeAsignacion } = useAsignacionStore();

  const isEditing = !!id;
  const existing = asignaciones.find((a) => a.id_asignacion === Number(id));

  const [form, setForm] = useState({
    vendedor_id: null as number | null,
    estado: 'Pendiente',
    detalles: [] as { id_det_asignacion?: number, producto_id: number, cantidad_asignada: number, nombre?: string }[],
  });

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showVendedorModal, setShowVendedorModal] = useState(false);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isEditing && existing) {
      setForm({
        vendedor_id: existing.vendedor?.id_vendedor ?? null,
        estado: existing.estado || 'Pendiente',
        detalles: existing.detalles?.map(d => ({
            id_det_asignacion: d.id_det_asignacion,
            producto_id: d.producto?.id_producto || 0,
            cantidad_asignada: d.cantidad_asignada,
            nombre: d.producto?.nombre
        })) || [],
      });
    }
  }, [id, existing]);

  const loadData = async () => {
    try {
      const [v, p] = await Promise.all([getVendedores(), getProductos()]);
      setVendedores(v || []);
      setProductos(p || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const addProduct = (prod: Producto) => {
    if (form.detalles.some(d => d.producto_id === prod.id_producto)) {
        showToast('El producto ya está en la lista', 'warning');
        return;
    }
    setForm(prev => ({
        ...prev,
        detalles: [...prev.detalles, { producto_id: prod.id_producto, cantidad_asignada: 1, nombre: prod.nombre }]
    }));
    setShowProductoModal(false);
  };

  const removeProductFromList = (index: number) => {
    setForm(prev => ({
        ...prev,
        detalles: prev.detalles.filter((_, i) => i !== index)
    }));
  };

  const updateQuantity = (index: number, qty: string) => {
    const val = parseInt(qty) || 0;
    const newDetalles = [...form.detalles];
    newDetalles[index].cantidad_asignada = val;
    setForm(prev => ({ ...prev, detalles: newDetalles }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.vendedor_id) newErrors.vendedor_id = 'REQUERIDO';
    if (form.detalles.length === 0) newErrors.detalles = 'AÑADE AL MENOS UN PRODUCTO';
    const invalidQty = form.detalles.some(d => d.cantidad_asignada <= 0);
    if (invalidQty) newErrors.detalles = 'CANTIDADES DEBEN SER MAYORES A 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast(errors.vendedor_id || errors.detalles || 'Completa los campos', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const input = {
        vendedor_id: Number(form.vendedor_id),
        estado: form.estado,
        detalles: form.detalles.map(d => ({
            id_det_asignacion: d.id_det_asignacion,
            producto_id: d.producto_id,
            cantidad_asignada: d.cantidad_asignada
        }))
      };

      if (isEditing && existing) {
        await updateAsignacion({ id_asignacion: existing.id_asignacion, ...input });
        showToast('Asignación actualizada', 'success');
      } else {
        await createAsignacion(input);
        showToast('Asignación creada como PENDIENTE', 'success');
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
        await deleteAsignacion(existing.id_asignacion);
        removeAsignacion(existing.id_asignacion);
        showToast('Eliminada correctamente', 'success');
        setTimeout(() => router.back(), 1500);
    } catch (err) {
        showToast(parseGraphQLError(err), 'error');
    } finally {
        setDeleting(false);
        setShowDeleteConfirm(false);
    }
  }, [isEditing, existing, removeAsignacion, showToast]);

  const selectedVendedor = vendedores.find(v => v.id_vendedor === form.vendedor_id);
  const filteredVendedores = vendedores.filter(v => v.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProductos = productos.filter(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </Pressable>
            <Text style={styles.title}>{isEditing ? 'Editar Asignación' : 'Nueva Asignación'}</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Vendedor</Text>
              <TouchableOpacity
                style={[styles.selector, errors.vendedor_id && styles.selectorError]}
                onPress={() => { setSearchQuery(''); setShowVendedorModal(true); }}
              >
                <MaterialCommunityIcons name="account-tie-outline" size={20} color={Colors.primary} />
                <Text style={[styles.selectorText, !selectedVendedor && styles.placeholderText]}>
                  {selectedVendedor ? selectedVendedor.nombre_completo.toUpperCase() : 'SELECCIONAR VENDEDOR'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Productos</Text>
                <TouchableOpacity onPress={() => { setSearchQuery(''); setShowProductoModal(true); }} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus-circle" size={20} color={Colors.primary} />
                    <Text style={styles.addBtnText}>AÑADIR</Text>
                </TouchableOpacity>
              </View>

              {form.detalles.length === 0 ? (
                  <Text style={styles.emptyText}>No hay productos añadidos</Text>
              ) : (
                  form.detalles.map((det, index) => (
                      <View key={index} style={styles.productItem}>
                          <View style={{ flex: 1 }}>
                              <Text style={styles.productName}>{det.nombre?.toUpperCase()}</Text>
                          </View>
                          <View style={styles.qtyContainer}>
                              <Text style={styles.qtyLabel}>CANT:</Text>
                              <Input
                                value={String(det.cantidad_asignada)}
                                onChangeText={(v) => updateQuantity(index, v)}
                                keyboardType="numeric"
                                containerStyle={styles.qtyInput}
                                inputStyle={styles.qtyInputField}
                              />
                          </View>
                          <TouchableOpacity onPress={() => removeProductFromList(index)} style={styles.removeBtn}>
                              <MaterialCommunityIcons name="trash-can-outline" size={22} color={Colors.error} />
                          </TouchableOpacity>
                      </View>
                  ))
              )}
              {errors.detalles && <Text style={styles.errorText}>{errors.detalles}</Text>}
            </View>

            <Button
              title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR ASIGNACIÓN'}
              onPress={handleSubmit}
              loading={submitting}
              size="lg"
              style={styles.submitBtn}
            />

            {isEditing && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteConfirm(true)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                    <Text style={styles.deleteBtnText}>ELIMINAR ASIGNACIÓN</Text>
                </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Modal Vendedor */}
        <Modal visible={showVendedorModal} animationType="slide" transparent>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalListContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>VENDEDORES</Text>
                <TouchableOpacity onPress={() => setShowVendedorModal(false)}><MaterialCommunityIcons name="close-thick" size={28} color={Colors.dark} /></TouchableOpacity>
              </View>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="BUSCAR..." />
              <FlatList
                data={filteredVendedores}
                keyExtractor={(item) => `v-${item.id_vendedor}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalListItem} onPress={() => { setField('vendedor_id', item.id_vendedor); setShowVendedorModal(false); }}>
                    <MaterialCommunityIcons name="account-tie" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                    <Text style={styles.modalListItemText}>{item.nombre_completo.toUpperCase()}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </SafeAreaView>
        </Modal>

        {/* Modal Producto */}
        <Modal visible={showProductoModal} animationType="slide" transparent>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalListContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>PRODUCTOS</Text>
                <TouchableOpacity onPress={() => setShowProductoModal(false)}><MaterialCommunityIcons name="close-thick" size={28} color={Colors.dark} /></TouchableOpacity>
              </View>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="BUSCAR..." />
              <FlatList
                data={filteredProductos}
                keyExtractor={(item) => `p-${item.id_producto}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalListItem} onPress={() => addProduct(item)}>
                    <MaterialCommunityIcons name="package-variant" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.modalListItemText}>{item.nombre.toUpperCase()}</Text>
                        <Text style={styles.modalListItemSub}>SKU: {item.sku}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </SafeAreaView>
        </Modal>

        <ConfirmDialog
            visible={showDeleteConfirm}
            title="Eliminar Asignación"
            message="¿Deseas eliminar esta asignación? Esta acción no se puede deshacer."
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
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 120 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.bodySmall, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  selector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: '#FFFFFF', gap: Spacing.sm },
  selectorError: { borderColor: Colors.error },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  placeholderText: { color: 'rgba(0,0,0,0.3)' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 12, fontWeight: '900', color: Colors.primary },
  emptyText: { textAlign: 'center', color: 'rgba(0,0,0,0.3)', paddingVertical: 20, fontWeight: '700' },
  productItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', gap: 10 },
  productName: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(0,0,0,0.4)' },
  qtyInput: { width: 80, marginBottom: 0 },
  qtyInputField: { textAlign: 'center', height: 50, fontSize: 18, fontWeight: '900', color: Colors.primary },
  removeBtn: { padding: 5 },
  submitBtn: { marginTop: Spacing.sm, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,0,0,0.1)' },
  deleteBtnText: { color: Colors.error, fontWeight: '900', fontSize: 14 },
  errorText: { color: Colors.error, fontSize: 10, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalListContent: { backgroundColor: Colors.beige, width: '100%', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, height: '80%', position: 'absolute', bottom: 0, borderTopWidth: 4, borderColor: Colors.dark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalListItemText: { fontSize: 16, fontWeight: '800' },
  modalListItemSub: { fontSize: 12, fontWeight: '600', color: 'rgba(26,26,26,0.4)' },
});
