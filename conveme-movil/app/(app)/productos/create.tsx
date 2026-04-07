import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createProducto, updateProducto } from '../../../src/services/producto.service';
import { getCategorias } from '../../../src/services/categoria.service';
import { getTamanos } from '../../../src/services/tamano.service';
import { useProductoStore } from '../../../src/store/productoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { parseGraphQLError } from '../../../src/utils';
import type { Producto, Categoria, Tamano } from '../../../src/types';

export default function ProductoCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { productos, addProducto, updateProducto: updateProductoStore } = useProductoStore();

  const isEditing = !!id;
  const existing: Producto | undefined = isEditing
    ? productos.find((p) => p.id_producto === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre: existing?.nombre ?? '',
    sku: existing?.sku ?? '',
    precio_unitario: existing ? String(existing.precio_unitario) : '',
    precio_mayoreo: existing ? String(existing.precio_mayoreo) : '',
    cantidad_minima_mayoreo: existing?.cantidad_minima_mayoreo != null
      ? String(existing.cantidad_minima_mayoreo)
      : '',
    costo_produccion: existing?.costo_produccion != null
      ? String(existing.costo_produccion)
      : '',
    categoria_id: existing?.categoria?.id_categoria ?? null as number | null,
    tamano_id: existing?.tamano?.id_tamano ?? null as number | null,
  });

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tamanos, setTamanos] = useState<Tamano[]>([]);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showTamanoModal, setShowTamanoModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const [c, t] = await Promise.all([getCategorias(), getTamanos()]);
        setCategorias(c || []);
        setTamanos(t || []);
    } catch (err) {
        console.error('Error loading catalogs:', err);
    }
  };

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre.trim()) newErrors.nombre = 'REQUERIDO';
    if (!form.sku.trim()) newErrors.sku = 'REQUERIDO';
    if (!form.precio_unitario.trim()) {
      newErrors.precio_unitario = 'REQUERIDO';
    } else if (isNaN(Number(form.precio_unitario)) || Number(form.precio_unitario) < 0) {
      newErrors.precio_unitario = 'INVÁLIDO';
    }
    if (!form.categoria_id) newErrors.categoria = 'REQUERIDO';
    if (!form.tamano_id) newErrors.tamano = 'REQUERIDO';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const input: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        sku: form.sku.trim(),
        precio_unitario: Number(form.precio_unitario),
        precio_mayoreo: Number(form.precio_mayoreo || '0'),
        categoria_id: Number(form.categoria_id),
        tamano_id: Number(form.tamano_id),
      };
      
      if (form.cantidad_minima_mayoreo) {
        input.cantidad_minima_mayoreo = Number(form.cantidad_minima_mayoreo);
      }
      if (form.costo_produccion) {
        input.costo_produccion = Number(form.costo_produccion);
      }

      if (isEditing && existing) {
        const updated = await updateProducto({ id_producto: existing.id_producto, ...input });
        updateProductoStore({ ...existing, ...updated });
      } else {
        const created = await createProducto(input);
        addProducto(created);
      }
      router.push('/(app)');
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoria = categorias.find(c => c.id_categoria === form.categoria_id);
  const selectedTamano = tamanos.find(t => t.id_tamano === form.tamano_id);

  const filteredCategorias = categorias.filter(c => c.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTamanos = tamanos.filter(t => t.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>{isEditing ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>INFORMACIÓN GENERAL</Text>
                <Input
                    label="NOMBRE DEL PRODUCTO *"
                    value={form.nombre}
                    onChangeText={(v) => setField('nombre', v)}
                    placeholder="EJ. CAMISETA UNIVERSITARIA"
                    error={errors.nombre}
                    autoCapitalize="words"
                    leftIcon={<MaterialCommunityIcons name="tag-outline" size={20} color={Colors.primary} />}
                />

                <Input
                    label="SKU / CÓDIGO *"
                    value={form.sku}
                    onChangeText={(v) => setField('sku', v)}
                    placeholder="EJ. CAM-001"
                    error={errors.sku}
                    autoCapitalize="characters"
                    leftIcon={<MaterialCommunityIcons name="barcode-scan" size={20} color={Colors.primary} />}
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>CLASIFICACIÓN</Text>
                <Text style={styles.labelSelect}>CATEGORÍA *</Text>
                <TouchableOpacity
                    style={[styles.selector, errors.categoria && styles.selectorError, { marginBottom: Spacing.md }]}
                    onPress={() => { setSearchQuery(''); setShowCategoriaModal(true); }}
                >
                    <MaterialCommunityIcons name="shape-outline" size={20} color={Colors.primary} />
                    <Text style={[styles.selectorText, !selectedCategoria && styles.placeholderText]}>
                    {selectedCategoria ? selectedCategoria.nombre.toUpperCase() : 'SELECCIONAR CATEGORÍA'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />
                </TouchableOpacity>

                <Text style={styles.labelSelect}>TAMAÑO / TALLA *</Text>
                <TouchableOpacity
                    style={[styles.selector, errors.tamano && styles.selectorError]}
                    onPress={() => { setSearchQuery(''); setShowTamanoModal(true); }}
                >
                    <MaterialCommunityIcons name="ruler" size={20} color={Colors.primary} />
                    <Text style={[styles.selectorText, !selectedTamano && styles.placeholderText]}>
                    {selectedTamano ? selectedTamano.descripcion.toUpperCase() : 'SELECCIONAR TAMAÑO'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>PRECIOS Y VENTA</Text>
                <Input
                    label="PRECIO UNITARIO (MENUDEO) *"
                    value={form.precio_unitario}
                    onChangeText={(v) => setField('precio_unitario', v)}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    error={errors.precio_unitario}
                    leftIcon={<MaterialCommunityIcons name="cash" size={20} color={Colors.success} />}
                />

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Input
                            label="PRECIO MAYOREO"
                            value={form.precio_mayoreo}
                            onChangeText={(v) => setField('precio_mayoreo', v)}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            error={errors.precio_mayoreo}
                        />
                    </View>
                    <View style={{ width: Spacing.md }} />
                    <View style={{ flex: 1 }}>
                        <Input
                            label="MÍN. MAYOREO"
                            value={form.cantidad_minima_mayoreo}
                            onChangeText={(v) => setField('cantidad_minima_mayoreo', v)}
                            placeholder="EJ. 12"
                            keyboardType="number-pad"
                            error={errors.cantidad_minima_mayoreo}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>COSTOS DE PRODUCCIÓN</Text>
                <Input
                    label="COSTO POR UNIDAD"
                    value={form.costo_produccion}
                    onChangeText={(v) => setField('costo_produccion', v)}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    error={errors.costo_produccion}
                    leftIcon={<MaterialCommunityIcons name="factory" size={20} color={Colors.warning} />}
                    helperText="Opcional: Para cálculo de utilidad"
                />
            </View>

            <Button
              title={isEditing ? 'GUARDAR CAMBIOS' : 'REGISTRAR PRODUCTO'}
              onPress={handleSubmit}
              loading={submitting}
              size="lg"
              style={styles.submitBtn}
            />

            <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => router.push('/(app)')}
                disabled={submitting}
            >
                <Text style={styles.cancelBtnText}>CANCELAR Y VOLVER</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* MODAL CATEGORIAS */}
        <Modal visible={showCategoriaModal} animationType="slide" transparent>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalListContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECCIONAR CATEGORÍA</Text>
                <TouchableOpacity onPress={() => setShowCategoriaModal(false)}><MaterialCommunityIcons name="close-thick" size={28} color={Colors.dark} /></TouchableOpacity>
              </View>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="BUSCAR CATEGORÍA..." />
              <FlatList
                data={filteredCategorias}
                keyExtractor={(item) => `c-${item.id_categoria}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalListItem} onPress={() => { setField('categoria_id', item.id_categoria); setShowCategoriaModal(false); }}>
                    <MaterialCommunityIcons name="shape" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                    <Text style={styles.modalListItemText}>{item.nombre.toUpperCase()}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay categorías registradas</Text>}
              />
            </View>
          </SafeAreaView>
        </Modal>

        {/* MODAL TAMAÑOS */}
        <Modal visible={showTamanoModal} animationType="slide" transparent>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalListContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECCIONAR TAMAÑO</Text>
                <TouchableOpacity onPress={() => setShowTamanoModal(false)}><MaterialCommunityIcons name="close-thick" size={28} color={Colors.dark} /></TouchableOpacity>
              </View>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="BUSCAR TAMAÑO..." />
              <FlatList
                data={filteredTamanos}
                keyExtractor={(item) => `t-${item.id_tamano}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalListItem} onPress={() => { setField('tamano_id', item.id_tamano); setShowTamanoModal(false); }}>
                    <MaterialCommunityIcons name="ruler" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                    <Text style={styles.modalListItemText}>{item.descripcion.toUpperCase()}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay tamaños registrados</Text>}
              />
            </View>
          </SafeAreaView>
        </Modal>

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
    paddingHorizontal: Spacing.lg, 
    paddingTop: Spacing.md, 
    paddingBottom: Spacing.sm 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: '#FFF', 
    borderWidth: 2, 
    borderColor: Colors.dark, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: { ...Typography.h4, fontWeight: '900', color: Colors.dark },
  headerPlaceholder: { width: 40 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
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
    elevation: 4 
  },
  sectionTitle: { 
    ...Typography.bodySmall, 
    fontWeight: '900', 
    color: Colors.primary, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: Spacing.md 
  },
  labelSelect: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', marginBottom: 6, marginLeft: 4 },
  selector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: '#FFFFFF', gap: Spacing.sm },
  selectorError: { borderColor: Colors.error },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  placeholderText: { color: 'rgba(0,0,0,0.3)' },
  row: { flexDirection: 'row' },
  submitBtn: { 
    marginTop: Spacing.md, 
    shadowColor: Colors.dark, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    elevation: 5 
  },
  cancelBtn: { 
    marginTop: Spacing.lg, 
    paddingVertical: Spacing.md, 
    alignItems: 'center' 
  },
  cancelBtnText: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: 'rgba(0,0,0,0.4)', 
    textDecorationLine: 'underline' 
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalListContent: { backgroundColor: Colors.beige, width: '100%', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, height: '80%', position: 'absolute', bottom: 0, borderTopWidth: 4, borderColor: Colors.dark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalListItemText: { fontSize: 16, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: 'rgba(0,0,0,0.3)', paddingVertical: 40, fontWeight: '700' },
});


