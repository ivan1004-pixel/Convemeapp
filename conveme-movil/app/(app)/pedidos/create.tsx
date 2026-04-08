import React, { useState, useEffect, memo, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createPedido, updateEstadoPedido } from '../../../src/services/pedido.service';
import { getClientes } from '../../../src/services/cliente.service';
import { getVendedores } from '../../../src/services/vendedor.service';
import { usePedidoStore } from '../../../src/store/pedidoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Toast, useToast } from '../../../src/components/Toast';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { parseGraphQLError } from '../../../src/utils';
import type { Pedido, Cliente, Vendedor } from '../../../src/types';
import { useAuth } from '../../../src/hooks/useAuth';

const ESTADOS_PEDIDO = ['Pendiente', 'Confirmado', 'Entregado', 'Cancelado'];

const DatePickerModal = memo(
  ({ visible, field, value, onConfirm, onCancel }: any) => {
    const years = Array.from(
      { length: 5 },
      (_, i) => new Date().getFullYear() + i - 1
    );
    const months = [
      '01', '02', '03', '04', '05', '06',
      '07', '08', '09', '10', '11', '12',
    ];
    const days = Array.from(
      { length: 31 },
      (_, i) => (i + 1).toString().padStart(2, '0')
    );

    const initialParts = value?.split('-') || [];
    const [selYear, setSelYear] = useState(
      initialParts[0] || new Date().getFullYear().toString()
    );
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
            <TouchableOpacity onPress={onCancel} style={{marginTop: 15, alignItems: 'center'}}>
               <Text style={{fontWeight: '900', color: Colors.error}}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
);

export default function PedidoCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { usuario, isAdmin } = useAuth();

  const { toast, show: showToast, hide: hideToast } = useToast();
  const { pedidos, addPedido, updatePedido: updatePedidoStore } = usePedidoStore();

  const isEditing = !!id;
  const existing: Pedido | undefined = isEditing
    ? pedidos.find((p) => p.id_pedido === Number(id))
    : undefined;

  // Bloquear edición para no-admins
  useEffect(() => {
    if (isEditing && !isAdmin) {
      showToast('No tienes permisos para editar pedidos', 'error');
      setTimeout(() => router.back(), 2000);
    }
  }, [isEditing, isAdmin]);

  // Asegurar que el vendedor sea el usuario actual si no es admin
  useEffect(() => {
    if (!isAdmin && usuario?.id_vendedor) {
      setForm(prev => ({ ...prev, vendedor_id: usuario.id_vendedor }));
    }
  }, [isAdmin, usuario]);

  const [form, setForm] = useState({
    cliente_id: (existing?.cliente?.id_cliente ?? null) as number | null,
    vendedor_id: (existing?.vendedor?.id_vendedor ?? (isAdmin ? null : usuario?.id_vendedor)) as number | null,
    estado: existing?.estado ?? 'Pendiente',
    monto_total: existing ? String(existing.monto_total) : '',
    anticipo: existing?.anticipo != null ? String(existing.anticipo) : '',
    fecha_entrega_estimada: existing?.fecha_entrega_estimada ?? '',
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showVendedorModal, setShowVendedorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [clientesData, vendedoresData] = await Promise.all([
        getClientes(),
        getVendedores(),
      ]);
      setClientes(clientesData || []);
      setVendedores(vendedoresData || []);
      
      // AUTO-SELECCIÓN PARA VENDEDORES
      if (!isAdmin && usuario) {
        const yo = vendedoresData.find((v: any) => v.id_vendedor === usuario.id_vendedor);
        if (yo) {
          setForm(prev => ({ ...prev, vendedor_id: yo.id_vendedor }));
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const selectCliente = (c: Cliente) => {
    setForm((prev) => ({ ...prev, cliente_id: c.id_cliente }));
    setShowClienteModal(false);
    setSearchQuery('');
  };

  const selectVendedor = (v: Vendedor) => {
    setForm((prev) => ({ ...prev, vendedor_id: v.id_vendedor }));
    setShowVendedorModal(false);
    setSearchQuery('');
  };

  const selectedCliente = clientes.find((c) => c.id_cliente === form.cliente_id);
  const selectedVendedor = vendedores.find((v) => v.id_vendedor === form.vendedor_id);

  const filteredClientes = clientes.filter((c) =>
    c.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVendedores = useMemo(() => {
    let list = vendedores;
    if (!isAdmin) {
      // Filtrar solo el vendedor logueado
      list = vendedores.filter(v => v.id_vendedor === usuario?.id_vendedor);
    }
    return searchQuery.trim()
      ? list.filter((v) => v.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()))
      : list;
  }, [vendedores, isAdmin, usuario, searchQuery]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.cliente_id) newErrors.cliente_id = 'El cliente es requerido';
    if (!form.monto_total.trim()) {
      newErrors.monto_total = 'El monto total es requerido';
    } else if (isNaN(Number(form.monto_total)) || Number(form.monto_total) < 0) {
      newErrors.monto_total = 'Ingresa un monto válido';
    }
    if (form.anticipo && (isNaN(Number(form.anticipo)) || Number(form.anticipo) < 0)) {
      newErrors.anticipo = 'Ingresa un anticipo válido';
    }
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
        cliente_id: form.cliente_id,
        estado: form.estado,
        monto_total: Number(form.monto_total),
      };
      if (form.vendedor_id) input.vendedor_id = form.vendedor_id;
      if (form.anticipo) input.anticipo = Number(form.anticipo);
      if (form.fecha_entrega_estimada.trim()) input.fecha_entrega_estimada = form.fecha_entrega_estimada.trim();

      if (isEditing && existing) {
        const updated = await updateEstadoPedido(existing.id_pedido, form.estado);
        updatePedidoStore({ ...existing, ...updated, estado: form.estado });
        showToast('Pedido actualizado con éxito', 'success');
      } else {
        const created = await createPedido(input);
        addPedido(created);
        showToast('Pedido creado con éxito', 'success');
      }
      setTimeout(() => router.push('/(app)'), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateConfirm = (field: string, date: string) => {
    setForm((prev) => ({ ...prev, [field]: date }));
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </View>
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/(app)')} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <Text style={styles.title}>{isEditing ? 'Editar Pedido' : 'Nuevo Pedido'}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Asignación</Text>
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Cliente *</Text>
              <Pressable onPress={() => { setSearchQuery(''); setShowClienteModal(true); }} style={[styles.selectorButton, errors.cliente_id && styles.selectorError]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={Colors.primary} />
                <Text style={[styles.selectorValue, !selectedCliente && styles.selectorPlaceholder]}>
                  {selectedCliente ? selectedCliente.nombre_completo : 'Seleccionar cliente'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(26,26,26,0.3)" />
              </Pressable>
              {errors.cliente_id && <Text style={styles.errorText}>{errors.cliente_id}</Text>}
            </View>

            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Vendedor</Text>
              <Pressable 
                onPress={() => { setSearchQuery(''); setShowVendedorModal(true); }} 
                style={[styles.selectorButton, !isAdmin && { backgroundColor: 'rgba(26,26,26,0.05)' }]}
                disabled={!isAdmin}
              >
                <MaterialCommunityIcons name="account-tie-outline" size={20} color={Colors.primary} />
                <Text style={[styles.selectorValue, !selectedVendedor && styles.selectorPlaceholder]}>
                  {selectedVendedor ? selectedVendedor.nombre_completo : 'Seleccionar vendedor'}
                </Text>
                {isAdmin && <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(26,26,26,0.3)" />}
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información Financiera</Text>
            <Input label="Monto Total *" value={form.monto_total} onChangeText={(v) => setField('monto_total', v)} placeholder="0.00" keyboardType="decimal-pad" error={errors.monto_total} leftIcon={<MaterialCommunityIcons name="currency-usd" size={20} color={Colors.primary} />} />
            <Input label="Anticipo" value={form.anticipo} onChangeText={(v) => setField('anticipo', v)} placeholder="0.00" keyboardType="decimal-pad" error={errors.anticipo} leftIcon={<MaterialCommunityIcons name="cash" size={20} color={Colors.primary} />} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Detalles del Pedido</Text>
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Fecha de Entrega Estimada</Text>
              <Pressable onPress={() => { setDatePickerField('fecha_entrega_estimada'); setShowDatePicker(true); }} style={styles.selectorButton}>
                <MaterialCommunityIcons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={[styles.selectorValue, !form.fecha_entrega_estimada && styles.selectorPlaceholder]}>
                  {form.fecha_entrega_estimada ? new Date(form.fecha_entrega_estimada).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Seleccionar fecha (opcional)'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(26,26,26,0.3)" />
              </Pressable>
            </View>

            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Estado *</Text>
              <View style={styles.estadosRow}>
                {ESTADOS_PEDIDO.map((estado) => (
                  <Pressable key={estado} onPress={() => setField('estado', estado)} style={[styles.estadoChip, form.estado === estado && styles.estadoChipSelected]}>
                    <Text style={[styles.estadoChipText, form.estado === estado && styles.estadoChipTextSelected]}>{estado}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={{ marginTop: 20, marginBottom: 80 }}>
            <Button title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR PEDIDO'} onPress={handleSubmit} loading={submitting} size="lg" style={styles.submitBtn} />
          </View>
        </ScrollView>

        <DatePickerModal visible={showDatePicker} field={datePickerField} value={form.fecha_entrega_estimada} onConfirm={handleDateConfirm} onCancel={() => setShowDatePicker(false)} />

        <Modal visible={showClienteModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <Pressable onPress={() => setShowClienteModal(false)}><MaterialCommunityIcons name="close" size={24} color={Colors.error} /></Pressable>
            </View>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar cliente..." style={styles.modalSearch} />
            <FlatList data={filteredClientes} keyExtractor={(item) => `cliente-${item.id_cliente}`} contentContainerStyle={styles.modalList} renderItem={({ item }) => (
              <Pressable style={styles.municipioItem} onPress={() => selectCliente(item)}>
                <View><Text style={styles.municipioName}>{item.nombre_completo}</Text>{item.telefono && <Text style={styles.municipioState}>{item.telefono}</Text>}</View>
                {form.cliente_id === item.id_cliente && <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />}
              </Pressable>
            )} />
          </SafeAreaView>
        </Modal>

        <Modal visible={showVendedorModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Vendedor</Text>
              <Pressable onPress={() => setShowVendedorModal(false)}><MaterialCommunityIcons name="close" size={24} color={Colors.error} /></Pressable>
            </View>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar vendedor..." style={styles.modalSearch} />
            <FlatList data={filteredVendedores} keyExtractor={(item) => `vendedor-${item.id_vendedor}`} contentContainerStyle={styles.modalList} renderItem={({ item }) => (
              <Pressable style={styles.municipioItem} onPress={() => selectVendedor(item)}>
                <View><Text style={styles.municipioName}>{item.nombre_completo}</Text></View>
                {form.vendedor_id === item.id_vendedor && <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />}
              </Pressable>
            )} />
          </SafeAreaView>
        </Modal>

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
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xxl, padding: Spacing.lg, marginBottom: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionTitle: { ...Typography.bodySmall, fontWeight: '900', color: Colors.primary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  selectorContainer: { marginBottom: Spacing.md },
  selectorLabel: { ...Typography.label, marginBottom: Spacing.xs, color: 'rgba(26,26,26,0.6)', fontWeight: '700' },
  selectorButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,26,26,0.03)', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(26,26,26,0.05)', gap: Spacing.sm },
  selectorError: { borderColor: Colors.error },
  selectorValue: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  selectorPlaceholder: { color: 'rgba(26,26,26,0.3)' },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: 4 },
  estadosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  estadoChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: 'rgba(26,26,26,0.1)', backgroundColor: 'rgba(26,26,26,0.02)' },
  estadoChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  estadoChipText: { ...Typography.bodySmall, fontWeight: '600', color: 'rgba(26,26,26,0.5)' },
  estadoChipTextSelected: { color: Colors.primary, fontWeight: '700' },
  submitBtn: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  loadingText: { fontSize: 14, fontWeight: '600', color: 'rgba(26,26,26,0.5)' },
  modalContainer: { flex: 1, backgroundColor: Colors.beige },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  modalTitle: { ...Typography.h4, fontWeight: '900' },
  modalSearch: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  modalList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  municipioItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: Spacing.lg, borderRadius: BorderRadius.xl, marginBottom: Spacing.sm, elevation: 2 },
  municipioName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  municipioState: { fontSize: 12, color: 'rgba(26,26,26,0.5)', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  datePickerCard: { backgroundColor: Colors.beige, width: '85%', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  datePickerTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 15, color: Colors.dark },
  datePickerLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 },
  columnLabel: { fontSize: 10, fontWeight: '900', color: Colors.primary, opacity: 0.6 },
  datePickerRows: { flexDirection: 'row', justifyContent: 'space-between' },
  dateItem: { padding: 10, alignItems: 'center', borderRadius: 8 },
  dateItemSel: { backgroundColor: Colors.primary },
  dateItemText: { fontWeight: '800', fontSize: 16, color: Colors.dark },
  dateItemTextSel: { color: '#FFFFFF' },
});
