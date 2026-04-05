import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getCuentasBancarias, deleteCuentaBancaria } from '../../../src/services/cuenta-bancaria.service';
import { useCuentaBancariaStore } from '../../../src/store/cuentaBancariaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';

export default function CuentasBancariasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const { cuentasBancarias, setCuentasBancarias, removeCuentaBancaria } = useCuentaBancariaStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCuentasBancarias();
      setCuentasBancarias(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getCuentasBancarias();
      setCuentasBancarias(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCuentaBancaria(deleteId);
      removeCuentaBancaria(deleteId);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  const maskAccount = (num: string) => {
    if (!num) return '****';
    return '****' + num.slice(-4);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Cuentas Bancarias</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Colors.primary }]}
          onPress={() => router.push('/(app)/cuentas-bancarias/create')}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={cuentasBancarias}
          keyExtractor={(item) => String(item.id_cuenta)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/cuentas-bancarias/${item.id_cuenta}`)}
              onLongPress={() => setDeleteId(item.id_cuenta)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                Shadows.sm,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.banco, { color: theme.text }]}>🏦 {item.banco}</Text>
                <Text style={[styles.account, { color: theme.muted }]}>{maskAccount(item.numero_cuenta)}</Text>
              </View>
              <Text style={[styles.titular, { color: theme.text }]}>{item.titular_cuenta}</Text>
              {item.vendedor && (
                <Text style={[styles.vendedor, { color: theme.muted }]}>
                  👤 {item.vendedor.nombre_completo}
                </Text>
              )}
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState message="No hay cuentas bancarias registradas" />}
        />
      )}
      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar cuenta"
        message="¿Deseas eliminar esta cuenta bancaria? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  title: { ...Typography.h2 },
  addButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  banco: { fontSize: 15, fontWeight: '700' },
  account: { fontSize: 14, fontFamily: 'monospace' },
  titular: { fontSize: 14, marginBottom: 4 },
  vendedor: { fontSize: 12 },
});
