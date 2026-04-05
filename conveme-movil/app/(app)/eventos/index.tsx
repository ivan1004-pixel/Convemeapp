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
import { getEventos, deleteEvento } from '../../../src/services/evento.service';
import { useEventoStore } from '../../../src/store/eventoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Badge } from '../../../src/components/ui/Badge';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError, formatDate, formatCurrency } from '../../../src/utils';
import type { Evento } from '../../../src/types';

function getEventoStatus(evento: Evento): { label: string; color: 'primary' | 'success' | 'secondary' } {
  const now = new Date();
  const start = evento.fecha_inicio ? new Date(evento.fecha_inicio) : null;
  const end = evento.fecha_fin ? new Date(evento.fecha_fin) : null;
  if (end && now > end) return { label: 'Pasado', color: 'secondary' };
  if (start && now >= start && (!end || now <= end)) return { label: 'Activo', color: 'success' };
  return { label: 'Próximo', color: 'primary' };
}

function EventoCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Evento;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const status = getEventoStatus(item);

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
        <View style={styles.cardInfo}>
          <View style={styles.cardRow}>
            <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Badge text={status.label} color={status.color} size="sm" />
          </View>
          {item.escuela && (
            <Text style={[styles.cardMeta, { color: theme.muted }]} numberOfLines={1}>
              🏫 {item.escuela.nombre}
            </Text>
          )}
          {item.municipio && (
            <Text style={[styles.cardMeta, { color: theme.muted }]} numberOfLines={1}>
              📍 {item.municipio.nombre}
            </Text>
          )}
          <View style={styles.cardDates}>
            <Text style={[styles.cardDate, { color: theme.muted }]}>
              {formatDate(item.fecha_inicio)} — {formatDate(item.fecha_fin)}
            </Text>
            {item.costo_stand != null && (
              <Text style={[styles.cardCosto, { color: Colors.primary }]}>
                {formatCurrency(item.costo_stand)}
              </Text>
            )}
          </View>
        </View>
        <Text style={[styles.chevron, { color: theme.muted }]}>›</Text>
      </View>
    </Pressable>
  );
}

export default function EventosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { eventos, setEventos, removeEvento } = useEventoStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEventos();
      setEventos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [setEventos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getEventos();
      setEventos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, [setEventos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return eventos;
    const q = search.toLowerCase();
    return eventos.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.escuela?.nombre?.toLowerCase().includes(q) ||
        e.municipio?.nombre?.toLowerCase().includes(q)
    );
  }, [eventos, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteEvento(deleteId);
      removeEvento(deleteId);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeEvento]);

  const deleteTarget = eventos.find((e) => e.id_evento === deleteId);

  if (loading && eventos.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Eventos</Text>
        </View>
        <LoadingSpinner fullScreen message="Cargando eventos..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Eventos</Text>
        <Text style={[styles.count, { color: theme.muted }]}>{filtered.length} registros</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o escuela..."
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id_evento)}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => (
          <EventoCard
            item={item}
            onPress={() => router.push(`/eventos/${item.id_evento}`)}
            onLongPress={() => setDeleteId(item.id_evento)}
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
            title="Sin eventos"
            message={search ? 'No hay resultados para tu búsqueda.' : 'Aún no hay eventos registrados.'}
            actionLabel="Agregar evento"
            onAction={() => router.push('/eventos/create')}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/eventos/create')}
        activeOpacity={0.85}
        accessibilityLabel="Agregar evento"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar evento"
        message={`¿Deseas eliminar "${deleteTarget?.nombre ?? ''}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.h2,
  },
  count: {
    ...Typography.bodySmall,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardName: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
  cardMeta: {
    ...Typography.bodySmall,
  },
  cardDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  cardDate: {
    ...Typography.caption,
  },
  cardCosto: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
  },
});
