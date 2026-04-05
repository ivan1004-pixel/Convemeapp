import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createPedido } from '@/src/services/pedido.service';
import { usePedidosStore } from '@/src/store/pedidosStore';
import { useUIStore } from '@/src/store/uiStore';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { parseApiError } from '@/src/utils/errors';

export default function CreatePedidoScreen() {
  const router = useRouter();
  const { addPedido } = usePedidosStore();
  const { showToast } = useUIStore();
  const [fecha_entrega, setFechaEntrega] = useState('');
  const [notas, setNotas] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const newPedido = await createPedido({
        fecha_entrega: fecha_entrega.trim() || undefined,
        notas: notas.trim() || undefined,
        detalles: [],
      });
      addPedido(newPedido);
      showToast('Pedido creado exitosamente', 'success');
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
          <Text style={styles.navTitle}>Nuevo Pedido</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card>
            <Input
              label="Fecha de entrega (opcional)"
              value={fecha_entrega}
              onChangeText={setFechaEntrega}
              placeholder="Ej: 2025-12-31"
              autoCapitalize="none"
            />
            <Input
              label="Notas (opcional)"
              value={notas}
              onChangeText={setNotas}
              placeholder="Observaciones del pedido..."
              multiline
              numberOfLines={3}
            />
            <Button
              title="Crear Pedido"
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
