import React, { useEffect, useState, useCallback } from 'react';
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
import { getOrdenesProduccion, createOrdenProduccion, updateOrdenProduccion } from '../../../src/services/produccion.service';
import { getProductos } from '../../../src/services/producto.service';
import { getEmpleados } from '../../../src/services/empleado.service';
import { useProduccionStore } from '../../../src/store/produccionStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { Button, Input, LoadingSpinner, Modal, SearchBar } from '../../../src/components/ui';
import { parseGraphQLError } from '../../../src/utils';

const ESTADOS = ['Pendiente', 'En Proceso', 'Finalizada', 'Cancelada'];

export default function ProduccionCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const { toast, show, hide } = useToast();
  const { addOrden, updateOrden } = useProduccionStore();

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [cantidad, setCantidad] = useState('');
  const [estado, setEstado] = useState('Pendiente');
  
  const [products, setProducts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [p, e] = await Promise.all([getProductos(), getEmpleados()]);
      setProducts(p);
      setEmployees(e);

      if (isEdit) {
        const all = await getOrdenesProduccion();
        const found = all.find((o: any) => String(o.id_orden_produccion) === String(id));
        if (found) {
          setSelectedProduct(found.producto);
          setSelectedEmployee(found.empleado);
          setCantidad(String(found.cantidad_a_producir ?? ''));
          setEstado(found.estado ?? 'Pendiente');
        }
      }
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setInitializing(false);
    }
  }, [id, isEdit, show]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!selectedProduct || !selectedEmployee || !cantidad) {
      show('TODOS LOS CAMPOS SON REQUERIDOS', 'error');
      return;
    }
    setLoading(true);
    try {
      const input: any = {
        producto_id: selectedProduct.id_producto,
        empleado_id: selectedEmployee.id_empleado,
        cantidad_a_producir: parseInt(cantidad, 10),
        estado,
        detalles: [],
      };
      if (isEdit) {
        input.id_orden_produccion = parseInt(id!, 10);
        await updateOrdenProduccion(input);
        const all = await getOrdenesProduccion();
        const fullUpdated = all.find((o: any) => String(o.id_orden_produccion) === String(id));
        if (fullUpdated) updateOrden(fullUpdated);
        show('ORDEN ACTUALIZADA CON ÉXITO', 'success');
      } else {
        const created = await createOrdenProduccion(input);
        const all = await getOrdenesProduccion();
        const fullCreated = all.find((o: any) => String(o.id_orden_produccion) === String(created.id_orden_produccion));
        if (fullCreated) addOrden(fullCreated);
        show('ORDEN CREADA CON ÉXITO', 'success');
      }
      setTimeout(() => router.push('/(app)'), 1500);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchProduct.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredEmployees = employees.filter(e => 
    e.nombre_completo.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  if (initializing) return <LoadingSpinner fullScreen message="CARGANDO DATOS..." />;

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? 'EDITAR ORDEN' : 'NUEVA ORDEN'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>CONFIGURACIÓN DE ORDEN</Text>
                    
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>PRODUCTO A PRODUCIR *</Text>
                        <TouchableOpacity style={styles.selector} onPress={() => setShowProductModal(true)}>
                            <MaterialCommunityIcons name="package-variant" size={20} color={Colors.primary} />
                            <Text style={[styles.selectorText, !selectedProduct && styles.placeholderText]}>
                                {selectedProduct ? selectedProduct.nombre.toUpperCase() : 'SELECCIONAR PRODUCTO...'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>EMPLEADO RESPONSABLE *</Text>
                        <TouchableOpacity style={styles.selector} onPress={() => setShowEmployeeModal(true)}>
                            <MaterialCommunityIcons name="account-hard-hat" size={20} color={Colors.primary} />
                            <Text style={[styles.selectorText, !selectedEmployee && styles.placeholderText]}>
                                {selectedEmployee ? selectedEmployee.nombre_completo.toUpperCase() : 'SELECCIONAR EMPLEADO...'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />
                        </TouchableOpacity>
                    </View>

                    <Input
                        label="CANTIDAD A PRODUCIR *"
                        value={cantidad}
                        onChangeText={setCantidad}
                        placeholder="EJ: 100"
                        keyboardType="numeric"
                        leftIcon={<MaterialCommunityIcons name="counter" size={20} color={Colors.primary} />}
                    />

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>ESTADO DE LA ORDEN</Text>
                        <View style={styles.statesRow}>
                            {ESTADOS.map((e) => (
                                <TouchableOpacity
                                    key={e}
                                    style={[styles.stateBtn, estado === e && styles.stateBtnActive]}
                                    onPress={() => setEstado(e)}
                                >
                                    <Text style={[styles.stateText, estado === e && styles.stateTextActive]}>{e.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <Button
                    title={isEdit ? 'GUARDAR CAMBIOS' : 'CREAR ORDEN'}
                    loading={loading}
                    onPress={handleSubmit}
                    size="lg"
                    style={styles.submitBtn}
                />
            </ScrollView>
        </KeyboardAvoidingView>

        {/* Modal Productos */}
        <Modal visible={showProductModal} onClose={() => setShowProductModal(false)} title="PRODUCTOS">
            <SearchBar value={searchProduct} onChangeText={setSearchProduct} placeholder="BUSCAR PRODUCTO..." style={{ marginBottom: 15 }} />
            <ScrollView style={{maxHeight: 400}}>
                {filteredProducts.map(p => (
                    <TouchableOpacity key={p.id_producto} style={styles.modalItem} onPress={() => { setSelectedProduct(p); setShowProductModal(false); }}>
                        <View style={{flex: 1}}>
                            <Text style={styles.modalItemTitle}>{p.nombre.toUpperCase()}</Text>
                            <Text style={styles.modalItemSub}>SKU: {p.sku}</Text>
                        </View>
                        {selectedProduct?.id_producto === p.id_producto && <MaterialCommunityIcons name="check-bold" size={20} color={Colors.success} />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </Modal>

        {/* Modal Empleados */}
        <Modal visible={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} title="EMPLEADOS">
            <SearchBar value={searchEmployee} onChangeText={setSearchEmployee} placeholder="BUSCAR EMPLEADO..." style={{ marginBottom: 15 }} />
            <ScrollView style={{maxHeight: 400}}>
                {filteredEmployees.map(e => (
                    <TouchableOpacity key={e.id_empleado} style={styles.modalItem} onPress={() => { setSelectedEmployee(e); setShowEmployeeModal(false); }}>
                        <View style={{flex: 1}}>
                            <Text style={styles.modalItemTitle}>{e.nombre_completo.toUpperCase()}</Text>
                            <Text style={styles.modalItemSub}>{e.puesto?.toUpperCase()}</Text>
                        </View>
                        {selectedEmployee?.id_empleado === e.id_empleado && <MaterialCommunityIcons name="check-bold" size={20} color={Colors.success} />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </Modal>

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 150 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: 20, marginBottom: 25, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 3 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
  fieldGroup: { marginBottom: 15 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.4)', marginBottom: 6, textTransform: 'uppercase' },
  selector: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: Colors.dark, borderRadius: BorderRadius.lg, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F9FAFB', gap: 10 },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.dark },
  placeholderText: { color: 'rgba(0,0,0,0.3)' },
  statesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  stateBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)', backgroundColor: '#FFF' },
  stateBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.dark },
  stateText: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.3)' },
  stateTextActive: { color: '#FFF' },
  submitBtn: { marginTop: 10, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', justifyContent: 'space-between' },
  modalItemTitle: { fontSize: 14, fontWeight: '900', color: Colors.dark },
  modalItemSub: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.4)', marginTop: 2 },
});
