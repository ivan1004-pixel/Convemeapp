import React, { useState, useEffect, useCallback, memo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createCorte, updateCorte, deleteCorte } from '../../../src/services/corte.service';
import { createComprobante } from '../../../src/services/comprobante.service';
import { getVendedores } from '../../../src/services/vendedor.service';
import { getAsignaciones, updateAsignacion } from '../../../src/services/asignacion.service';
import { loginService } from '../../../src/services/auth.service';
import { useCorteStore } from '../../../src/store/corteStore';
import { useAuth } from '../../../src/hooks/useAuth';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { parseGraphQLError, formatCurrency, formatDate } from '../../../src/utils';
import { CorteTicket } from '../../../src/components/ui/CorteTicket';
import type { Corte, Vendedor, Asignacion } from '../../../src/types';

const COMISION_POR_UNIDAD = 6.5;

const formatDiff = (amount: number) => {
    const formatted = formatCurrency(amount);
    if (amount > 0.01) return `+ ${formatted}`;
    return formatted;
};

export default function CorteCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { cortes, addCorte, updateCorte: updateCorteStore, removeCorte } = useCorteStore();
  const { usuario, isAdmin } = useAuth();

  const isEditing = !!id;
  const existing = cortes.find((c) => c.id_corte === Number(id));

  // Bloquear edición para no-admins
  useEffect(() => {
    if (isEditing && !isAdmin) {
      showToast('No tienes permisos para editar cortes', 'error');
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
    vendedor_id: null as number | null,
    asignacion_id: null as number | null,
    dinero_total_entregado: '',
    observaciones: '',
    detalles: [] as { 
        id_det_corte?: number,
        producto_id: number, 
        cantidad_vendida: number, 
        cantidad_devuelta: number, 
        merma_reportada: number, 
        cantidad_asignada: number, 
        nombre?: string, 
        precio?: number 
    }[],
  });

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [showVendedorModal, setShowVendedorModal] = useState(false);
  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isSavingComprobante, setIsSavingComprobante] = useState(false);
  const [lastCreatedCorte, setLastCreatedCorte] = useState<Corte | null>(null);
  const [adminPass, setAdminPass] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveComprobante = async () => {
    if (!lastCreatedCorte) return;
    setIsSavingComprobante(true);
    try {
        const bruteTotal = lastCreatedCorte.detalles?.reduce((acc, d) => acc + (d.cantidad_vendida * (d.producto?.precio_unitario || 0)), 0) || 0;
        const totalUnits = lastCreatedCorte.detalles?.reduce((acc, d) => acc + d.cantidad_vendida, 0) || 0;
        const comision = totalUnits * COMISION_POR_UNIDAD;

        await createComprobante({
            vendedor_id: Number(lastCreatedCorte.vendedor?.id_vendedor),
            admin_id: Number(usuario?.id_usuario),
            total_vendido: bruteTotal,
            comision_vendedor: comision,
            monto_entregado: lastCreatedCorte.dinero_total_entregado,
            saldo_pendiente: Math.abs(lastCreatedCorte.diferencia_corte || 0),
            notas: lastCreatedCorte.observaciones
        });
        showToast('Comprobante guardado con éxito', 'success');
        setShowTicketModal(false);
        router.back();
    } catch (err) {
        showToast('Error al guardar comprobante', 'error');
    } finally {
        setIsSavingComprobante(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isEditing && existing) {
      setForm({
        vendedor_id: existing.vendedor?.id_vendedor ?? null,
        asignacion_id: existing.asignacion?.id_asignacion ?? null,
        dinero_total_entregado: String(existing.dinero_total_entregado || ''),
        observaciones: existing.observaciones || '',
        detalles: existing.detalles?.map(d => ({
            id_det_corte: d.id_det_corte,
            producto_id: d.producto?.id_producto || 0,
            cantidad_vendida: d.cantidad_vendida,
            cantidad_devuelta: d.cantidad_devuelta || 0,
            merma_reportada: d.merma_reportada || 0,
            cantidad_asignada: d.cantidad_vendida + (d.cantidad_devuelta || 0) + (d.merma_reportada || 0),
            nombre: d.producto?.nombre,
            precio: d.producto?.precio_unitario
        })) || [],
      });
    }
  }, [id, existing]);

  const loadInitialData = async () => {
    try {
      const [v, a] = await Promise.all([getVendedores(), getAsignaciones()]);
      setVendedores(v || []);
      setAsignaciones(a || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const selectVendedor = (v: Vendedor) => {
    setForm(prev => ({ ...prev, vendedor_id: v.id_vendedor, asignacion_id: null, detalles: [] }));
    setShowVendedorModal(false);
  };

  const selectAsignacion = (a: Asignacion) => {
    setForm(prev => ({
        ...prev,
        asignacion_id: a.id_asignacion,
        detalles: a.detalles?.map(d => ({
            producto_id: d.producto?.id_producto || 0,
            cantidad_asignada: d.cantidad_asignada,
            cantidad_vendida: d.cantidad_asignada, 
            cantidad_devuelta: 0,
            merma_reportada: 0,
            nombre: d.producto?.nombre,
            precio: d.producto?.precio_unitario
        })) || []
    }));
    setShowAsignacionModal(false);
  };

  const updateDetalle = (index: number, field: string, val: string) => {
    const num = parseInt(val) || 0;
    const newDetalles = [...form.detalles];
    (newDetalles[index] as any)[field] = num;
    setForm(prev => ({ ...prev, detalles: newDetalles }));
  };

  const totalVendidos = form.detalles.reduce((acc, d) => acc + d.cantidad_vendida, 0);
  const ventaBruta = form.detalles.reduce((acc, d) => acc + (d.cantidad_vendida * (d.precio || 0)), 0);
  const comisionVendedor = totalVendidos * COMISION_POR_UNIDAD;
  const dineroEsperado = ventaBruta - comisionVendedor;
  const entregado = parseFloat(form.dinero_total_entregado) || 0;
  const diferencia = entregado - dineroEsperado;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.vendedor_id) newErrors.vendedor_id = 'REQUERIDO';
    if (!form.asignacion_id) newErrors.asignacion_id = 'REQUERIDO';
    if (!form.dinero_total_entregado) newErrors.entregado = 'REQUERIDO';

    const inventoryError = form.detalles.some(d => (d.cantidad_vendida + d.cantidad_devuelta + d.merma_reportada) !== d.cantidad_asignada);
    if (inventoryError) {
        showToast('El inventario reportado no coincide con lo asignado', 'error');
        return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeSubmit = async () => {
    setSubmitting(true);
    try {
      const input = {
        vendedor_id: form.vendedor_id,
        asignacion_id: form.asignacion_id,
        dinero_total_entregado: entregado,
        dinero_esperado: dineroEsperado,
        diferencia_corte: diferencia,
        observaciones: form.observaciones,
        detalles: form.detalles.map(d => ({
            id_det_corte: d.id_det_corte,
            corte_id: isEditing ? existing?.id_corte : undefined,
            producto_id: d.producto_id,
            cantidad_vendida: d.cantidad_vendida,
            cantidad_devuelta: d.cantidad_devuelta,
            merma_reportada: d.merma_reportada
        }))
      };

      if (isEditing && existing) {
        await updateCorte({ id_corte: existing.id_corte, ...input });
        showToast('Corte actualizado', 'success');
        setTimeout(() => router.back(), 1500);
      } else {
        const created = await createCorte(input);
        if (form.asignacion_id) {
            await updateAsignacion({ id_asignacion: form.asignacion_id, estado: 'Finalizado' });
        }
        
        const corteParaTicket = {
            ...created,
            id_corte: created.id_corte,
            fecha_corte: new Date().toISOString(),
            dinero_esperado: dineroEsperado,
            dinero_total_entregado: entregado,
            diferencia_corte: diferencia,
            vendedor: vendedores.find(v => v.id_vendedor === form.vendedor_id),
            asignacion: { id_asignacion: form.asignacion_id },
            detalles: form.detalles.map(d => ({
                cantidad_vendida: d.cantidad_vendida,
                cantidad_devuelta: d.cantidad_devuelta,
                merma_reportada: d.merma_reportada,
                producto: { nombre: d.nombre, precio_unitario: d.precio }
            }))
        };

        setLastCreatedCorte(corteParaTicket as any);
        showToast('Corte finalizado correctamente', 'success');
        setShowTicketModal(true);
      }
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (Math.abs(diferencia) > 0.01) {
        setShowAuthModal(true);
    } else {
        executeSubmit();
    }
  };

  const handleAuth = async () => {
    if (!adminPass.trim()) {
        showToast('Ingresa la contraseña', 'warning');
        return;
    }
    
    setIsAuthorizing(true);
    try {
        if (usuario?.username) {
            await loginService(usuario.username, adminPass);
            setShowAuthModal(false);
            setAdminPass('');
            executeSubmit();
        } else {
            showToast('Error de sesión', 'error');
        }
    } catch (err) {
        showToast('Contraseña incorrecta o sin permisos', 'error');
    } finally {
        setIsAuthorizing(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!isEditing || !existing) return;
    setDeleting(true);
    try {
        await deleteCorte(existing.id_corte);
        removeCorte(existing.id_corte);
        showToast('Corte eliminado', 'success');
        setTimeout(() => router.back(), 1500);
    } catch (err) {
        showToast(parseGraphQLError(err), 'error');
    } finally {
        setDeleting(false);
        setShowDeleteConfirm(false);
    }
  }, [isEditing, existing, removeCorte, showToast]);

  const selectedVendedor = vendedores.find(v => v.id_vendedor === form.vendedor_id);
  const selectedAsignacion = asignaciones.find(a => a.id_asignacion === form.asignacion_id);
  
  // FILTRAR VENDEDORES QUE TIENEN ASIGNACIONES ACTIVAS
  const vendedoresConAsignacion = vendedores.filter(v => 
    asignaciones.some(a => a.vendedor?.id_vendedor === v.id_vendedor && a.estado !== 'Finalizado')
  );

  const filteredVendedores = vendedoresConAsignacion.filter(v => v.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()));
  const availableAsignaciones = asignaciones.filter(a => a.vendedor?.id_vendedor === form.vendedor_id && a.estado !== 'Finalizado');

  const diffColor = diferencia > 0.01 ? Colors.success : diferencia < -0.01 ? Colors.error : Colors.dark;

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </Pressable>
            <Text style={styles.title}>{isEditing ? 'Editar Corte' : 'Realizar Corte'}</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Origen del Corte</Text>
              <TouchableOpacity
                style={[styles.selector, errors.vendedor_id && styles.selectorError, { marginBottom: Spacing.md }]}
                onPress={() => { setSearchQuery(''); setShowVendedorModal(true); }}
                disabled={isEditing || !isAdmin}
              >
                <MaterialCommunityIcons name="account-tie-outline" size={20} color={Colors.primary} />
                <Text style={[styles.selectorText, !selectedVendedor && styles.placeholderText]}>
                  {selectedVendedor ? selectedVendedor.nombre_completo.toUpperCase() : 'SELECCIONAR VENDEDOR'}
                </Text>
                {(!isEditing && isAdmin) && <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selector, errors.asignacion_id && styles.selectorError]}
                onPress={() => { setShowAsignacionModal(true); }}
                disabled={!form.vendedor_id || isEditing}
              >
                <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={Colors.primary} />
                <Text style={[styles.selectorText, !selectedAsignacion && styles.placeholderText]}>
                  {selectedAsignacion ? `ASIGNACIÓN #${selectedAsignacion.id_asignacion} (${formatDate(selectedAsignacion.fecha_asignacion)})` : 'SELECCIONAR ASIGNACIÓN'}
                </Text>
                {!isEditing && <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(0,0,0,0.3)" />}
              </TouchableOpacity>
            </View>

            {form.detalles.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Reporte de Inventario</Text>
                    {form.detalles.map((det, index) => {
                        const totalReportado = det.cantidad_vendida + det.cantidad_devuelta + det.merma_reportada;
                        const faltante = det.cantidad_asignada - totalReportado;
                        
                        return (
                            <View key={index} style={styles.productCard}>
                                <View style={styles.productHeader}>
                                    <Text style={styles.productName}>{det.nombre?.toUpperCase()}</Text>
                                    <Text style={styles.asignedBadge}>ENTREGADO: {det.cantidad_asignada}</Text>
                                </View>
                                
                                <View style={styles.productInputs}>
                                    <View style={styles.miniInputGroup}>
                                        <Text style={styles.miniLabel}>VENDIDO</Text>
                                        <Input
                                            value={String(det.cantidad_vendida)}
                                            onChangeText={(v) => updateDetalle(index, 'cantidad_vendida', v)}
                                            keyboardType="numeric"
                                            inputStyle={styles.miniInputStyle}
                                        />
                                    </View>
                                    <View style={styles.miniInputGroup}>
                                        <Text style={styles.miniLabel}>DEVUELTO</Text>
                                        <Input
                                            value={String(det.cantidad_devuelta)}
                                            onChangeText={(v) => updateDetalle(index, 'cantidad_devuelta', v)}
                                            keyboardType="numeric"
                                            inputStyle={styles.miniInputStyle}
                                        />
                                    </View>
                                    <View style={styles.miniInputGroup}>
                                        <Text style={styles.miniLabel}>MERMA</Text>
                                        <Input
                                            value={String(det.merma_reportada)}
                                            onChangeText={(v) => updateDetalle(index, 'merma_reportada', v)}
                                            keyboardType="numeric"
                                            inputStyle={styles.miniInputStyle}
                                        />
                                    </View>
                                </View>
                                {faltante !== 0 && (
                                    <Text style={styles.inventoryWarning}>
                                        {faltante > 0 ? `Faltan ${faltante} piezas por reportar` : `Sobran ${Math.abs(faltante)} piezas reportadas`}
                                    </Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Resumen de Cuentas</Text>
              
              <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Venta Bruta ({totalVendidos} unids):</Text>
                  <Text style={styles.calcValue}>{formatCurrency(ventaBruta)}</Text>
              </View>

              <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: Colors.success }]}>Comisión Vendedor ($6.5 c/u):</Text>
                  <Text style={[styles.calcValue, { color: Colors.success }]}>- {formatCurrency(comisionVendedor)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>NETO A RECIBIR:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(dineroEsperado)}</Text>
              </View>

              <Input
                label="DINERO ENTREGADO POR VENDEDOR *"
                value={form.dinero_total_entregado}
                onChangeText={(v) => setField('dinero_total_entregado', v)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                leftIcon={<MaterialCommunityIcons name="cash-multiple" size={24} color={Colors.success} />}
                error={errors.entregado}
                inputStyle={{ fontSize: 22, fontWeight: '900', height: 60 }}
              />

              <View style={[styles.diffBox, { backgroundColor: diffColor + '15' }]}>
                  <Text style={styles.diffLabel}>DIFERENCIA (FALTANTE/SOBRANTE):</Text>
                  <Text style={[styles.diffValue, { color: diffColor }]}>
                      {formatDiff(diferencia)}
                  </Text>
              </View>

              <Input
                label="OBSERVACIONES"
                value={form.observaciones}
                onChangeText={(v) => setField('observaciones', v)}
                placeholder="Ej: El vendedor se llevó su comisión en efectivo..."
                multiline
                numberOfLines={2}
              />
            </View>

            <Button
              title={isEditing ? 'ACTUALIZAR CORTE' : 'FINALIZAR Y CERRAR CUENTA'}
              onPress={handleSubmit}
              loading={submitting}
              size="lg"
              variant={Math.abs(diferencia) < 0.01 ? 'primary' : 'secondary'}
              style={styles.submitBtn}
            />

            {isEditing && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteConfirm(true)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                    <Text style={styles.deleteBtnText}>ELIMINAR CORTE</Text>
                </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Modal Ticket Corte */}
        <Modal visible={showTicketModal} transparent animationType="fade">
            <View style={styles.ticketOverlay}>
                <View style={styles.ticketModalContainer}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
                        {lastCreatedCorte && <CorteTicket corte={lastCreatedCorte} />}
                    </ScrollView>
                    <View style={{ gap: 10 }}>
                        <Button 
                            title="GUARDAR COMPROBANTE" 
                            onPress={handleSaveComprobante} 
                            loading={isSavingComprobante}
                            variant="primary"
                        />
                        <TouchableOpacity 
                            onPress={() => { setShowTicketModal(false); router.back(); }} 
                            style={{ alignItems: 'center', padding: 10 }}
                        >
                            <Text style={{ fontWeight: '900', color: '#FFF', fontSize: 12 }}>CERRAR SIN GUARDAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        {/* Modal Autorización */}
        <Modal visible={showAuthModal} animationType="fade" transparent>
            <View style={styles.modalOverlayCenter}>
                <View style={styles.authCard}>
                    <MaterialCommunityIcons name="shield-lock" size={48} color={diferencia < 0 ? Colors.error : Colors.success} />
                    <Text style={[styles.authTitle, { color: diferencia < 0 ? Colors.error : Colors.success }]}>
                        {diferencia < 0 ? 'FALTANTE DETECTADO' : 'SOBRANTE DETECTADO'}
                    </Text>
                    <Text style={styles.authDesc}>Existe una diferencia de <Text style={{fontWeight: '900'}}>{formatDiff(diferencia)}</Text>. Ingresa tu contraseña para autorizar el cierre.</Text>
                    
                    <Input
                        label="TU CONTRASEÑA"
                        value={adminPass}
                        onChangeText={setAdminPass}
                        secureTextEntry
                        placeholder="••••••••"
                        containerStyle={{ width: '100%', marginTop: 10 }}
                    />

                    <View style={styles.authActions}>
                        <TouchableOpacity style={styles.authCancel} onPress={() => { setShowAuthModal(false); setAdminPass(''); }} disabled={isAuthorizing}>
                            <Text style={styles.authCancelText}>CANCELAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.authConfirm} onPress={handleAuth} disabled={isAuthorizing}>
                            {isAuthorizing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authConfirmText}>AUTORIZAR</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        <Modal visible={showVendedorModal} animationType="slide" transparent>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalListContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>VENDEDORES CON ASIGNACIÓN</Text>
                <TouchableOpacity onPress={() => setShowVendedorModal(false)}><MaterialCommunityIcons name="close-thick" size={28} color={Colors.dark} /></TouchableOpacity>
              </View>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="BUSCAR..." />
              <FlatList
                data={filteredVendedores}
                keyExtractor={(item) => `v-${item.id_vendedor}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalListItem} onPress={() => selectVendedor(item)}>
                    <MaterialCommunityIcons name="account-tie" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                    <Text style={styles.modalListItemText}>{item.nombre_completo.toUpperCase()}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay vendedores con asignaciones pendientes</Text>}
              />
            </View>
          </SafeAreaView>
        </Modal>

        <Modal visible={showAsignacionModal} animationType="slide" transparent>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalListContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>ASIGNACIONES PENDIENTES</Text>
                <TouchableOpacity onPress={() => setShowAsignacionModal(false)}><MaterialCommunityIcons name="close-thick" size={28} color={Colors.dark} /></TouchableOpacity>
              </View>
              <FlatList
                data={availableAsignaciones}
                keyExtractor={(item) => `a-${item.id_asignacion}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalListItem} onPress={() => selectAsignacion(item)}>
                    <MaterialCommunityIcons name="clipboard-list" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                    <View>
                        <Text style={styles.modalListItemText}>ASIGNACIÓN #{item.id_asignacion}</Text>
                        <Text style={styles.modalListItemSub}>Fecha: {formatDate(item.fecha_asignacion)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay asignaciones pendientes para este vendedor</Text>}
              />
            </View>
          </SafeAreaView>
        </Modal>

        <ConfirmDialog
            visible={showDeleteConfirm}
            title="Eliminar Corte"
            message="¿Deseas eliminar este corte? Esta acción no se puede deshacer."
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
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 160 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionTitle: { ...Typography.bodySmall, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
  selector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: '#FFFFFF', gap: Spacing.sm },
  selectorError: { borderColor: Colors.error },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  placeholderText: { color: 'rgba(0,0,0,0.3)' },
  productCard: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingVertical: 15 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  productName: { fontSize: 13, fontWeight: '900', color: '#1A1A1A', flex: 1 },
  asignedBadge: { fontSize: 10, fontWeight: '800', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, color: '#6B7280' },
  productInputs: { flexDirection: 'row', gap: 8 },
  miniInputGroup: { flex: 1 },
  miniLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2, textAlign: 'center' },
  miniInputStyle: { textAlign: 'center', height: 40, fontSize: 14, fontWeight: '700' },
  inventoryWarning: { fontSize: 10, color: Colors.error, fontWeight: '800', marginTop: 8, textAlign: 'right' },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calcLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.5)' },
  calcValue: { fontSize: 12, fontWeight: '800', color: '#1A1A1A' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg, paddingHorizontal: 4 },
  summaryLabel: { fontSize: 14, fontWeight: '900', color: 'rgba(0,0,0,0.6)' },
  summaryValue: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  diffBox: { padding: Spacing.md, borderRadius: BorderRadius.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  diffLabel: { fontSize: 11, fontWeight: '900' },
  diffValue: { fontSize: 18, fontWeight: '900' },
  submitBtn: { marginTop: Spacing.sm, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,0,0,0.1)' },
  deleteBtnText: { color: Colors.error, fontWeight: '900', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalListContent: { backgroundColor: Colors.beige, width: '100%', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, height: '80%', position: 'absolute', bottom: 0, borderTopWidth: 4, borderColor: Colors.dark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalListItemText: { fontSize: 16, fontWeight: '800' },
  modalListItemSub: { fontSize: 12, fontWeight: '600', color: 'rgba(26,26,26,0.4)' },
  emptyText: { textAlign: 'center', color: 'rgba(0,0,0,0.3)', paddingVertical: 40, fontWeight: '700' },
  authCard: { backgroundColor: Colors.beige, width: '100%', borderRadius: BorderRadius.xxl, padding: Spacing.xl, alignItems: 'center', borderWidth: 4, borderColor: Colors.dark, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 1 },
  authTitle: { fontSize: 20, fontWeight: '900', color: Colors.error, marginTop: 10, textAlign: 'center' },
  authDesc: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginVertical: 15, lineHeight: 20 },
  authActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  authCancel: { flex: 1, padding: 15, alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: Colors.dark },
  authCancelText: { fontWeight: '900', color: '#4B5563' },
  authConfirm: { flex: 1, padding: 15, alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: Colors.error, borderWidth: 2, borderColor: Colors.dark },
  authConfirmText: { fontWeight: '900', color: '#FFFFFF' },
  ticketOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  ticketModalContainer: { width: '100%', maxHeight: '90%' }
});
