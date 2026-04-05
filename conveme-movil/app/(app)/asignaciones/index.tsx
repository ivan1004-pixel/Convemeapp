import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getAsignaciones, deleteAsignacion } from '../../../src/services/asignacion.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatDate, parseGraphQLError } from '../../../src/utils';
import type { Asignacion } from '../../../src/types';

const ESTADO_BADGE: Record<string, 'success' | 'secondary' | 'warning'> = {
  Activa: 'success',
  Cerrada: 'secondary',
  Pendiente: 'warning',
};

function AsignacionCard({
  item,
  onPress,
  onDelete,
}: {
  item: Asignacion;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const estado = item.estado ?? 'Pendiente';
  const itemCount = item.detalles?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDelete}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        Shadows.sm,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardId, { color: theme.muted }]}>
          Asignación #{item.id_asignacion}
        </Text>
        <View style={styles.headerRight}>
          <Badge
            text={estado}
            color={ESTADO_BADGE[estado] ?? 'secondary'}
            size="sm"
          />
          <TouchableOpacity onPress={onDelete} accessibilityLabel="Eliminar asignación">
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.cardVendedor, { color: theme.text }]}>
        👤 {item.vendedor?.nombre_completo ?? 'Sin vendedor'}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>
          📅 {formatDate(item.fecha_asignacion)}
        </Text>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>
          📦 {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AsignacionesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const data = await getAsignaciones(q);
      setAsignaciones(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getAsignaciones(search);
      setAsignaciones(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce search via server-side filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchData]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteAsignacion(deleteId);
      setAsignaciones((prev) => prev.filter((a) => a.id_asignacion !== deleteId));
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  if (loading && asignaciones.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Asignaciones</Text>
        </View>
        <LoadingSpinner fullScreen message="Cargando asignaciones..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Asignaciones</Text>
        <Text style={[styles.count, { color: theme.muted }]}>{asignaciones.length} registros</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por vendedor..."
        />
      </View>

      <FlatList
        data={asignaciones}
        keyExtractor={(item) => String(item.id_asignacion)}
        contentContainerStyle={[
          styles.listContent,
          asignaciones.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => (
          <AsignacionCard
            item={item}
            onPress={() => router.push(`/asignaciones/${item.id_asignacion}`)}
            onDelete={() => setDeleteId(item.id_asignacion)}
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
            icon="📦"
            title="Sin asignaciones"
            message={
              search
                ? 'No hay asignaciones que coincidan.'
                : 'Aún no hay asignaciones registradas.'
            }
            actionLabel={!search ? 'Nueva asignación' : undefined}
            onAction={!search ? () => router.push('/asignaciones/create') : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, Shadows.lg]}
        onPress={() => router.push('/asignaciones/create')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Nueva asignación"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar asignación"
        message="¿Deseas eliminar esta asignación? Esta acción no se puede deshacer."
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
  searchContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardId: { ...Typography.bodySmall },
  deleteIcon: { fontSize: 18 },
  cardVendedor: { ...Typography.body, fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  cardMeta: { ...Typography.caption },
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
