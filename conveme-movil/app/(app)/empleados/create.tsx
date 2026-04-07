import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createEmpleado, updateEmpleado } from '../../../src/services/empleado.service';
import { getMunicipios } from '../../../src/services/ubicacion.service';
import { getUsuarios } from '../../../src/services/user.service';
import { useEmpleadoStore } from '../../../src/store/empleadoStore';
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
import type { Empleado } from '../../../src/types';
import { Modal, FlatList, ActivityIndicator } from 'react-native';

export default function EmpleadoCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { toast, show: showToast, hide: hideToast } = useToast();
  const { empleados, addEmpleado, updateEmpleado: updateEmpleadoStore } = useEmpleadoStore();

  const isEditing = !!id;
  const existing: Empleado | undefined = isEditing
    ? empleados.find((e) => e.id_empleado === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre_completo: existing?.nombre_completo ?? '',
    email: existing?.email ?? '',
    telefono: existing?.telefono ?? '',
    puesto: existing?.puesto ?? '',
    calle_y_numero: existing?.calle_y_numero ?? '',
    colonia: existing?.colonia ?? '',
    codigo_postal: existing?.codigo_postal ?? '',
    municipio_id: existing?.municipio?.id_municipio ?? null,
    usuario_id: existing?.usuario?.id_usuario ?? null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Municipio Selection
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [showMunicipioModal, setShowMunicipioModal] = useState(false);
  const [searchMunicipio, setSearchMunicipio] = useState('');
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

  // Usuario Selection
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showUsuarioModal, setShowUsuarioModal] = useState(false);
  const [searchUsuario, setSearchUsuario] = useState('');
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  useEffect(() => {
    loadMunicipios();
    loadUsuarios();
  }, []);

  const loadMunicipios = async () => {
    setLoadingMunicipios(true);
    try {
      const data = await getMunicipios();
      setMunicipios(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMunicipios(false);
    }
  };

  const loadUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const data = await getUsuarios();
      // Si estamos creando, podríamos filtrar los usuarios que ya son empleados
      // Pero por ahora los mostramos todos y dejamos que el backend valide si es necesario
      setUsuarios(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const selectedMunicipio = municipios.find(m => m.id_municipio === form.municipio_id);
  const selectedUsuario = usuarios.find(u => u.id_usuario === form.usuario_id);

  const filteredMunicipios = searchMunicipio.trim()
    ? municipios.filter(m => 
        m.nombre.toLowerCase().includes(searchMunicipio.toLowerCase()) ||
        m.estado?.nombre.toLowerCase().includes(searchMunicipio.toLowerCase())
      )
    : municipios;

  const filteredUsuarios = searchUsuario.trim()
    ? usuarios.filter(u => 
        u.username.toLowerCase().includes(searchUsuario.toLowerCase()) ||
        u.rol?.nombre.toLowerCase().includes(searchUsuario.toLowerCase())
      )
    : usuarios;

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre es requerido';
    }
    if (!form.puesto.trim()) {
      newErrors.puesto = 'El puesto es requerido';
    }
    if (!form.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    if (!form.municipio_id) {
      newErrors.municipio_id = 'Selecciona un municipio';
    }
    if (!form.usuario_id) {
      newErrors.usuario_id = 'Selecciona un usuario';
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
        nombre_completo: form.nombre_completo.trim(),
        puesto: form.puesto.trim(),
        municipio_id: form.municipio_id ? Number(form.municipio_id) : null,
        email: form.email.trim(),
        usuario_id: Number(form.usuario_id),
      };
      
      if (form.telefono?.trim()) input.telefono = form.telefono.trim();
      if (form.calle_y_numero?.trim()) input.calle_y_numero = form.calle_y_numero.trim();
      if (form.colonia?.trim()) input.colonia = form.colonia.trim();
      if (form.codigo_postal?.trim()) input.codigo_postal = form.codigo_postal.trim();

      if (isEditing && existing) {
        const updated = await updateEmpleado({ id_empleado: Number(existing.id_empleado), ...input });
        // Recargar datos completos para el store (incluyendo relaciones)
        updateEmpleadoStore({ ...existing, ...updated, municipio: selectedMunicipio, usuario: selectedUsuario });
        showToast('Empleado actualizado con éxito', 'success');
      } else {
        const created = await createEmpleado(input);
        addEmpleado({ ...created, municipio: selectedMunicipio, usuario: selectedUsuario });
        showToast('Empleado creado con éxito', 'success');
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <Text style={styles.title}>
            {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vinculación de Cuenta</Text>
            
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Usuario de Sistema *</Text>
              <Pressable
                onPress={() => !isEditing && setShowUsuarioModal(true)}
                style={[
                  styles.selectorButton, 
                  errors.usuario_id && styles.selectorError,
                  isEditing && { opacity: 0.6, backgroundColor: 'rgba(0,0,0,0.05)' }
                ]}
              >
                <MaterialCommunityIcons name="account-circle-outline" size={20} color={Colors.primary} />
                <Text style={[styles.selectorValue, !selectedUsuario && styles.selectorPlaceholder]}>
                  {selectedUsuario ? `${selectedUsuario.username} (${selectedUsuario.rol?.nombre})` : 'Seleccionar usuario'}
                </Text>
                {!isEditing && <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(26,26,26,0.3)" />}
              </Pressable>
              {errors.usuario_id && <Text style={styles.errorText}>{errors.usuario_id}</Text>}
              {isEditing && <Text style={styles.helperText}>El usuario vinculado no se puede cambiar</Text>}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <Input
              label="Nombre completo *"
              value={form.nombre_completo}
              onChangeText={(v) => setField('nombre_completo', v)}
              placeholder="Ej. Juan Pérez"
              error={errors.nombre_completo}
              autoCapitalize="words"
              leftIcon={<MaterialCommunityIcons name="account-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="Puesto *"
              value={form.puesto}
              onChangeText={(v) => setField('puesto', v)}
              placeholder="Ej. Gerente de Ventas"
              error={errors.puesto}
              autoCapitalize="words"
              leftIcon={<MaterialCommunityIcons name="briefcase-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="Email *"
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              placeholder="correo@ejemplo.com"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<MaterialCommunityIcons name="email-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="Teléfono"
              value={form.telefono}
              onChangeText={(v) => setField('telefono', v)}
              placeholder="10 dígitos"
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<MaterialCommunityIcons name="phone-outline" size={20} color={Colors.primary} />}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ubicación</Text>

            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Municipio *</Text>
              <Pressable
                onPress={() => setShowMunicipioModal(true)}
                style={[styles.selectorButton, errors.municipio_id && styles.selectorError]}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={Colors.primary} />
                <Text style={[styles.selectorValue, !selectedMunicipio && styles.selectorPlaceholder]}>
                  {selectedMunicipio ? `${selectedMunicipio.nombre}, ${selectedMunicipio.estado?.nombre}` : 'Seleccionar municipio'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(26,26,26,0.3)" />
              </Pressable>
              {errors.municipio_id && <Text style={styles.errorText}>{errors.municipio_id}</Text>}
            </View>
            
            <Input
              label="Calle y número"
              value={form.calle_y_numero}
              onChangeText={(v) => setField('calle_y_numero', v)}
              placeholder="Ej. Calle 5 de Mayo #123"
              leftIcon={<MaterialCommunityIcons name="road-variant" size={20} color={Colors.primary} />}
            />

            <Input
              label="Colonia"
              value={form.colonia}
              onChangeText={(v) => setField('colonia', v)}
              placeholder="Ej. Centro"
              leftIcon={<MaterialCommunityIcons name="home-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="Código postal"
              value={form.codigo_postal}
              onChangeText={(v) => setField('codigo_postal', v)}
              placeholder="Ej. 50000"
              keyboardType="numeric"
              maxLength={5}
              leftIcon={<MaterialCommunityIcons name="mailbox-outline" size={20} color={Colors.primary} />}
            />
          </View>

          <Button
            title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR EMPLEADO'}
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            style={styles.submitBtn}
          />
        </ScrollView>

        {/* Usuario Modal */}
        <Modal visible={showUsuarioModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Usuario</Text>
              <Pressable onPress={() => setShowUsuarioModal(false)} style={styles.closeModalBtn}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.error} />
              </Pressable>
            </View>
            
            <SearchBar
              value={searchUsuario}
              onChangeText={setSearchUsuario}
              placeholder="Buscar por username o rol..."
              style={styles.modalSearch}
            />

            {loadingUsuarios ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={filteredUsuarios}
                keyExtractor={(item) => String(item.id_usuario)}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.municipioItem}
                    onPress={() => {
                      setField('usuario_id', item.id_usuario);
                      setShowUsuarioModal(false);
                    }}
                  >
                    <View>
                      <Text style={styles.municipioName}>{item.username}</Text>
                      <Text style={styles.municipioState}>{item.rol?.nombre || 'Sin rol'}</Text>
                    </View>
                    {form.usuario_id === item.id_usuario && (
                      <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
                    )}
                  </Pressable>
                )}
              />
            )}
          </SafeAreaView>
        </Modal>

        {/* Municipio Modal */}
        <Modal visible={showMunicipioModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Municipio</Text>
              <Pressable onPress={() => setShowMunicipioModal(false)} style={styles.closeModalBtn}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.error} />
              </Pressable>
            </View>
            
            <SearchBar
              value={searchMunicipio}
              onChangeText={setSearchMunicipio}
              placeholder="Buscar por nombre o estado..."
              style={styles.modalSearch}
            />

            {loadingMunicipios ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={filteredMunicipios}
                keyExtractor={(item) => String(item.id_municipio)}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.municipioItem}
                    onPress={() => {
                      setField('municipio_id', item.id_municipio);
                      setShowMunicipioModal(false);
                    }}
                  >
                    <View>
                      <Text style={styles.municipioName}>{item.nombre}</Text>
                      <Text style={styles.municipioState}>{item.estado?.nombre}</Text>
                    </View>
                    {form.municipio_id === item.id_municipio && (
                      <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
                    )}
                  </Pressable>
                )}
              />
            )}
          </SafeAreaView>
        </Modal>

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h3,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  headerPlaceholder: {
    width: 34,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 160,
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
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  selectorContainer: {
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    fontSize: 11,
    marginBottom: Spacing.xs,
    color: 'rgba(0,0,0,0.4)',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.dark,
    gap: Spacing.sm,
  },
  selectorError: {
    borderColor: Colors.error,
  },
  selectorValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  selectorPlaceholder: {
    color: 'rgba(0,0,0,0.3)',
  },
  helperText: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 4,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 10,
    color: Colors.error,
    marginTop: 4,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: Spacing.sm,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark,
    backgroundColor: '#FFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearch: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  modalList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  municipioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  municipioName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  municipioState: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

