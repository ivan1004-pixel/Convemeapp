import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createVenta } from '@/src/services/venta.service';
import { useVentasStore } from '@/src/store/ventasStore';
import { useUIStore } from '@/src/store/uiStore';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { parseApiError } from '@/src/utils/errors';

const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE'];

export default function CreateVentaScreen() {
  const router = useRouter();
  const { addVenta } = useVentasStore();
  const { showToast } = useUIStore();
  const [metodo_pago, setMetodoPago] = useState('EFECTIVO');
  const [notas, setNotas] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const newVenta = await createVenta({
        metodo_pago,
        notas: notas.trim() || undefined,
        detalles: [],
      });
      addVenta(newVenta);
      showToast('Venta creada exitosamente', 'success');
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
          <Text style={styles.navTitle}>Nueva Venta</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card>
            <Text style={styles.label}>Método de pago</Text>
            <View style={styles.methodsGrid}>
              {METODOS_PAGO.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.methodBtn, metodo_pago === m && styles.methodBtnActive]}
                  onPress={() => setMetodoPago(m)}
                >
                  <Text style={[styles.methodText, metodo_pago === m && styles.methodTextActive]}>
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Input
              label="Notas (opcional)"
              value={notas}
              onChangeText={setNotas}
              placeholder="Observaciones de la venta..."
              multiline
              numberOfLines={3}
            />
            <Button
              title="Crear Venta"
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
  label: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm },
  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  methodBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { ...Typography.label, color: Colors.text },
  methodTextActive: { color: Colors.white },
  submitBtn: { marginTop: Spacing.md },
});
