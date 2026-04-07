import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createVenta, updateVenta } from '../../../src/services/venta.service';
import { getProductos } from '../../../src/services/producto.service';
import { getClientes, buscarClientes } from '../../../src/services/cliente.service';
import { getVendedores } from '../../../src/services/vendedor.service';
import { useVentaStore } from '../../../src/store/ventaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError, formatCurrency } from '../../../src/utils';
import type { Venta } from '../../../src/types';

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];

// Interfaz para items del carrito
interface CartItem {
  producto_id: number;
  nombre: string;
  sku: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface SelectorProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  isDark: boolean;
}

function Selector({ label, options, selected, onSelect, isDark }: SelectorProps) {
  const theme = isDark ? Colors.dark2 : Colors.light2;
  return (
    <View style={selectorStyles.container}>
      <Text style={[selectorStyles.label, { color: theme.text }]}>{label}</Text>
      <View style={selectorStyles.row}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={({ pressed }) => [
              selectorStyles.chip,
              { borderColor: selected === opt ? Colors.primary : theme.border },
              selected === opt && selectorStyles.chipSelected,
              pressed && selectorStyles.chipPressed,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                selectorStyles.chipText,
                { color: selected === opt ? Colors.primary : theme.muted },
                selected === opt && selectorStyles.chipTextSelected,
              ]}
            >
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { ...Typography.label, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipSelected: { backgroundColor: Colors.primaryLight },
  chipPressed: { opacity: 0.75 },
  chipText: { ...Typography.bodySmall },
  chipTextSelected: { fontWeight: '600' },
});

import { useAuth } from '../../../src/hooks/useAuth';

export default function VentaCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { usuario, isAdmin } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { toast, show, hide } = useToast();
  const { ventas, addVenta, updateVenta: updateVentaStore } = useVentaStore();

  const isEditing = !!id;

  // Bloquear edición para no-admins
  useEffect(() => {
    if (isEditing && !isAdmin) {
      show('No tienes permisos para editar ventas', 'error');
      setTimeout(() => router.back(), 2000);
    }
  }, [isEditing, isAdmin]);

  const existing: Venta | undefined = isEditing
    ? ventas.find((v) => v.id_venta === Number(id))
    : undefined;

  // Estados del formulario
  const [form, setForm] = useState({
    cliente_id: existing?.cliente?.id_cliente ?? null,
    vendedor_id: existing?.vendedor?.id_vendedor ?? (isAdmin ? null : usuario?.id_vendedor),
    metodo_pago: existing?.metodo_pago ?? 'Efectivo',
  });

  // Asegurar que el vendedor sea el usuario actual si no es admin
  useEffect(() => {
    if (!isAdmin && usuario?.id_vendedor) {
      setForm(prev => ({ ...prev, vendedor_id: usuario.id_vendedor }));
    }
  }, [isAdmin, usuario]);

  // Carrito de productos
  const [cart, setCart] = useState<CartItem[]>([]);
  const [monto_total, setMontoTotal] = useState(0);

  // Estados para modales y búsqueda
  const [showProductModal, setShowProductModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showVendedorModal, setShowVendedorModal] = useState(false);

  // Datos
  const [productos, setProductos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);

  // Estados de búsqueda
  const [searchProduct, setSearchProduct] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [searchVendedor, setSearchVendedor] = useState('');

  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [pData, cData, vData] = await Promise.all([
          getProductos(),
          getClientes(),
          getVendedores(),
        ]);
        setProductos(pData);
        setClientes(cData);
        setVendedores(vData);

        // AUTO-SELECCIÓN PARA VENDEDORES
        if (!isAdmin && usuario) {
          const yo = vData.find((v: any) => v.id_vendedor === usuario.id_vendedor || v.username === usuario.username);
          if (yo) {
            setField('vendedor_id', yo.id_vendedor);
          }
        }

        // Si estamos editando, cargar carrito
        if (isEditing && existing?.detalles) {
          const initialCart = existing.detalles.map((det) => ({
            producto_id: det.producto?.id_producto || 0,
            nombre: det.producto?.nombre || 'Producto',
            sku: det.producto?.sku || '-',
            cantidad: det.cantidad,
            precio_unitario: det.precio_unitario,
            subtotal: det.cantidad * det.precio_unitario,
          }));
          setCart(initialCart);
        }
      } catch (err) {
        show(parseGraphQLError(err), 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isEditing, existing, show]);

  // Recalcular total cuando cambia el carrito
  useEffect(() => {
    const total = cart.reduce((acc, item) => acc + item.subtotal, 0);
    setMontoTotal(total);
  }, [cart]);

  // Manejar búsqueda de clientes
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchClient.trim()) {
        setLoadingClients(true);
        try {
          const results = await buscarClientes(searchClient);
          setClientes(results);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingClients(false);
        }
      } else {
        const results = await getClientes();
        setClientes(results);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchClient]);

  const addToCart = (producto: any) => {
    const existingItem = cart.find((item) => item.producto_id === producto.id_producto);
    if (existingItem) {
      const updatedCart = cart.map((item) =>
        item.producto_id === producto.id_producto
          ? {
              ...item,
              cantidad: item.cantidad + 1,
              subtotal: (item.cantidad + 1) * item.precio_unitario,
            }
          : item
      );
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          producto_id: producto.id_producto,
          nombre: producto.nombre,
          sku: producto.sku,
          cantidad: 1,
          precio_unitario: producto.precio_unitario,
          subtotal: producto.precio_unitario,
        },
      ]);
    }
    setShowProductModal(false);
    setSearchProduct('');
  };

  const removeFromCart = (producto_id: number) => {
    setCart(cart.filter((item) => item.producto_id !== producto_id));
  };

  const updateQuantity = (producto_id: number, delta: number) => {
    const updatedCart = cart
      .map((item) => {
        if (item.producto_id === producto_id) {
          const newQty = Math.max(0, item.cantidad + delta);
          return {
            ...item,
            cantidad: newQty,
            subtotal: newQty * item.precio_unitario,
          };
        }
        return item;
      })
      .filter((item) => item.cantidad > 0);
    setCart(updatedCart);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.vendedor_id) newErrors.vendedor_id = 'El vendedor es requerido';
    if (cart.length === 0) newErrors.cart = 'El carrito está vacío';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEditing && existing) {
        const updated = await updateVenta({
          id_venta: existing.id_venta,
          cliente_id: form.cliente_id,
          vendedor_id: form.vendedor_id,
          metodo_pago: form.metodo_pago,
          monto_total,
        });
        
        const updatedWithDetails = { 
          ...existing, 
          ...updated, 
          detalles: cart.map(item => ({
            id_det_venta: 0,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            producto: { id_producto: item.producto_id, nombre: item.nombre, sku: item.sku, precio_unitario: item.precio_unitario }
          }))
        };
        updateVentaStore(updatedWithDetails as any);
        show('Venta actualizada correctamente', 'success');
      } else {
        const created = await createVenta({
          cliente_id: form.cliente_id,
          vendedor_id: form.vendedor_id,
          metodo_pago: form.metodo_pago,
          monto_total,
          detalles: cart.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
          })),
        });
        addVenta(created);
        show('Venta registrada correctamente', 'success');
      }
      setTimeout(() => router.push('/(app)'), 1500);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const textPrimary = '#1A1A1A';
  const bgField = '#FFFFFF';

  const selectedClient = clientes.find((c) => c.id_cliente === form.cliente_id);
  const selectedVendedor = vendedores.find((v) => v.id_vendedor === form.vendedor_id);

  const filteredProducts = searchProduct.trim()
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchProduct.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchProduct.toLowerCase())
      )
    : productos;

  const filteredVendedores = useMemo(() => {
    let list = vendedores;
    if (!isAdmin) {
      list = vendedores.filter(v => v.id_vendedor === usuario?.id_vendedor || v.username === usuario?.username);
    }
    return searchVendedor.trim()
      ? list.filter((v) => v.nombre_completo.toLowerCase().includes(searchVendedor.toLowerCase()))
      : list;
  }, [vendedores, isAdmin, usuario, searchVendedor]);

  if (loading) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <LoadingSpinner fullScreen message="Cargando datos..." />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/(app)')} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>
            {isEditing ? 'Editar Venta' : 'Punto de Venta'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cliente (Opcional) */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textPrimary }]}>Cliente (Opcional)</Text>
          <Pressable
            onPress={() => setShowClientModal(true)}
            style={[styles.selectButton, { backgroundColor: bgField, borderColor: theme.border }]}
          >
            <Text style={[styles.selectButtonText, { color: selectedClient ? textPrimary : theme.muted }]}>
              {selectedClient ? selectedClient.nombre_completo : 'Seleccionar cliente'}
            </Text>
            <Text style={styles.selectButtonIcon}>›</Text>
          </Pressable>
        </View>

        {/* Vendedor (Requerido) */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textPrimary }]}>Vendedor *</Text>
          <Pressable
            onPress={() => setShowVendedorModal(true)}
            style={[
              styles.selectButton,
              { backgroundColor: bgField, borderColor: errors.vendedor_id ? Colors.error : theme.border }
            ]}
          >
            <Text style={[styles.selectButtonText, { color: selectedVendedor ? textPrimary : theme.muted }]}>
              {selectedVendedor ? selectedVendedor.nombre_completo : 'Seleccionar vendedor'}
            </Text>
            <Text style={styles.selectButtonIcon}>›</Text>
          </Pressable>
          {errors.vendedor_id && <Text style={styles.errorText}>{errors.vendedor_id}</Text>}
        </View>

        {/* Productos (Carrito) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>Productos *</Text>
            <Pressable onPress={() => setShowProductModal(true)} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Agregar</Text>
            </Pressable>
          </View>

          {cart.length === 0 ? (
            <View style={[styles.emptyCart, { backgroundColor: bgField, borderColor: theme.border }]}>
              <Text style={[styles.emptyCartText, { color: theme.muted }]}>
                No hay productos en el carrito
              </Text>
            </View>
          ) : (
            <View style={styles.cartList}>
              {cart.map((item, index) => (
                <View key={item.producto_id} style={[styles.cartItem, { backgroundColor: bgField, borderColor: theme.border }]}>
                  <View style={styles.cartItemInfo}>
                    <Text style={[styles.cartItemName, { color: textPrimary }]}>{item.nombre}</Text>
                    <Text style={[styles.cartItemSku, { color: theme.muted }]}>SKU: {item.sku}</Text>
                    <Text style={[styles.cartItemPrice, { color: Colors.primary }]}>
                      {formatCurrency(item.precio_unitario)}
                    </Text>
                  </View>
                  
                  <View style={styles.cartItemActions}>
                    <TouchableOpacity onPress={() => updateQuantity(item.producto_id, -1)} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: textPrimary }]}>{item.cantidad}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.producto_id, 1)} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeFromCart(item.producto_id)} style={styles.removeBtn}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          {errors.cart && <Text style={styles.errorText}>{errors.cart}</Text>}
        </View>

        {/* Método de Pago */}
        <View style={styles.section}>
          <Selector
            label="Método de Pago"
            options={METODOS_PAGO}
            selected={form.metodo_pago}
            onSelect={(val) => setField('metodo_pago', val)}
            isDark={isDark}
          />
        </View>

        {/* Resumen y Botón */}
        <View style={[styles.footer, { backgroundColor: bgField, borderColor: theme.border }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.muted }]}>Total a pagar</Text>
            <Text style={[styles.totalAmount, { color: Colors.primary }]}>
              {formatCurrency(monto_total)}
            </Text>
          </View>
          
          <Button
            title={isEditing ? 'ACTUALIZAR VENTA' : 'FINALIZAR VENTA'}
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>

      {/* Modal Productos */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.beige, borderTopColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Seleccionar Producto</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={textPrimary} />
              </TouchableOpacity>
            </View>
            
            <SearchBar
              value={searchProduct}
              onChangeText={setSearchProduct}
              placeholder="Buscar por nombre o SKU..."
            />

            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => String(item.id_producto)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => addToCart(item)}
                  style={[styles.listItem, { borderBottomColor: theme.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemName, { color: textPrimary }]}>{item.nombre}</Text>
                    <Text style={[styles.listItemSku, { color: theme.muted }]}>SKU: {item.sku}</Text>
                  </View>
                  <Text style={[styles.listItemPrice, { color: Colors.primary }]}>
                    {formatCurrency(item.precio_unitario)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron productos</Text>}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Clientes */}
      <Modal visible={showClientModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.beige, borderTopColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => setShowClientModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={textPrimary} />
              </TouchableOpacity>
            </View>
            
            <SearchBar
              value={searchClient}
              onChangeText={setSearchClient}
              placeholder="Buscar por nombre o teléfono..."
            />

            {loadingClients ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={clientes}
                keyExtractor={(item) => String(item.id_cliente)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => { setField('cliente_id', item.id_cliente); setShowClientModal(false); }}
                    style={[styles.listItem, { borderBottomColor: theme.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listItemName, { color: textPrimary }]}>{item.nombre_completo}</Text>
                      <Text style={[styles.listItemSku, { color: theme.muted }]}>{item.telefono || 'Sin teléfono'}</Text>
                    </View>
                    {form.cliente_id === item.id_cliente && (
                      <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron clientes</Text>}
              />
            )}
            <TouchableOpacity 
                style={styles.clearSelect} 
                onPress={() => { setField('cliente_id', null); setShowClientModal(false); }}
            >
                <Text style={styles.clearSelectText}>Quitar selección</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Vendedores */}
      <Modal visible={showVendedorModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.beige, borderTopColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Seleccionar Vendedor</Text>
              <TouchableOpacity onPress={() => setShowVendedorModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={textPrimary} />
              </TouchableOpacity>
            </View>
            
            <SearchBar
              value={searchVendedor}
              onChangeText={setSearchVendedor}
              placeholder="Buscar vendedor..."
            />

            <FlatList
              data={filteredVendedores}
              keyExtractor={(item) => String(item.id_vendedor)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setField('vendedor_id', item.id_vendedor); setShowVendedorModal(false); }}
                  style={[styles.listItem, { borderBottomColor: theme.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemName, { color: textPrimary }]}>{item.nombre_completo}</Text>
                  </View>
                  {form.vendedor_id === item.id_vendedor && (
                    <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron vendedores</Text>}
            />
          </View>
        </SafeAreaView>
      </Modal>

      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  backIcon: { fontSize: 22, color: Colors.primary },
  title: { ...Typography.h4, flex: 1, fontWeight: '900' },
  headerPlaceholder: { width: 32 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 150 },
  section: { marginBottom: Spacing.lg },
  sectionLabel: { fontSize: 12, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  selectButton: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.dark },
  selectButtonText: { flex: 1, fontSize: 14, fontWeight: '700' },
  selectButtonIcon: { fontSize: 20, color: 'rgba(0,0,0,0.3)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addButton: { backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary },
  addButtonText: { color: Colors.primary, fontWeight: '800', fontSize: 12 },
  emptyCart: { padding: 30, alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(0,0,0,0.1)' },
  emptyCartText: { fontWeight: '700', fontSize: 13 },
  cartList: { gap: Spacing.sm },
  cartItem: { flexDirection: 'row', padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 2, borderColor: Colors.dark },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '800' },
  cartItemSku: { fontSize: 10, marginTop: 2 },
  cartItemPrice: { fontSize: 13, fontWeight: '900', marginTop: 4 },
  cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.dark },
  qtyBtnText: { fontWeight: '900', fontSize: 16 },
  qtyText: { fontWeight: '900', fontSize: 15, minWidth: 20, textAlign: 'center' },
  removeBtn: { marginLeft: 5 },
  footer: { padding: Spacing.lg, borderRadius: BorderRadius.xxl, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, marginTop: Spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.md },
  totalLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  totalAmount: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  submitBtn: { height: 60, borderWidth: 3, borderColor: Colors.dark },
  errorText: { color: Colors.error, fontSize: 10, fontWeight: '800', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, borderTopWidth: 4, padding: Spacing.lg, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1 },
  listItemName: { fontSize: 15, fontWeight: '800' },
  listItemSku: { fontSize: 11, marginTop: 2 },
  listItemPrice: { fontSize: 14, fontWeight: '900' },
  emptyText: { textAlign: 'center', padding: 20, fontWeight: '700', color: 'rgba(0,0,0,0.3)' },
  clearSelect: { padding: 15, alignItems: 'center', marginTop: 10 },
  clearSelectText: { color: Colors.error, fontWeight: '800' },
});
