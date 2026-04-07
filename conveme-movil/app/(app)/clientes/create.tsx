import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createCliente, updateCliente } from '../../../src/services/cliente.service';
import { useClienteStore } from '../../../src/store/clienteStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Toast, useToast } from '../../../src/components/Toast';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { parseGraphQLError } from '../../../src/utils';
import type { Cliente } from '../../../src/types';

export default function ClienteCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { clientes, addCliente, updateCliente: updateClienteStore } = useClienteStore();

  const isEditing = !!id;
  const existing: Cliente | undefined = isEditing
    ? clientes.find((c) => c.id_cliente === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre_completo: existing?.nombre_completo ?? '',
    email: existing?.email ?? '',
    telefono: existing?.telefono ?? '',
    direccion_envio: existing?.direccion_envio ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre_completo.trim()) {
      newErrors.nombre_completo = 'REQUERIDO';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'EMAIL INVÁLIDO';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('COMPLETA LOS CAMPOS REQUERIDOS', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const input: any = {
        nombre_completo: form.nombre_completo.trim(),
      };
      if (form.email?.trim()) input.email = form.email.trim();
      if (form.telefono?.trim()) input.telefono = form.telefono.trim();
      if (form.direccion_envio?.trim()) input.direccion_envio = form.direccion_envio.trim();

      if (isEditing && existing) {
        const updated = await updateCliente({ id_cliente: existing.id_cliente, ...input });
        updateClienteStore({ ...existing, ...updated });
        showToast('CLIENTE ACTUALIZADO', 'success');
      } else {
        const created = await createCliente(input);
        addCliente(created);
        showToast('CLIENTE REGISTRADO', 'success');
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>INFORMACIÓN DEL CLIENTE</Text>
            
            <Input
              label="NOMBRE COMPLETO *"
              value={form.nombre_completo}
              onChangeText={(v) => setField('nombre_completo', v)}
              placeholder="EJ. MARÍA GARCÍA"
              error={errors.nombre_completo}
              autoCapitalize="words"
              leftIcon={<MaterialCommunityIcons name="account-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="CORREO ELECTRÓNICO"
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              placeholder="CORREO@EJEMPLO.COM"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<MaterialCommunityIcons name="email-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="TELÉFONO DE CONTACTO"
              value={form.telefono}
              onChangeText={(v) => setField('telefono', v)}
              placeholder="10 DÍGITOS"
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<MaterialCommunityIcons name="phone-outline" size={20} color={Colors.primary} />}
            />

            <Input
              label="DIRECCIÓN DE ENVÍO"
              value={form.direccion_envio}
              onChangeText={(v) => setField('direccion_envio', v)}
              placeholder="CALLE, NÚMERO, COLONIA..."
              leftIcon={<MaterialCommunityIcons name="map-marker-outline" size={20} color={Colors.primary} />}
              multiline
            />
          </View>

          <Button
            title={isEditing ? 'GUARDAR CAMBIOS' : 'REGISTRAR CLIENTE'}
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            style={styles.submitBtn}
          />

          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text style={styles.cancelBtnText}>CANCELAR Y VOLVER</Text>
          </TouchableOpacity>
        </ScrollView>

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.h4, fontWeight: '900', color: Colors.dark },
  headerPlaceholder: { width: 40 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
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
  statusBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: BorderRadius.lg, borderWidth: 2, gap: 12 },
  activeBox: { borderColor: Colors.success, backgroundColor: Colors.success + '05' },
  inactiveBox: { borderColor: Colors.error, backgroundColor: Colors.error + '05' },
  statusTitle: { fontSize: 14, fontWeight: '900' },
  statusDesc: { fontSize: 10, fontWeight: '700', color: 'rgba(0,0,0,0.4)', marginTop: 2 },
  miniSwitch: { width: 40, height: 20, borderRadius: 20, padding: 2, justifyContent: 'center' },
  switchKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF' },
  submitBtn: {
    marginTop: Spacing.sm,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5,
  },
  cancelBtn: { marginTop: Spacing.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelBtnText: { fontSize: 12, fontWeight: '900', color: 'rgba(0,0,0,0.4)', textDecorationLine: 'underline' },
});


