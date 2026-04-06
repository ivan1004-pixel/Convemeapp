import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
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
import { Spacing } from '../../../src/theme/spacing';
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
        detalles: [], // 👈 Obligatorio para el DTO de creación
      };
      if (isEdit) {
        input.id_orden_produccion = parseInt(id!, 10);
        const updated = await updateOrdenProduccion(input);
        // Recargar para tener los objetos completos (producto/empleado)
        const all = await getOrdenesProduccion();
        const fullUpdated = all.find((o: any) => String(o.id_orden_produccion) === String(id));
        if (fullUpdated) updateOrden(fullUpdated);
        show('Orden actualizada correctamente', 'success');
      } else {
        const created = await createOrdenProduccion(input);
        // Recargar para tener el objeto completo
        const all = await getOrdenesProduccion();
        const fullCreated = all.find((o: any) => String(o.id_orden_produccion) === String(created.id_orden_produccion));
        if (fullCreated) addOrden(fullCreated);
        show('Orden creada correctamente', 'success');
      }
      setTimeout(() => router.back(), 1500);
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

  if (initializing) return <LoadingSpinner fullScreen />;

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>
                {isEdit ? 'Editar Orden' : 'Nueva Orden'}
            </Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>CONFIGURACIÓN DE ORDEN</Text>
                
                <Text style={styles.label}>PRODUCTO A PRODUCIR *</Text>
                <TouchableOpacity 
                    style={styles.selectorTrigger}
                    onPress={() => setShowProductModal(true)}
                >
                    <Text style={[styles.selectorValue, !selectedProduct && { color: 'rgba(0,0,0,0.3)' }]}>
                        {selectedProduct ? selectedProduct.nombre : 'SELECCIONAR PRODUCTO...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.dark} />
                </TouchableOpacity>

                <Text style={styles.label}>EMPLEADO RESPONSABLE *</Text>
                <TouchableOpacity 
                    style={styles.selectorTrigger}
                    onPress={() => setShowEmployeeModal(true)}
                >
                    <Text style={[styles.selectorValue, !selectedEmployee && { color: 'rgba(0,0,0,0.3)' }]}>
                        {selectedEmployee ? selectedEmployee.nombre_completo : 'SELECCIONAR EMPLEADO...'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.dark} />
                </TouchableOpacity>

                <Input
                    label="CANTIDAD A PRODUCIR *"
                    value={cantidad}
                    onChangeText={setCantidad}
                    placeholder="EJ. 100"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>ESTADO ACTUAL</Text>
                <View style={styles.statesRow}>
                    {ESTADOS.map((e) => (
                        <TouchableOpacity
                            key={e}
                            style={[
                                styles.stateBtn,
                                estado === e && styles.stateBtnActive
                            ]}
                            onPress={() => setEstado(e)}
                        >
                            <Text style={[styles.stateText, estado === e && styles.stateTextActive]}>
                                {e.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Button
                    title={isEdit ? 'GUARDAR CAMBIOS' : 'CREAR ORDEN'}
                    loading={loading}
                    onPress={handleSubmit}
                    style={styles.submitBtn}
                />
            </View>
        </ScrollView>

        {/* Modal Productos */}
        <Modal visible={showProductModal} onClose={() => setShowProductModal(false)} title="SELECCIONAR PRODUCTO">
            <SearchBar value={searchProduct} onChangeText={setSearchProduct} placeholder="BUSCAR..." style={{ marginBottom: 15 }} />
            {filteredProducts.map(p => (
                <TouchableOpacity 
                    key={p.id_producto} 
                    style={styles.modalItem}
                    onPress={() => {
                        setSelectedProduct(p);
                        setShowProductModal(false);
                    }}
                >
                    <Text style={styles.modalItemTitle}>{p.nombre}</Text>
                    <Text style={styles.modalItemSub}>{p.sku}</Text>
                </TouchableOpacity>
            ))}
        </Modal>

        {/* Modal Empleados */}
        <Modal visible={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} title="SELECCIONAR EMPLEADO">
            <SearchBar value={searchEmployee} onChangeText={setSearchEmployee} placeholder="BUSCAR..." style={{ marginBottom: 15 }} />
            {filteredEmployees.map(e => (
                <TouchableOpacity 
                    key={e.id_empleado} 
                    style={styles.modalItem}
                    onPress={() => {
                        setSelectedEmployee(e);
                        setShowEmployeeModal(false);
                    }}
                >
                    <Text style={styles.modalItemTitle}>{e.nombre_completo}</Text>
                    <Text style={styles.modalItemSub}>{e.puesto}</Text>
                </TouchableOpacity>
            ))}
        </Modal>

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
  label: { fontSize: 11, fontWeight: '900', color: Colors.dark, marginBottom: 8, marginTop: 10 },
  selectorTrigger: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#F9FAFB', 
    borderWidth: 2, 
    borderColor: Colors.dark, 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 15 
  },
  selectorValue: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  statesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  stateBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: Colors.dark, 
    backgroundColor: '#FFF' 
  },
  stateBtnActive: { backgroundColor: Colors.primary },
  stateText: { fontSize: 10, fontWeight: '900', color: Colors.dark },
  stateTextActive: { color: '#FFF' },
  submitBtn: { marginTop: 10, height: 55 },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalItemTitle: { fontSize: 14, fontWeight: '900', color: Colors.dark },
  modalItemSub: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.4)' },
});
