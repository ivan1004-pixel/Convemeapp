import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createProducto } from '@/src/services/producto.service';
import { useProductosStore } from '@/src/store/productosStore';
import { useUIStore } from '@/src/store/uiStore';
import { PermissionGuard } from '@/src/components/PermissionGuard';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { validators } from '@/src/utils/validators';
import { parseApiError } from '@/src/utils/errors';

export default function CreateProductoScreen() {
  const router = useRouter();
  const { addProducto } = useProductosStore();
  const { showToast } = useUIStore();
  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [precio, setPrecio] = useState('');
  const [errors, setErrors] = useState<{ nombre?: string; sku?: string; precio?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!sku.trim()) newErrors.sku = 'El SKU es requerido';
    const precioErr = validators.positiveNumber(precio);
    if (precioErr) newErrors.precio = precioErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const newProducto = await createProducto({
        nombre: nombre.trim(),
        sku: sku.trim().toUpperCase(),
        precio_unitario: parseFloat(precio),
      });
      addProducto(newProducto);
      showToast('Producto creado exitosamente', 'success');
      router.back();
    } catch (err) {
      Alert.alert('Error', parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PermissionGuard permission="productos:write" showFallback>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <View style={styles.navBar}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Cancelar</Text>
            </Pressable>
            <Text style={styles.navTitle}>Nuevo Producto</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Card>
              <Input
                label="Nombre *"
                value={nombre}
                onChangeText={setNombre}
                error={errors.nombre}
                placeholder="Nombre del producto"
                autoCapitalize="words"
              />
              <Input
                label="SKU *"
                value={sku}
                onChangeText={setSku}
                error={errors.sku}
                placeholder="Código único del producto"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Input
                label="Precio unitario *"
                value={precio}
                onChangeText={setPrecio}
                error={errors.precio}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              <Button
                title="Crear Producto"
                onPress={handleCreate}
                loading={isLoading}
                fullWidth
                style={styles.submitBtn}
              />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PermissionGuard>
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
