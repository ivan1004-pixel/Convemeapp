import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  createVendedor, 
  updateVendedor, 
  getUsuariosParaSelect,
  getVendedores 
} from '../../../src/services/vendedor.service';
import { convemeApi } from '../../../src/api/convemeApi';
import { getMunicipios } from '../../../src/services/ubicacion.service';
import { getEscuelas } from '../../../src/services/escuela.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Toast, useToast } from '../../../src/components/Toast';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';

type Step = 1 | 2 | 3;

export default function VendedorCreateScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;
  const { toast, show: showToast, hide: hideToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [form, setForm] = useState({
    usuario_id: null as number | null,
    escuela_id: null as number | null,
    nombre_completo: '',
    email: '',
    telefono: '',
    instagram_handle: '',
    calle_y_numero: '',
    colonia: '',
    codigo_postal: '',
    municipio_id: null as number | null,
    facultad_o_campus: '',
    punto_entrega_habitual: '',
    estado_laboral: '',
    comision_fija_menudeo: '10.00',
    comision_fija_mayoreo: '5.00',
    meta_ventas_mensual: '0',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Modals & Data
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [escuelas, setEscuelas] = useState<any[]>([]);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMunModal, setShowMunModal] = useState(false);
  const [showEscModal, setShowEscModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    loadInitialData();
    if (isEditing) {
      loadVendedorData();
    }
  }, [isEditing]);

  const loadVendedorData = async () => {
    setLoadingData(true);
    try {
      // Hacemos una petición directa con todos los campos necesarios
      const query = `
        query GetFullVendedor($id: Int!) {
          vendedor(id_vendedor: $id) {
            id_vendedor
            usuario_id
            escuela_id
            nombre_completo
            email
            telefono
            instagram_handle
            calle_y_numero
            colonia
            codigo_postal
            municipio_id
            facultad_o_campus
            punto_entrega_habitual
            estado_laboral
            comision_fija_menudeo
            comision_fija_mayoreo
            meta_ventas_mensual
          }
        }
      `;
      
      const { data } = await convemeApi.post('', { 
        query, 
        variables: { id: Number(params.id) } 
      });

      if (data.errors) throw new Error(data.errors[0].message);
      
      const v = data.data.vendedor;
      if (v) {
        setForm({
          usuario_id: v.usuario_id,
          escuela_id: v.escuela_id,
          nombre_completo: v.nombre_completo || '',
          email: v.email || '',
          telefono: v.telefono || '',
          instagram_handle: v.instagram_handle || '',
          calle_y_numero: v.calle_y_numero || '',
          colonia: v.colonia || '',
          codigo_postal: v.codigo_postal || '',
          municipio_id: v.municipio_id,
          facultad_o_campus: v.facultad_o_campus || '',
          punto_entrega_habitual: v.punto_entrega_habitual || '',
          estado_laboral: v.estado_laboral || '',
          comision_fija_menudeo: String(v.comision_fija_menudeo ?? '10.00'),
          comision_fija_mayoreo: String(v.comision_fija_mayoreo ?? '5.00'),
          meta_ventas_mensual: String(v.meta_ventas_mensual ?? '0'),
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Error al cargar datos completos del vendedor', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const [u, m, e] = await Promise.all([
        getUsuariosParaSelect(),
        getMunicipios(),
        getEscuelas()
      ]);
      setUsuarios(u);
      setMunicipios(m);
      setEscuelas(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.usuario_id) newErrors.usuario_id = 'Requerido';
      if (!form.nombre_completo.trim()) newErrors.nombre_completo = 'Requerido';
      if (!form.email.trim()) newErrors.email = 'Requerido';
    } else if (step === 3) {
      if (!form.comision_fija_menudeo) newErrors.comision_fija_menudeo = 'Requerido';
      if (!form.comision_fija_mayoreo) newErrors.comision_fija_mayoreo = 'Requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) setCurrentStep((currentStep + 1) as Step);
      else handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const input: any = {
        usuario_id: Number(form.usuario_id),
        nombre_completo: form.nombre_completo.trim(),
        email: form.email.trim(),
      };

      if (form.escuela_id) input.escuela_id = Number(form.escuela_id);
      if (form.municipio_id) input.municipio_id = Number(form.municipio_id);
      if (form.telefono?.trim()) input.telefono = form.telefono.trim();
      if (form.instagram_handle?.trim()) input.instagram_handle = form.instagram_handle.trim();
      if (form.calle_y_numero?.trim()) input.calle_y_numero = form.calle_y_numero.trim();
      if (form.colonia?.trim()) input.colonia = form.colonia.trim();
      if (form.codigo_postal?.trim()) input.codigo_postal = form.codigo_postal.trim();
      if (form.facultad_o_campus?.trim()) input.facultad_o_campus = form.facultad_o_campus.trim();
      if (form.punto_entrega_habitual?.trim()) input.punto_entrega_habitual = form.punto_entrega_habitual.trim();
      if (form.estado_laboral?.trim()) input.estado_laboral = form.estado_laboral.trim();

      if (isEditing) {
        // En edición SÍ se permiten comisiones y metas
        input.id_vendedor = Number(params.id);
        input.comision_fija_menudeo = parseFloat(form.comision_fija_menudeo);
        input.comision_fija_mayoreo = parseFloat(form.comision_fija_mayoreo);
        input.meta_ventas_mensual = parseFloat(form.meta_ventas_mensual);
        await updateVendedor(input);
        showToast('Vendedor actualizado', 'success');
      } else {
        // En creación NO se permiten comisiones ni metas (el backend les pone DEFAULT)
        await createVendedor(input);
        showToast('Vendedor creado', 'success');
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <View style={[
            styles.stepCircle, 
            currentStep >= s ? styles.stepActive : styles.stepInactive
          ]}>
            <Text style={[styles.stepText, currentStep >= s && styles.stepTextActive]}>{s}</Text>
          </View>
          {s < 3 && <View style={[styles.stepLine, currentStep > s && styles.lineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  const selectedUser = usuarios.find(u => u.id_usuario === form.usuario_id);
  const selectedMun = municipios.find(m => m.id_municipio === form.municipio_id);
  const selectedEsc = escuelas.find(e => e.id_escuela === form.escuela_id);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <Text style={styles.title}>{isEditing ? 'Editar Vendedor' : 'Nuevo Vendedor'}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {renderStepIndicator()}

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {currentStep === 1 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Cuenta y Perfil</Text>
              
              <View style={styles.selectorContainer}>
                <Text style={styles.selectorLabel}>Vincular Usuario *</Text>
                <Pressable onPress={() => setShowUserModal(true)} style={[styles.selectorButton, errors.usuario_id && styles.selectorError]}>
                  <MaterialCommunityIcons name="account-search" size={20} color={Colors.primary} />
                  <Text style={[styles.selectorValue, !selectedUser && styles.selectorPlaceholder]}>
                    {selectedUser ? selectedUser.username : 'Buscar usuario...'}
                  </Text>
                </Pressable>
              </View>

              <Input label="Nombre completo *" value={form.nombre_completo} onChangeText={v => setField('nombre_completo', v)} error={errors.nombre_completo} />
              <Input label="Email *" value={form.email} onChangeText={v => setField('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
              <Input label="Teléfono" value={form.telefono} onChangeText={v => setField('telefono', v)} keyboardType="phone-pad" maxLength={10} />
              <Input label="Instagram" value={form.instagram_handle} onChangeText={v => setField('instagram_handle', v)} placeholder="sin @" autoCapitalize="none" />
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Académico y Ubicación</Text>
              
              <View style={styles.selectorContainer}>
                <Text style={styles.selectorLabel}>Escuela</Text>
                <Pressable onPress={() => setShowEscModal(true)} style={styles.selectorButton}>
                  <MaterialCommunityIcons name="school-outline" size={20} color={Colors.primary} />
                  <Text style={[styles.selectorValue, !selectedEsc && styles.selectorPlaceholder]}>
                    {selectedEsc ? selectedEsc.nombre : 'Seleccionar escuela...'}
                  </Text>
                </Pressable>
              </View>

              <Input label="Facultad / Campus" value={form.facultad_o_campus} onChangeText={v => setField('facultad_o_campus', v)} />
              <Input label="Punto de entrega habitual" value={form.punto_entrega_habitual} onChangeText={v => setField('punto_entrega_habitual', v)} />
              
              <View style={styles.selectorContainer}>
                <Text style={styles.selectorLabel}>Municipio</Text>
                <Pressable onPress={() => setShowMunModal(true)} style={styles.selectorButton}>
                  <MaterialCommunityIcons name="map-marker-outline" size={20} color={Colors.primary} />
                  <Text style={[styles.selectorValue, !selectedMun && styles.selectorPlaceholder]}>
                    {selectedMun ? selectedMun.nombre : 'Seleccionar municipio...'}
                  </Text>
                </Pressable>
              </View>

              <Input label="Calle y Número" value={form.calle_y_numero} onChangeText={v => setField('calle_y_numero', v)} />
              <Input label="Colonia" value={form.colonia} onChangeText={v => setField('colonia', v)} />
              <Input label="Código Postal" value={form.codigo_postal} onChangeText={v => setField('codigo_postal', v)} keyboardType="numeric" />
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Comisiones y Metas</Text>
              <Input label="Estado laboral" value={form.estado_laboral} onChangeText={v => setField('estado_laboral', v)} placeholder="Ej. Activo, En pausa" />
              <Input label="Comisión Menudeo (%)" value={form.comision_fija_menudeo} onChangeText={v => setField('comision_fija_menudeo', v)} keyboardType="decimal-pad" error={errors.comision_fija_menudeo} />
              <Input label="Comisión Mayoreo (%)" value={form.comision_fija_mayoreo} onChangeText={v => setField('comision_fija_mayoreo', v)} keyboardType="decimal-pad" error={errors.comision_fija_mayoreo} />
              <Input label="Meta Ventas Mensual ($)" value={form.meta_ventas_mensual} onChangeText={v => setField('meta_ventas_mensual', v)} keyboardType="numeric" />
            </View>
          )}

          <View style={styles.buttonRow}>
            {currentStep > 1 && (
              <Button title="ANTERIOR" onPress={() => setCurrentStep((currentStep - 1) as Step)} variant="outline" style={styles.flexBtn} />
            )}
            <Button 
              title={currentStep === 3 ? (isEditing ? 'GUARDAR' : 'CREAR') : 'SIGUIENTE'} 
              onPress={handleNext} 
              loading={submitting}
              style={styles.flexBtn} 
            />
          </View>
        </ScrollView>

        {/* Modal Usuario */}
        <Modal visible={showUserModal} animationType="slide">
          <SafeAreaView style={styles.modalBg}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vincular Usuario</Text>
              <Pressable onPress={() => setShowUserModal(false)}><MaterialCommunityIcons name="close" size={28} color={Colors.error} /></Pressable>
            </View>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar por username..." style={styles.modalSearch} />
            <FlatList
              data={usuarios.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))}
              renderItem={({item}) => (
                <Pressable style={styles.modalItem} onPress={() => { setField('usuario_id', item.id_usuario); setShowUserModal(false); }}>
                  <Text style={styles.itemTitle}>{item.username}</Text>
                  {form.usuario_id === item.id_usuario && <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />}
                </Pressable>
              )}
              contentContainerStyle={styles.modalList}
            />
          </SafeAreaView>
        </Modal>

        {/* Modal Escuela */}
        <Modal visible={showEscModal} animationType="slide">
          <SafeAreaView style={styles.modalBg}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Escuela</Text>
              <Pressable onPress={() => setShowEscModal(false)}><MaterialCommunityIcons name="close" size={28} color={Colors.error} /></Pressable>
            </View>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar escuela..." style={styles.modalSearch} />
            <FlatList
              data={escuelas.filter(e => e.nombre.toLowerCase().includes(searchQuery.toLowerCase()))}
              renderItem={({item}) => (
                <Pressable style={styles.modalItem} onPress={() => { setField('escuela_id', item.id_escuela); setShowEscModal(false); }}>
                  <Text style={styles.itemTitle}>{item.nombre}</Text>
                  {form.escuela_id === item.id_escuela && <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />}
                </Pressable>
              )}
              contentContainerStyle={styles.modalList}
            />
          </SafeAreaView>
        </Modal>

        {/* Modal Municipio */}
        <Modal visible={showMunModal} animationType="slide">
          <SafeAreaView style={styles.modalBg}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Municipio</Text>
              <Pressable onPress={() => setShowMunModal(false)}><MaterialCommunityIcons name="close" size={28} color={Colors.error} /></Pressable>
            </View>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar municipio..." style={styles.modalSearch} />
            <FlatList
              data={municipios.filter(m => m.nombre.toLowerCase().includes(searchQuery.toLowerCase()))}
              renderItem={({item}) => (
                <Pressable style={styles.modalItem} onPress={() => { setField('municipio_id', item.id_municipio); setShowMunModal(false); }}>
                  <View>
                    <Text style={styles.itemTitle}>{item.nombre}</Text>
                    <Text style={styles.itemSub}>{item.estado?.nombre}</Text>
                  </View>
                  {form.municipio_id === item.id_municipio && <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />}
                </Pressable>
              )}
              contentContainerStyle={styles.modalList}
            />
          </SafeAreaView>
        </Modal>

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { padding: Spacing.xs },
  title: { ...Typography.h3, fontWeight: '900' },
  headerPlaceholder: { width: 34 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.xs },
  stepCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stepActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepInactive: { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.1)' },
  stepText: { fontSize: 14, fontWeight: '900', color: 'rgba(0,0,0,0.2)' },
  stepTextActive: { color: '#FFF' },
  stepLine: { width: 40, height: 2, backgroundColor: 'rgba(0,0,0,0.1)' },
  lineActive: { backgroundColor: Colors.primary },
  scrollContent: { padding: Spacing.lg, paddingBottom: 160 },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.lg, 
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    elevation: 3, 
    marginBottom: Spacing.lg 
  },
  sectionTitle: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: Colors.primary, 
    marginBottom: Spacing.lg, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5 
  },
  selectorContainer: { marginBottom: Spacing.md },
  selectorLabel: { 
    fontSize: 11, 
    marginBottom: Spacing.xs, 
    fontWeight: '800', 
    color: 'rgba(0,0,0,0.4)',
    textTransform: 'uppercase'
  },
  selectorButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    borderRadius: BorderRadius.lg, 
    padding: Spacing.md, 
    borderWidth: 2, 
    borderColor: Colors.dark, 
    gap: Spacing.sm 
  },
  selectorValue: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.dark },
  selectorPlaceholder: { color: 'rgba(0,0,0,0.3)' },
  selectorError: { borderColor: Colors.error },
  buttonRow: { flexDirection: 'row', gap: Spacing.md },
  flexBtn: { 
    flex: 1,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5
  },
  modalBg: { flex: 1, backgroundColor: Colors.beige },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark,
    backgroundColor: '#FFF'
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.dark },
  modalSearch: { marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.md },
  modalList: { paddingHorizontal: Spacing.lg },
  modalItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#FFF', 
    padding: Spacing.lg, 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.1,
    elevation: 2
  },
  itemTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark },
  itemSub: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' }
});
