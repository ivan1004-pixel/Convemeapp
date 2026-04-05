import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getClientes } from '@/src/services/cliente.service';
import { useClientesStore } from '@/src/store/clientesStore';
import { useSearch } from '@/src/hooks/useSearch';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Card } from '@/src/components/ui/Card';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { parseApiError } from '@/src/utils/errors';
import type { Cliente } from '@/src/types/cliente';

export default function ClientesScreen() {
  const router = useRouter();
  const { clientes, setClientes, isLoading, setLoading, setError } = useClientesStore();
  const { can } = usePermissions();
  const [refreshing, setRefreshing] = useState(false);
  const { query, setQuery, filtered, clearSearch } = useSearch<Cliente>(
    clientes, ['nombre_completo', 'email']
  );

  const loadClientes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [setClientes, setLoading, setError]);

  useEffect(() => { loadClientes(); }, [loadClientes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClientes();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Cliente }) => (
    <Pressable onPress={() => router.push(`/(app)/clientes/${item.id_cliente}` as any)}>
      <Card style={styles.card}>
        <Text style={styles.nombre}>{item.nombre_completo}</Text>
        {item.email && <Text style={styles.email}>{item.email}</Text>}
        {item.telefono && <Text style={styles.telefono}>📞 {item.telefono}</Text>}
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        {can('clientes:write') && (
          <Button
            title="+ Nuevo"
            onPress={() => router.push('/(app)/clientes/create' as any)}
            size="small"
          />
        )}
      </View>
      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={clearSearch}
          placeholder="Buscar por nombre o email..."
        />
      </View>
      {isLoading && !refreshing ? (
        <LoadingSpinner message="Cargando clientes..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id_cliente.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              title="Sin clientes"
              message="No se encontraron clientes"
              icon="👥"
              actionText={can('clientes:write') ? 'Agregar cliente' : undefined}
              onAction={can('clientes:write') ? () => router.push('/(app)/clientes/create' as any) : undefined}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.screenPadding, paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h1, color: Colors.text },
  searchContainer: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.sm },
  list: { padding: Spacing.screenPadding, paddingTop: 0, paddingBottom: 32 },
  card: { marginBottom: Spacing.sm },
  nombre: { ...Typography.label, color: Colors.text, marginBottom: 4 },
  email: { ...Typography.caption, color: Colors.textSecondary },
  telefono: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
