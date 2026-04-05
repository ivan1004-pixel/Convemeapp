import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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
import { createCorte } from '../services/corte.service';
import { getAsignaciones } from '../services/asignacion.service';
import { parseGraphQLError, formatCurrency } from '../utils';
import type { Asignacion, DetalleAsignacion } from '../types';

interface DetalleCorteInput {
  id_det_asignacion: number;
  producto_id: number;
  nombre: string;
  cantidad_asignada: number;
  precio_unitario: number;
  cantidad_vendida: string;
  cantidad_devuelta: string;
  merma_reportada: string;
}

interface ModalCorteProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalCorte({ visible, onClose, onSuccess }: ModalCorteProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [asignacionSelected, setAsignacionSelected] = useState<Asignacion | null>(null);
  const [asignacionDropOpen, setAsignacionDropOpen] = useState(false);
  const [loadingAsignaciones, setLoadingAsignaciones] = useState(false);

  const [dineroEntregado, setDineroEntregado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<DetalleCorteInput[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    loadAsignaciones();
  }, [visible]);

  const loadAsignaciones = useCallback(async () => {
    setLoadingAsignaciones(true);
    try {
      const all: Asignacion[] = await getAsignaciones('');
      const activas = all.filter((a) => a.estado === 'Activa');
      setAsignaciones(activas);
    } catch {
      // ignore
    } finally {
      setLoadingAsignaciones(false);
    }
  }, []);

  const selectAsignacion = useCallback((a: Asignacion) => {
    setAsignacionSelected(a);
    setAsignacionDropOpen(false);
    // Build detalles from asignacion
    const rows: DetalleCorteInput[] = (a.detalles || []).map((d: DetalleAsignacion) => ({
      id_det_asignacion: d.id_det_asignacion,
      producto_id: d.producto?.id_producto ?? 0,
      nombre: d.producto?.nombre ?? 'Producto',
      cantidad_asignada: d.cantidad_asignada,
      precio_unitario: d.producto?.precio_unitario ?? 0,
      cantidad_vendida: '',
      cantidad_devuelta: '',
      merma_reportada: '',
    }));
    setDetalles(rows);
  }, []);

  const updateDetalle = useCallback(
    (idx: number, field: 'cantidad_vendida' | 'cantidad_devuelta' | 'merma_reportada', value: string) => {
      setDetalles((prev) =>
        prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)),
      );
    },
    [],
  );

  const dineroEsperado = detalles.reduce((acc, d) => {
    const vendida = parseFloat(d.cantidad_vendida) || 0;
    return acc + vendida * d.precio_unitario;
  }, 0);

  const dineroEntregadoNum = parseFloat(dineroEntregado) || 0;
  const diferencia = dineroEntregadoNum - dineroEsperado;

  const handleReset = useCallback(() => {
    setAsignacionSelected(null);
    setAsignacionDropOpen(false);
    setDineroEntregado('');
    setObservaciones('');
    setDetalles([]);
    setSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!asignacionSelected) {
      Alert.alert('Aviso', 'Por favor selecciona una asignacion');
      return;
    }
    if (!dineroEntregado.trim() || isNaN(parseFloat(dineroEntregado))) {
      Alert.alert('Aviso', 'Ingresa el dinero entregado');
      return;
    }
    for (const d of detalles) {
      const v = parseFloat(d.cantidad_vendida);
      if (isNaN(v) || v < 0) {
        Alert.alert('Aviso', `Ingresa la cantidad vendida para "${d.nombre}"`);
        return;
      }
    }
    setSaving(true);
    try {
      await createCorte({
        vendedor_id: asignacionSelected.vendedor?.id_vendedor,
        asignacion_id: asignacionSelected.id_asignacion,
        dinero_total_entregado: dineroEntregadoNum,
        dinero_esperado: dineroEsperado,
        diferencia_corte: diferencia,
        observaciones: observaciones.trim() || undefined,
        detalles: detalles.map((d) => ({
          producto_id: d.producto_id,
          cantidad_vendida: parseFloat(d.cantidad_vendida) || 0,
          cantidad_devuelta: parseFloat(d.cantidad_devuelta) || 0,
          merma_reportada: parseFloat(d.merma_reportada) || 0,
        })),
      });
      handleReset();
      onSuccess();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSaving(false);
    }
  }, [
    asignacionSelected,
    dineroEntregado,
    dineroEntregadoNum,
    dineroEsperado,
    diferencia,
    observaciones,
    detalles,
    handleReset,
    onSuccess,
  ]);

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
            onPress={() => setAsignacionDropOpen(false)}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Realizar Corte</Text>
                <Text style={[styles.subtitle, { color: theme.muted }]}>
                  Conciliar ventas y dinero
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
              {/* Asignacion */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                  1. SELECCIONAR ASIGNACION
                </Text>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      {
                        borderColor: asignacionSelected ? Colors.primary : theme.border,
                        backgroundColor: theme.card,
                      },
                    ]}
                    onPress={() => setAsignacionDropOpen((o) => !o)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="clipboard-list-outline"
                      size={18}
                      color={theme.muted}
                    />
                    <Text
                      style={[
                        styles.dropdownTriggerText,
                        {
                          color: asignacionSelected ? theme.text : theme.muted,
                          flex: 1,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {asignacionSelected
                        ? `#${asignacionSelected.id_asignacion} - ${asignacionSelected.vendedor?.nombre_completo ?? ''}`
                        : 'Seleccionar asignacion activa...'}
                    </Text>
                    {loadingAsignaciones ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <MaterialCommunityIcons
                        name={asignacionDropOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.muted}
                      />
                    )}
                  </TouchableOpacity>
                  {asignacionDropOpen && asignaciones.length > 0 && (
                    <View
                      style={[
                        styles.dropdown,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        Shadows.md,
                      ]}
                    >
                      {asignaciones.map((a) => (
                        <TouchableOpacity
                          key={a.id_asignacion}
                          style={[
                            styles.dropdownItem,
                            { borderBottomColor: theme.border },
                          ]}
                          onPress={() => selectAsignacion(a)}
                        >
                          <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                            {`#${a.id_asignacion} - ${a.vendedor?.nombre_completo ?? 'Sin vendedor'}`}
                          </Text>
                          <Text style={[styles.dropdownItemMeta, { color: theme.muted }]}>
                            {`${a.detalles?.length ?? 0} productos`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {asignacionDropOpen && asignaciones.length === 0 && !loadingAsignaciones && (
                    <View
                      style={[
                        styles.dropdown,
                        { backgroundColor: theme.card, borderColor: theme.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownItemMeta,
                          { color: theme.muted, padding: Spacing.md },
                        ]}
                      >
                        No hay asignaciones activas
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Dinero entregado */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                  2. DINERO ENTREGADO
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { borderColor: theme.border, backgroundColor: theme.card },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="currency-usd"
                    size={18}
                    color={theme.muted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.muted}
                    keyboardType="numeric"
                    value={dineroEntregado}
                    onChangeText={setDineroEntregado}
                  />
                </View>
              </View>

              {/* Observaciones */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                  3. OBSERVACIONES
                </Text>
                <TextInput
                  style={[
                    styles.textarea,
                    { borderColor: theme.border, backgroundColor: theme.card, color: theme.text },
                  ]}
                  placeholder="Notas adicionales (opcional)..."
                  placeholderTextColor={theme.muted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={observaciones}
                  onChangeText={setObservaciones}
                />
              </View>

              {/* Detalles por producto */}
              {detalles.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                    4. TABLA DETALLES
                  </Text>
                  <View
                    style={[
                      styles.table,
                      { borderColor: theme.border, backgroundColor: theme.card },
                    ]}
                  >
                    <View
                      style={[
                        styles.tableRow,
                        styles.tableHead,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.thText, { color: theme.muted, flex: 3 }]}>Producto</Text>
                      <Text style={[styles.thText, { color: theme.muted, flex: 2, textAlign: 'center' }]}>
                        Asignado
                      </Text>
                      <Text style={[styles.thText, { color: theme.muted, flex: 2, textAlign: 'center' }]}>
                        Vendido
                      </Text>
                      <Text style={[styles.thText, { color: theme.muted, flex: 2, textAlign: 'center' }]}>
                        Dev.
                      </Text>
                      <Text style={[styles.thText, { color: theme.muted, flex: 2, textAlign: 'center' }]}>
                        Merma
                      </Text>
                    </View>
                    {detalles.map((d, idx) => (
                      <View
                        key={d.producto_id}
                        style={[styles.tableRow, { borderBottomColor: theme.border }]}
                      >
                        <Text
                          style={[styles.tdText, { color: theme.text, flex: 3 }]}
                          numberOfLines={1}
                        >
                          {d.nombre}
                        </Text>
                        <Text
                          style={[
                            styles.tdText,
                            { color: theme.muted, flex: 2, textAlign: 'center' },
                          ]}
                        >
                          {d.cantidad_asignada}
                        </Text>
                        <TextInput
                          style={[
                            styles.qtyInput,
                            { color: theme.text, borderColor: theme.border, flex: 2 },
                          ]}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={theme.muted}
                          value={d.cantidad_vendida}
                          onChangeText={(v) => updateDetalle(idx, 'cantidad_vendida', v)}
                        />
                        <TextInput
                          style={[
                            styles.qtyInput,
                            { color: theme.text, borderColor: theme.border, flex: 2 },
                          ]}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={theme.muted}
                          value={d.cantidad_devuelta}
                          onChangeText={(v) => updateDetalle(idx, 'cantidad_devuelta', v)}
                        />
                        <TextInput
                          style={[
                            styles.qtyInput,
                            { color: theme.text, borderColor: theme.border, flex: 2 },
                          ]}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={theme.muted}
                          value={d.merma_reportada}
                          onChangeText={(v) => updateDetalle(idx, 'merma_reportada', v)}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Resumen */}
              {asignacionSelected && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: theme.muted }]}>5. RESUMEN</Text>
                  <View
                    style={[
                      styles.resumen,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.resumenRow}>
                      <Text style={[styles.resumenLabel, { color: theme.muted }]}>
                        Dinero Esperado
                      </Text>
                      <Text style={[styles.resumenValue, { color: theme.text }]}>
                        {formatCurrency(dineroEsperado)}
                      </Text>
                    </View>
                    <View style={styles.resumenRow}>
                      <Text style={[styles.resumenLabel, { color: theme.muted }]}>
                        Dinero Entregado
                      </Text>
                      <Text style={[styles.resumenValue, { color: theme.text }]}>
                        {formatCurrency(dineroEntregadoNum)}
                      </Text>
                    </View>
                    <View style={[styles.resumenRow, styles.resumenDivider, { borderTopColor: theme.border }]}>
                      <Text style={[styles.resumenLabel, { color: theme.text, fontWeight: '700' }]}>
                        Diferencia
                      </Text>
                      <Text
                        style={[
                          styles.resumenValue,
                          {
                            color: diferencia < 0 ? Colors.error : diferencia === 0 ? Colors.success : Colors.warning,
                            fontWeight: '700',
                            fontSize: 16,
                          },
                        ]}
                      >
                        {formatCurrency(diferencia)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: saving ? Colors.primary + 'AA' : Colors.primary },
                ]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MaterialCommunityIcons
                    name="scale-balance"
                    size={18}
                    color="#fff"
                    style={styles.btnIcon}
                  />
                )}
                <Text style={styles.submitBtnText}>
                  {saving ? 'Guardando...' : 'Guardar Corte'}
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  dropdownTriggerText: { ...Typography.body },
  dropdown: {
    position: 'absolute',
    top: '105%',
    left: 0,
    right: 0,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    zIndex: 999,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  dropdownItemText: { ...Typography.bodySmall, fontWeight: '500' },
  dropdownItemMeta: { ...Typography.caption },
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
  textarea: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    minHeight: 72,
  },
  table: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    gap: 2,
  },
  tableHead: { paddingVertical: Spacing.xs },
  thText: { ...Typography.caption, fontWeight: '600' },
  tdText: { ...Typography.caption },
  qtyInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
    textAlign: 'center',
    ...Typography.caption,
    marginHorizontal: 2,
  },
  resumen: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumenLabel: { ...Typography.bodySmall },
  resumenValue: { ...Typography.bodySmall, fontWeight: '600' },
  resumenDivider: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
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
