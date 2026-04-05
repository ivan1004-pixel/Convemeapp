import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getOrdenesProduccion, createOrdenProduccion, updateOrdenProduccion } from '../../../src/services/produccion.service';
import { useProduccionStore } from '../../../src/store/produccionStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';

const ESTADOS = ['Pendiente', 'En Proceso', 'Finalizada', 'Cancelada'];

export default function ProduccionCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const { addOrden, updateOrden } = useProduccionStore();

  const [producto_id, setProductoId] = useState('');
  const [empleado_id, setEmpleadoId] = useState('');
  const [cantidad_a_producir, setCantidad] = useState('');
  const [estado, setEstado] = useState('Pendiente');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const all = await getOrdenesProduccion();
        const found = all.find((o: any) => String(o.id_orden_produccion) === String(id));
        if (found) {
          setProductoId(String(found.producto?.id_producto ?? ''));
          setEmpleadoId(String(found.empleado?.id_empleado ?? ''));
          setCantidad(String(found.cantidad_a_producir ?? ''));
          setEstado(found.estado ?? 'Pendiente');
        }
      } catch (err) {
        Alert.alert('Error', parseGraphQLError(err));
      } finally {
        setInitializing(false);
      }
    })();
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!producto_id || !empleado_id || !cantidad_a_producir) {
      Alert.alert('Validación', 'ID Producto, ID Empleado y Cantidad son requeridos.');
      return;
    }
    setLoading(true);
    try {
      const input: any = {
        producto_id: parseInt(producto_id, 10),
        empleado_id: parseInt(empleado_id, 10),
        cantidad_a_producir: parseInt(cantidad_a_producir, 10),
        estado,
      };
      if (isEdit) {
        input.id_orden_produccion = parseInt(id!, 10);
        const updated = await updateOrdenProduccion(input);
        updateOrden(updated);
      } else {
        const created = await createOrdenProduccion(input);
        addOrden(created);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  };

  if (initializing) return <LoadingSpinner />;

  const inputStyle = [styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: Colors.primary }]}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{isEdit ? 'Editar Producción' : 'Nueva Orden de Producción'}</Text>

        <Text style={[styles.label, { color: theme.muted }]}>ID Producto *</Text>
        <TextInput
          style={inputStyle}
          value={producto_id}
          onChangeText={setProductoId}
          placeholder="ID del producto"
          placeholderTextColor={theme.muted}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.muted }]}>ID Empleado *</Text>
        <TextInput
          style={inputStyle}
          value={empleado_id}
          onChangeText={setEmpleadoId}
          placeholder="ID del empleado"
          placeholderTextColor={theme.muted}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.muted }]}>Cantidad a Producir *</Text>
        <TextInput
          style={inputStyle}
          value={cantidad_a_producir}
          onChangeText={setCantidad}
          placeholder="Cantidad"
          placeholderTextColor={theme.muted}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.muted }]}>Estado</Text>
        <View style={styles.selectorRow}>
          {ESTADOS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[
                styles.selectorOption,
                { borderColor: theme.border, backgroundColor: estado === e ? Colors.primary : theme.card },
              ]}
              onPress={() => setEstado(e)}
            >
              <Text style={{ color: estado === e ? '#fff' : theme.text, fontSize: 12 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: Colors.primary }, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Orden'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  backRow: { marginBottom: Spacing.sm },
  back: { fontSize: 16, fontWeight: '500' },
  title: { ...Typography.h2, marginBottom: Spacing.lg },
  label: { fontSize: 13, marginBottom: 4, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  selectorOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  submitButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  disabledButton: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
