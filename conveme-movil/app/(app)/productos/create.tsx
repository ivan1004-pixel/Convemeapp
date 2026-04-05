import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createProducto, updateProducto } from '../../../src/services/producto.service';
import { useProductoStore } from '../../../src/store/productoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Producto } from '../../../src/types';

export default function ProductoCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { productos, addProducto, updateProducto: updateProductoStore } = useProductoStore();

  const isEditing = !!id;
  const existing: Producto | undefined = isEditing
    ? productos.find((p) => p.id_producto === Number(id))
    : undefined;

  const [form, setForm] = useState({
    nombre: existing?.nombre ?? '',
    sku: existing?.sku ?? '',
    precio_unitario: existing ? String(existing.precio_unitario) : '',
    precio_mayoreo: existing ? String(existing.precio_mayoreo) : '',
    cantidad_minima_mayoreo: existing?.cantidad_minima_mayoreo != null
      ? String(existing.cantidad_minima_mayoreo)
      : '',
    costo_produccion: existing?.costo_produccion != null
      ? String(existing.costo_produccion)
      : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.sku.trim()) newErrors.sku = 'El SKU es requerido';
    if (!form.precio_unitario.trim()) {
      newErrors.precio_unitario = 'El precio es requerido';
    } else if (isNaN(Number(form.precio_unitario)) || Number(form.precio_unitario) < 0) {
      newErrors.precio_unitario = 'Ingresa un precio válido';
    }
    if (form.precio_mayoreo && (isNaN(Number(form.precio_mayoreo)) || Number(form.precio_mayoreo) < 0)) {
      newErrors.precio_mayoreo = 'Ingresa un precio válido';
    }
    if (form.cantidad_minima_mayoreo && (isNaN(Number(form.cantidad_minima_mayoreo)) || Number(form.cantidad_minima_mayoreo) < 0)) {
      newErrors.cantidad_minima_mayoreo = 'Ingresa una cantidad válida';
    }
    if (form.costo_produccion && (isNaN(Number(form.costo_produccion)) || Number(form.costo_produccion) < 0)) {
      newErrors.costo_produccion = 'Ingresa un costo válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const input: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        sku: form.sku.trim(),
        precio_unitario: Number(form.precio_unitario),
        precio_mayoreo: Number(form.precio_mayoreo || '0'),
      };
      if (form.cantidad_minima_mayoreo) {
        input.cantidad_minima_mayoreo = Number(form.cantidad_minima_mayoreo);
      }
      if (form.costo_produccion) {
        input.costo_produccion = Number(form.costo_produccion);
      }

      if (isEditing && existing) {
        const updated = await updateProducto({ id_producto: existing.id_producto, ...input });
        updateProductoStore({ ...existing, ...updated });
      } else {
        const created = await createProducto(input);
        addProducto(created);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Nombre *"
          value={form.nombre}
          onChangeText={(v) => setField('nombre', v)}
          placeholder="Ej. Camiseta universitaria"
          error={errors.nombre}
          autoCapitalize="words"
        />

        <Input
          label="SKU *"
          value={form.sku}
          onChangeText={(v) => setField('sku', v)}
          placeholder="Ej. CAM-001"
          error={errors.sku}
          autoCapitalize="characters"
        />

        <Input
          label="Precio unitario (menudeo) *"
          value={form.precio_unitario}
          onChangeText={(v) => setField('precio_unitario', v)}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.precio_unitario}
        />

        <Input
          label="Precio mayoreo"
          value={form.precio_mayoreo}
          onChangeText={(v) => setField('precio_mayoreo', v)}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.precio_mayoreo}
          helperText="Opcional"
        />

        <Input
          label="Cantidad mínima para mayoreo"
          value={form.cantidad_minima_mayoreo}
          onChangeText={(v) => setField('cantidad_minima_mayoreo', v)}
          placeholder="Ej. 10"
          keyboardType="number-pad"
          error={errors.cantidad_minima_mayoreo}
          helperText="Opcional"
        />

        <Input
          label="Costo de producción"
          value={form.costo_produccion}
          onChangeText={(v) => setField('costo_produccion', v)}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.costo_produccion}
          helperText="Opcional"
        />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Crear producto'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitBtn}
        />

        <Button
          title="Cancelar"
          variant="ghost"
          onPress={() => router.back()}
          disabled={submitting}
          style={styles.cancelBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  backIcon: { fontSize: 22, color: Colors.primary },
  title: { ...Typography.h4, flex: 1 },
  headerPlaceholder: { width: 32 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  submitBtn: { marginTop: Spacing.md },
  cancelBtn: { marginTop: Spacing.sm },
});
