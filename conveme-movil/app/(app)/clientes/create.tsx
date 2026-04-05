import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createCliente } from '@/src/services/cliente.service';
import { useClientesStore } from '@/src/store/clientesStore';
import { useUIStore } from '@/src/store/uiStore';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { validators } from '@/src/utils/validators';
import { parseApiError } from '@/src/utils/errors';

export default function CreateClienteScreen() {
  const router = useRouter();
  const { addCliente } = useClientesStore();
  const { showToast } = useUIStore();
  const [nombre_completo, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [errors, setErrors] = useState<{
    nombre_completo?: string;
    email?: string;
    telefono?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!nombre_completo.trim()) newErrors.nombre_completo = 'El nombre es requerido';
    if (email.trim()) {
      const emailErr = validators.email(email.trim());
      if (emailErr) newErrors.email = emailErr;
    }
    if (telefono.trim()) {
      const phoneErr = validators.phone(telefono.trim());
      if (phoneErr) newErrors.telefono = phoneErr;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const newCliente = await createCliente({
        nombre_completo: nombre_completo.trim(),
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
      });
      addCliente(newCliente);
      showToast('Cliente creado exitosamente', 'success');
      router.back();
    } catch (err) {
      Alert.alert('Error', parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Cancelar</Text>
          </Pressable>
          <Text style={styles.navTitle}>Nuevo Cliente</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card>
            <Input
              label="Nombre completo *"
              value={nombre_completo}
              onChangeText={setNombreCompleto}
              error={errors.nombre_completo}
              placeholder="Nombre completo del cliente"
              autoCapitalize="words"
            />
            <Input
              label="Email (opcional)"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Teléfono (opcional)"
              value={telefono}
              onChangeText={setTelefono}
              error={errors.telefono}
              placeholder="10 dígitos"
              keyboardType="phone-pad"
            />
            <Input
              label="Dirección (opcional)"
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Dirección de envío"
              multiline
              numberOfLines={2}
            />
            <Button
              title="Crear Cliente"
              onPress={handleCreate}
              loading={isLoading}
              fullWidth
              style={styles.submitBtn}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  kav: { flex: 1 },
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  backBtn: { marginRight: Spacing.md },
  backText: { ...Typography.body, color: Colors.primary },
  navTitle: { ...Typography.h3, color: Colors.text },
  scroll: { padding: Spacing.screenPadding, paddingTop: 0 },
  submitBtn: { marginTop: Spacing.md },
});
