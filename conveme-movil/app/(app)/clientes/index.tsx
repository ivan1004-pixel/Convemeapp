import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { getClientes, deleteCliente } from '../../../src/services/cliente.service';
import { useClienteStore } from '../../../src/store/clienteStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Avatar } from '../../../src/components/ui/Avatar';

const AVATAR_MD = 40;
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatDate, parseGraphQLError, getInitials, formatPhone } from '../../../src/utils';
import type { Cliente } from '../../../src/types';

function ClienteCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Cliente;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        Shadows.sm,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.cardContent}>
        <Avatar name={item.nombre_completo} size={AVATAR_MD} />
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>
            {item.nombre_completo}
          </Text>
          {item.email && (
            <Text style={[styles.cardMeta, { color: theme.muted }]} numberOfLines={1}>
              ✉️ {item.email}
            </Text>
          )}
          {item.telefono && (
            <Text style={[styles.cardMeta, { color: theme.muted }]}>
              📞 {formatPhone(item.telefono)}
            </Text>
          )}
          {item.fecha_registro && (
            <Text style={[styles.cardDate, { color: theme.muted }]}>
              Desde {formatDate(item.fecha_registro)}
            </Text>
          )}
        </View>
        <Text style={[styles.chevron, { color: theme.muted }]}>›</Text>
      </View>
    </Pressable>
  );
}

export default function ClientesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { clientes, setClientes, removeCliente } = useClienteStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [setClientes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, [setClientes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre_completo.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telefono?.includes(q)
    );
  }, [clientes, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteCliente(deleteId);
      removeCliente(deleteId);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeCliente]);

  const deleteTarget = clientes.find((c) => c.id_cliente === deleteId);

  if (loading && clientes.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Clientes</Text>
        </View>
        <LoadingSpinner fullScreen message="Cargando clientes..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Clientes</Text>
        <Text style={[styles.count, { color: theme.muted }]}>{filtered.length} registros</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, email..."
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id_cliente)}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => (
          <ClienteCard
            item={item}
            onPress={() => router.push(`/clientes/${item.id_cliente}`)}
            onLongPress={() => setDeleteId(item.id_cliente)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="Sin clientes"
            message={
              search
                ? 'No hay clientes que coincidan con tu búsqueda.'
                : 'Aún no hay clientes registrados.'
            }
            actionLabel={!search ? 'Agregar cliente' : undefined}
            onAction={!search ? () => router.push('/clientes/create') : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, Shadows.lg]}
        onPress={() => router.push('/clientes/create')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Nuevo cliente"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar cliente"
        message={`¿Deseas eliminar a "${deleteTarget?.nombre_completo ?? ''}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
        destructive
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h3 },
  count: { ...Typography.bodySmall },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardPressed: { opacity: 0.85 },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: { ...Typography.bodySmall, fontWeight: '600', marginBottom: 2 },
  cardMeta: { ...Typography.caption, marginTop: 2 },
  cardDate: { ...Typography.caption, marginTop: Spacing.xs },
  chevron: { fontSize: 20, fontWeight: '300' },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, color: '#ffffff', lineHeight: 32 },
});
