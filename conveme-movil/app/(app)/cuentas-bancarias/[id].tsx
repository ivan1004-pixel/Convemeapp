import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getCuentasBancarias, deleteCuentaBancaria } from '../../../src/services/cuenta-bancaria.service';
import { useCuentaBancariaStore } from '../../../src/store/cuentaBancariaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';

export default function CuentaBancariaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const { cuentasBancarias, setCuentasBancarias, removeCuentaBancaria } = useCuentaBancariaStore();

  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cuenta = cuentasBancarias.find((c) => String(c.id_cuenta) === String(id));

  useEffect(() => {
    if (!cuenta) {
      setLoading(true);
      getCuentasBancarias()
        .then((data) => setCuentasBancarias(data))
        .catch((err) => Alert.alert('Error', parseGraphQLError(err)))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCuentaBancaria(parseInt(id, 10));
      removeCuentaBancaria(parseInt(id, 10));
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading || !cuenta) return <LoadingSpinner />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: Colors.primary }]}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Cuenta Bancaria</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.muted }]}>Banco</Text>
            <Text style={[styles.value, { color: theme.text }]}>🏦 {cuenta.banco}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.muted }]}>Titular</Text>
            <Text style={[styles.value, { color: theme.text }]}>{cuenta.titular_cuenta}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.muted }]}>Número de Cuenta</Text>
            <Text style={[styles.value, { color: theme.text }]}>{cuenta.numero_cuenta}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.muted }]}>CLABE Interbancaria</Text>
            <Text style={[styles.value, { color: theme.text }]}>{cuenta.clabe_interbancaria ?? '—'}</Text>
          </View>
          {cuenta.vendedor && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.muted }]}>Vendedor</Text>
              <Text style={[styles.value, { color: theme.text }]}>👤 {cuenta.vendedor.nombre_completo}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: Colors.primary }]}
          onPress={() => router.push(`/(app)/cuentas-bancarias/create?id=${id}`)}
        >
          <Text style={styles.buttonText}>✏️ Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: Colors.error }]}
          onPress={() => setShowDelete(true)}
        >
          <Text style={styles.buttonText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
      </ScrollView>
      <ConfirmDialog
        visible={showDelete}
        title="Eliminar cuenta"
        message="¿Deseas eliminar esta cuenta bancaria? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  backRow: { marginBottom: Spacing.sm },
  back: { fontSize: 16, fontWeight: '500' },
  title: { ...Typography.h2, marginBottom: Spacing.lg },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  row: { marginBottom: Spacing.sm },
  label: { fontSize: 12, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '600' },
  editButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
