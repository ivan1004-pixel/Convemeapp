import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';
import { Shadows } from '../theme/shadows';
import { useColorScheme } from '../hooks/use-color-scheme';
import { createAsignacion } from '../services/asignacion.service';
import { buscarVendedores } from '../services/vendedor.service';
import { buscarProductos } from '../services/producto.service';
import { parseGraphQLError } from '../utils';
import type { Vendedor, Producto } from '../types';

interface ProductoItem {
  id_producto: number;
  nombre: string;
  sku: string;
  precio_unitario: number;
  cantidad: number;
}

interface ModalAsignacionProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalAsignacion({ visible, onClose, onSuccess }: ModalAsignacionProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  // Vendedor
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendedorSearch, setVendedorSearch] = useState('');
  const [vendedorSelected, setVendedorSelected] = useState<Vendedor | null>(null);
  const [vendedorDropOpen, setVendedorDropOpen] = useState(false);
  const [loadingVendedores, setLoadingVendedores] = useState(false);

  // Productos
  const [productoSearch, setProductoSearch] = useState('');
  const [productosFound, setProductosFound] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [productoDropOpen, setProductoDropOpen] = useState(false);
  const [productosAgregados, setProductosAgregados] = useState<ProductoItem[]>([]);

  const [saving, setSaving] = useState(false);

  const vendedorSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productoSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    loadVendedores('');
  }, [visible]);

  const loadVendedores = useCallback(async (search: string) => {
    setLoadingVendedores(true);
    try {
      const result = await buscarVendedores(search);
      setVendedores(result as Vendedor[]);
    } catch {
      // ignore
    } finally {
      setLoadingVendedores(false);
    }
  }, []);

  const onVendedorSearchChange = useCallback(
    (text: string) => {
      setVendedorSearch(text);
      setVendedorDropOpen(true);
      if (vendedorSearchTimer.current) clearTimeout(vendedorSearchTimer.current);
      vendedorSearchTimer.current = setTimeout(() => loadVendedores(text), 300);
    },
    [loadVendedores],
  );

  const selectVendedor = useCallback((v: Vendedor) => {
    setVendedorSelected(v);
    setVendedorSearch(v.nombre_completo);
    setVendedorDropOpen(false);
  }, []);

  const onProductoSearchChange = useCallback((text: string) => {
    setProductoSearch(text);
    if (!text.trim()) {
      setProductosFound([]);
      setProductoDropOpen(false);
      return;
    }
    setProductoDropOpen(true);
    if (productoSearchTimer.current) clearTimeout(productoSearchTimer.current);
    productoSearchTimer.current = setTimeout(async () => {
      setLoadingProductos(true);
      try {
        const result = await buscarProductos(text);
        setProductosFound(result as Producto[]);
      } catch {
        // ignore
      } finally {
        setLoadingProductos(false);
      }
    }, 300);
  }, []);

  const agregarProducto = useCallback((p: Producto) => {
    setProductosAgregados((prev) => {
      const exists = prev.find((item) => item.id_producto === p.id_producto);
      if (exists) {
        return prev.map((item) =>
          item.id_producto === p.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id_producto: p.id_producto,
          nombre: p.nombre,
          sku: p.sku,
          precio_unitario: p.precio_unitario,
          cantidad: 1,
        },
      ];
    });
    setProductoSearch('');
    setProductosFound([]);
    setProductoDropOpen(false);
  }, []);

  const eliminarProducto = useCallback((id: number) => {
    setProductosAgregados((prev) => prev.filter((p) => p.id_producto !== id));
  }, []);

  const setCantidad = useCallback((id: number, value: string) => {
    const num = parseInt(value, 10);
    setProductosAgregados((prev) =>
      prev.map((p) =>
        p.id_producto === id ? { ...p, cantidad: isNaN(num) || num < 1 ? 1 : num } : p,
      ),
    );
  }, []);

  const handleReset = useCallback(() => {
    setVendedorSearch('');
    setVendedorSelected(null);
    setVendedorDropOpen(false);
    setProductoSearch('');
    setProductosFound([]);
    setProductoDropOpen(false);
    setProductosAgregados([]);
    setSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!vendedorSelected) {
      Alert.alert('Aviso', 'Por favor selecciona un vendedor');
      return;
    }
    if (productosAgregados.length === 0) {
      Alert.alert('Aviso', 'Agrega al menos un producto');
      return;
    }
    for (const p of productosAgregados) {
      if (p.cantidad < 1) {
        Alert.alert('Aviso', 'La cantidad debe ser mayor a 0');
        return;
      }
    }
    setSaving(true);
    try {
      await createAsignacion({
        vendedor_id: vendedorSelected.id_vendedor,
        estado: 'Activa',
        detalles: productosAgregados.map((p) => ({
          producto_id: p.id_producto,
          cantidad_asignada: p.cantidad,
        })),
      });
      handleReset();
      onSuccess();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSaving(false);
    }
  }, [vendedorSelected, productosAgregados, handleReset, onSuccess]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.avoidingView}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.surface }, Shadows.lg]}
            onPress={() => {
              setVendedorDropOpen(false);
              setProductoDropOpen(false);
            }}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Nueva Asignacion</Text>
                <Text style={[styles.subtitle, { color: theme.muted }]}>
                  Entregar mercancia a vendedor
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color={theme.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Vendedor */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                  1. SELECCIONAR VENDEDOR
                </Text>
                <View style={styles.dropdownWrapper}>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        borderColor: vendedorSelected ? Colors.success : theme.border,
                        backgroundColor: theme.card,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-outline"
                      size={18}
                      color={theme.muted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Buscar vendedor..."
                      placeholderTextColor={theme.muted}
                      value={vendedorSearch}
                      onChangeText={onVendedorSearchChange}
                      onFocus={() => setVendedorDropOpen(true)}
                    />
                    {loadingVendedores ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <MaterialCommunityIcons
                        name={vendedorDropOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.muted}
                      />
                    )}
                  </View>
                  {vendedorDropOpen && vendedores.length > 0 && (
                    <View
                      style={[
                        styles.dropdown,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        Shadows.md,
                      ]}
                    >
                      {vendedores.slice(0, 8).map((v) => (
                        <TouchableOpacity
                          key={v.id_vendedor}
                          style={[
                            styles.dropdownItem,
                            { borderBottomColor: theme.border },
                          ]}
                          onPress={() => selectVendedor(v)}
                        >
                          <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                            {v.nombre_completo}
                          </Text>
                          {v.email ? (
                            <Text style={[styles.dropdownItemMeta, { color: theme.muted }]}>
                              {v.email}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                {vendedorSelected ? (
                  <View
                    style={[
                      styles.selectedChip,
                      { backgroundColor: Colors.success + '22', borderColor: Colors.success },
                    ]}
                  >
                    <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
                    <Text style={[styles.selectedChipText, { color: Colors.success }]}>
                      {vendedorSelected.nombre_completo}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Productos */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                  2. ANADIR PRODUCTOS
                </Text>
                <View style={styles.dropdownWrapper}>
                  <View
                    style={[
                      styles.inputRow,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="magnify"
                      size={18}
                      color={theme.muted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Buscar producto por nombre o SKU..."
                      placeholderTextColor={theme.muted}
                      value={productoSearch}
                      onChangeText={onProductoSearchChange}
                    />
                    {loadingProductos && <ActivityIndicator size="small" color={Colors.primary} />}
                  </View>
                  {productoDropOpen && productosFound.length > 0 && (
                    <View
                      style={[
                        styles.dropdown,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        Shadows.md,
                      ]}
                    >
                      {productosFound.slice(0, 8).map((p) => (
                        <TouchableOpacity
                          key={p.id_producto}
                          style={[
                            styles.dropdownItem,
                            { borderBottomColor: theme.border },
                          ]}
                          onPress={() => agregarProducto(p)}
                        >
                          <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                            {p.nombre}
                          </Text>
                          <Text style={[styles.dropdownItemMeta, { color: theme.muted }]}>
                            SKU: {p.sku}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Tabla productos */}
              {productosAgregados.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                    3. PRODUCTOS AGREGADOS
                  </Text>
                  <View
                    style={[
                      styles.table,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                  >
                    {/* Head */}
                    <View style={[styles.tableRow, styles.tableHead, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.thText, { color: theme.muted, flex: 3 }]}>Producto</Text>
                      <Text style={[styles.thText, { color: theme.muted, flex: 2 }]}>SKU</Text>
                      <Text style={[styles.thText, { color: theme.muted, flex: 2, textAlign: 'center' }]}>
                        Cantidad
                      </Text>
                      <Text style={[styles.thText, { color: theme.muted, flex: 1, textAlign: 'center' }]}>
                        Accion
                      </Text>
                    </View>
                    {productosAgregados.map((item) => (
                      <View
                        key={item.id_producto}
                        style={[styles.tableRow, { borderBottomColor: theme.border }]}
                      >
                        <Text
                          style={[styles.tdText, { color: theme.text, flex: 3 }]}
                          numberOfLines={1}
                        >
                          {item.nombre}
                        </Text>
                        <Text style={[styles.tdText, { color: theme.muted, flex: 2 }]}>
                          {item.sku}
                        </Text>
                        <View style={{ flex: 2, alignItems: 'center' }}>
                          <TextInput
                            style={[
                              styles.qtyInput,
                              { color: theme.text, borderColor: theme.border },
                            ]}
                            keyboardType="numeric"
                            value={String(item.cantidad)}
                            onChangeText={(v) => setCantidad(item.id_producto, v)}
                          />
                        </View>
                        <TouchableOpacity
                          style={{ flex: 1, alignItems: 'center' }}
                          onPress={() => eliminarProducto(item.id_producto)}
                        >
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={18}
                            color={Colors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: saving ? Colors.success + 'AA' : Colors.success },
                ]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MaterialCommunityIcons name="check" size={18} color="#fff" style={styles.btnIcon} />
                )}
                <Text style={styles.submitBtnText}>
                  {saving ? 'Guardando...' : 'Confirmar Asignacion'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  avoidingView: { width: '100%' },
  sheet: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h4 },
  subtitle: { ...Typography.caption, marginTop: 2 },
  closeBtn: { padding: Spacing.xs },
  body: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  section: { gap: Spacing.sm },
  sectionLabel: { ...Typography.caption, fontWeight: '600', letterSpacing: 0.5 },
  dropdownWrapper: { position: 'relative', zIndex: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  inputIcon: { marginRight: 2 },
  input: { flex: 1, ...Typography.body, paddingVertical: Platform.OS === 'ios' ? 4 : 0 },
  dropdown: {
    position: 'absolute',
    top: '105%',
    left: 0,
    right: 0,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    zIndex: 999,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  dropdownItemText: { ...Typography.bodySmall, fontWeight: '500' },
  dropdownItemMeta: { ...Typography.caption },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  selectedChipText: { ...Typography.caption, fontWeight: '600' },
  table: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  tableHead: { paddingVertical: Spacing.xs },
  thText: { ...Typography.caption, fontWeight: '600' },
  tdText: { ...Typography.caption },
  qtyInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    textAlign: 'center',
    ...Typography.caption,
    minWidth: 40,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  btnIcon: {},
  submitBtnText: { ...Typography.button, color: '#fff' },
});
