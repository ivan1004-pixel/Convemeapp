import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function VentaCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { ventas, addVenta, updateVenta: updateVentaStore } = useVentaStore();

  const isEditing = !!id;
  const existing: Venta | undefined = isEditing
    ? ventas.find((v) => v.id_venta === Number(id))
    : undefined;

  // Estados del formulario
  const [form, setForm] = useState({
    cliente_id: existing?.cliente?.id_cliente ?? null,
    vendedor_id: existing?.vendedor?.id_vendedor ?? null,
    metodo_pago: existing?.metodo_pago ?? 'Efectivo',
  });

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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, clients, vends] = await Promise.all([
        getProductos(),
        getClientes(),
        getVendedores(),
      ]);
      console.log('📦 Productos cargados:', prods.length);
      console.log('👤 Clientes cargados:', clients.length);
      console.log('🛍️  Vendedores cargados:', vends.length);
      setProductos(prods);
      setClientes(clients);
      setVendedores(vends);
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes (filtra desde la lista ya cargada o hace búsqueda en el backend)
  const handleSearchClient = async (text: string) => {
    setSearchClient(text);
    if (text.trim().length > 2) {
      try {
        const results = await buscarClientes(text);
        setClientes(results);
      } catch (err) {
        console.error(err);
      }
    } else if (text.trim().length === 0) {
      // Si borra el texto, recargar todos los clientes
      try {
        const allClients = await getClientes();
        setClientes(allClients);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Calcular total del carrito
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    setMontoTotal(total);
  }, [cart]);

  // Agregar producto al carrito
  const addToCart = (producto: any) => {
    const existing = cart.find((item) => item.producto_id === producto.id_producto);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.producto_id === producto.id_producto
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precio_unitario,
              }
            : item
        )
      );
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
  };

  // Actualizar cantidad de producto en carrito
  const updateCartQuantity = (producto_id: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(producto_id);
      return;
    }
    setCart(
      cart.map((item) =>
        item.producto_id === producto_id
          ? {
              ...item,
              cantidad,
              subtotal: cantidad * item.precio_unitario,
            }
          : item
      )
    );
  };

  // Remover producto del carrito
  const removeFromCart = (producto_id: number) => {
    setCart(cart.filter((item) => item.producto_id !== producto_id));
  };

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (cart.length === 0) {
      newErrors.cart = 'Agrega al menos un producto a la venta';
    }
    if (!form.vendedor_id) {
      newErrors.vendedor_id = 'Selecciona un vendedor';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validación', 'Por favor completa todos los campos requeridos');
      return;
    }
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
        updateVentaStore({ ...existing, ...updated });
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
      }
      Alert.alert('Éxito', 'Venta registrada correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClient = clientes.find((c) => c.id_cliente === form.cliente_id);
  const selectedVendedor = vendedores.find((v) => v.id_vendedor === form.vendedor_id);

  const filteredProducts = searchProduct.trim()
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchProduct.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchProduct.toLowerCase())
      )
    : productos;

  const filteredVendedores = searchVendedor.trim()
    ? vendedores.filter((v) =>
        v.nombre_completo.toLowerCase().includes(searchVendedor.toLowerCase())
      )
    : vendedores;

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
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
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
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Cliente (Opcional)</Text>
          <Pressable
            onPress={() => setShowClientModal(true)}
            style={[styles.selectButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.selectButtonText, { color: selectedClient ? theme.text : theme.muted }]}>
              {selectedClient ? selectedClient.nombre_completo : 'Seleccionar cliente'}
            </Text>
            <Text style={styles.selectButtonIcon}>›</Text>
          </Pressable>
        </View>

        {/* Vendedor (Requerido) */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Vendedor *</Text>
          <Pressable
            onPress={() => setShowVendedorModal(true)}
            style={[
              styles.selectButton,
              { backgroundColor: theme.card, borderColor: errors.vendedor_id ? Colors.error : theme.border }
            ]}
          >
            <Text style={[styles.selectButtonText, { color: selectedVendedor ? theme.text : theme.muted }]}>
              {selectedVendedor ? selectedVendedor.nombre_completo : 'Seleccionar vendedor'}
            </Text>
            <Text style={styles.selectButtonIcon}>›</Text>
          </Pressable>
          {errors.vendedor_id && <Text style={styles.errorText}>{errors.vendedor_id}</Text>}
        </View>

        {/* Productos (Carrito) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>Productos *</Text>
            <Pressable onPress={() => setShowProductModal(true)} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Agregar</Text>
            </Pressable>
          </View>

          {cart.length === 0 ? (
            <View style={[styles.emptyCart, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.emptyCartText, { color: theme.muted }]}>
                No hay productos en el carrito
              </Text>
            </View>
          ) : (
            <View style={styles.cartList}>
              {cart.map((item) => (
                <View key={item.producto_id} style={[styles.cartItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.cartItemInfo}>
                    <Text style={[styles.cartItemName, { color: theme.text }]}>{item.nombre}</Text>
                    <Text style={[styles.cartItemSku, { color: theme.muted }]}>SKU: {item.sku}</Text>
                    <Text style={[styles.cartItemPrice, { color: Colors.primary }]}>
                      {formatCurrency(item.precio_unitario)}
                    </Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <View style={styles.quantityControl}>
                      <Pressable
                        onPress={() => updateCartQuantity(item.producto_id, item.cantidad - 1)}
                        style={[styles.quantityButton, { backgroundColor: theme.border }]}
                      >
                        <Text style={[styles.quantityButtonText, { color: theme.text }]}>−</Text>
                      </Pressable>
                      <Text style={[styles.quantityText, { color: theme.text }]}>{item.cantidad}</Text>
                      <Pressable
                        onPress={() => updateCartQuantity(item.producto_id, item.cantidad + 1)}
                        style={[styles.quantityButton, { backgroundColor: theme.border }]}
                      >
                        <Text style={[styles.quantityButtonText, { color: theme.text }]}>+</Text>
                      </Pressable>
                    </View>
                    <Text style={[styles.cartItemSubtotal, { color: theme.text }]}>
                      {formatCurrency(item.subtotal)}
                    </Text>
                    <Pressable
                      onPress={() => removeFromCart(item.producto_id)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
          {errors.cart && <Text style={styles.errorText}>{errors.cart}</Text>}
        </View>

        {/* Total */}
        <View style={[styles.totalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.totalLabel, { color: theme.muted }]}>Total de la venta</Text>
          <Text style={[styles.totalAmount, { color: Colors.primary }]}>
            {formatCurrency(monto_total)}
          </Text>
        </View>

        <Selector
          label="Método de Pago"
          options={METODOS_PAGO}
          selected={form.metodo_pago}
          onSelect={(v) => setField('metodo_pago', v)}
          isDark={isDark}
        />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Registrar venta'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitBtn}
        />

        <Button
          title="Cancelar"
          variant="ghost"
          onPress={() => router.back()}
          disabled={submitting}
          style={styles.cancelBtn}
        />
      </ScrollView>

      {/* Modal de Productos */}
      <Modal visible={showProductModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Seleccionar Producto</Text>
            <Pressable onPress={() => setShowProductModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
          <SearchBar
            value={searchProduct}
            onChangeText={setSearchProduct}
            placeholder="Buscar por nombre o SKU..."
            style={styles.searchBar}
          />
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => String(item.id_producto)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => addToCart(item)}
                style={[styles.productItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View>
                  <Text style={[styles.productName, { color: theme.text }]}>{item.nombre}</Text>
                  <Text style={[styles.productSku, { color: theme.muted }]}>SKU: {item.sku}</Text>
                </View>
                <Text style={[styles.productPrice, { color: Colors.primary }]}>
                  {formatCurrency(item.precio_unitario)}
                </Text>
              </Pressable>
            )}
            contentContainerStyle={styles.productList}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de Clientes */}
      <Modal visible={showClientModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Seleccionar Cliente</Text>
            <Pressable onPress={() => setShowClientModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
          <SearchBar
            value={searchClient}
            onChangeText={handleSearchClient}
            placeholder="Buscar cliente..."
            style={styles.searchBar}
          />
          <FlatList
            data={clientes}
            keyExtractor={(item) => String(item.id_cliente)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setField('cliente_id', item.id_cliente);
                  setShowClientModal(false);
                  setSearchClient(''); // Limpiar búsqueda
                }}
                style={[styles.clientItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View>
                  <Text style={[styles.clientName, { color: theme.text }]}>{item.nombre_completo}</Text>
                  {item.email && <Text style={[styles.clientEmail, { color: theme.muted }]}>{item.email}</Text>}
                  {item.telefono && <Text style={[styles.clientEmail, { color: theme.muted }]}>{item.telefono}</Text>}
                </View>
              </Pressable>
            )}
            contentContainerStyle={styles.clientList}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={[styles.emptyListText, { color: theme.muted }]}>
                  {searchClient.trim().length > 0
                    ? 'No se encontraron clientes con ese criterio'
                    : 'No hay clientes registrados'}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de Vendedores */}
      <Modal visible={showVendedorModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Seleccionar Vendedor</Text>
            <Pressable onPress={() => setShowVendedorModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
          <SearchBar
            value={searchVendedor}
            onChangeText={setSearchVendedor}
            placeholder="Buscar vendedor..."
            style={styles.searchBar}
          />
          <FlatList
            data={filteredVendedores}
            keyExtractor={(item) => String(item.id_vendedor)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setField('vendedor_id', item.id_vendedor);
                  setShowVendedorModal(false);
                  setSearchVendedor(''); // Limpiar búsqueda
                }}
                style={[styles.vendedorItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View>
                  <Text style={[styles.vendedorName, { color: theme.text }]}>{item.nombre_completo}</Text>
                  {item.email && <Text style={[styles.vendedorEmail, { color: theme.muted }]}>{item.email}</Text>}
                  {item.telefono && <Text style={[styles.vendedorEmail, { color: theme.muted }]}>{item.telefono}</Text>}
                </View>
              </Pressable>
            )}
            contentContainerStyle={styles.vendedorList}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={[styles.emptyListText, { color: theme.muted }]}>
                  {searchVendedor.trim().length > 0
                    ? 'No se encontraron vendedores con ese criterio'
                    : 'No hay vendedores registrados'}
                </Text>
              </View>
            }
          />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  backIcon: { fontSize: 22, color: Colors.primary },
  title: { ...Typography.h4, flex: 1 },
  headerPlaceholder: { width: 32 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  section: { marginBottom: Spacing.lg },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  selectButtonText: { ...Typography.body, flex: 1 },
  selectButtonIcon: { fontSize: 24, color: Colors.primary, marginLeft: Spacing.sm },
  addButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  addButtonText: { ...Typography.bodySmall, color: '#ffffff', fontWeight: '600' },
  emptyCart: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyCartText: { ...Typography.body },
  cartList: { gap: Spacing.sm },
  cartItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { ...Typography.bodyBold, marginBottom: Spacing.xs },
  cartItemSku: { ...Typography.caption, marginBottom: Spacing.xs },
  cartItemPrice: { ...Typography.body, fontWeight: '600' },
  cartItemActions: { alignItems: 'flex-end', gap: Spacing.sm },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: { fontSize: 18, fontWeight: '600' },
  quantityText: { ...Typography.body, minWidth: 24, textAlign: 'center' },
  cartItemSubtotal: { ...Typography.h5, fontWeight: '700' },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  totalContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  totalLabel: { ...Typography.body, marginBottom: Spacing.xs },
  totalAmount: { ...Typography.h2, fontWeight: '700' },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: Spacing.xs },
  submitBtn: { marginTop: Spacing.md },
  cancelBtn: { marginTop: Spacing.sm },
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  modalTitle: { ...Typography.h4 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '20',
  },
  closeButtonText: { fontSize: 20, color: Colors.error, fontWeight: '600' },
  searchBar: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  productList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  productName: { ...Typography.bodyBold, marginBottom: Spacing.xs },
  productSku: { ...Typography.caption },
  productPrice: { ...Typography.h5, fontWeight: '600' },
  clientList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  clientItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  clientName: { ...Typography.bodyBold, marginBottom: Spacing.xs },
  clientEmail: { ...Typography.caption },
  vendedorList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  vendedorItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  vendedorName: { ...Typography.bodyBold, marginBottom: Spacing.xs },
  vendedorEmail: { ...Typography.caption },
  emptyList: { padding: Spacing.xxl, alignItems: 'center' },
  emptyListText: { ...Typography.body, textAlign: 'center' },
});
