import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getEventos, deleteEvento } from '../../../src/services/evento.service';
import { useEventoStore } from '../../../src/store/eventoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError, formatDate, formatCurrency } from '../../../src/utils';
import type { Evento } from '../../../src/types';

function getEventoStatus(evento: Evento): { label: string; color: string } {
  const now = new Date();
  const start = evento.fecha_inicio ? new Date(evento.fecha_inicio) : null;
  const end = evento.fecha_fin ? new Date(evento.fecha_fin) : null;
  if (end && now > end) return { label: 'PASADO', color: '#6B7280' };
  if (start && now >= start && (!end || now <= end)) return { label: 'EN CURSO', color: Colors.success };
  return { label: 'PRÓXIMO', color: Colors.primary };
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
  const status = getEventoStatus(item);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.nombre.toUpperCase()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Text style={styles.statusText}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {item.escuela && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="school" size={18} color={Colors.dark} />
            <Text style={styles.cardMeta} numberOfLines={1}>
              {item.escuela.nombre}
            </Text>
          </View>
        )}
        {item.municipio && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color={Colors.dark} />
            <Text style={styles.cardMeta} numberOfLines={1}>
              {item.municipio.nombre}, {item.municipio.estado?.nombre}
            </Text>
          </View>
        )}
        
        <View style={styles.cardFooter}>
          <View style={styles.dateBox}>
            <MaterialCommunityIcons name="calendar-range" size={16} color={Colors.dark} />
            <Text style={styles.cardDate}>
              {formatDate(item.fecha_inicio)} - {formatDate(item.fecha_fin)}
            </Text>
          </View>
          {item.costo_stand != null && (
            <View style={styles.costBox}>
              <Text style={styles.cardCosto}>
                {formatCurrency(item.costo_stand)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function EventosScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
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
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setEventos, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getEventos();
      setEventos(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [setEventos, showToast]);

  useEffect(() => {
    fetchData();
  }, []);

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
      showToast('Evento eliminado con éxito', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeEvento, showToast]);

  const deleteTarget = eventos.find((e) => e.id_evento === deleteId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
           </TouchableOpacity>
           <Text style={styles.title}>Eventos</Text>
        </View>
        <Text style={styles.count}>{filtered.length} registros</Text>
      </View>

      <View style={styles.searchSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o escuela..."
          containerStyle={styles.searchBar}
        />
      </View>

      {loading && !refreshing && eventos.length === 0 ? (
        <LoadingSpinner message="Cargando..." />
      ) : (
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
              onPress={() => router.push(`/eventos/create?id=${item.id_evento}`)}
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
              message={search ? 'No hay resultados.' : 'No hay eventos registrados.'}
              actionLabel="Agregar evento"
              onAction={() => router.push('/eventos/create')}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/eventos/create')}
        activeOpacity={0.9}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar evento"
        message={`¿Deseas eliminar "${deleteTarget?.nombre?.toUpperCase() ?? ''}"?`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        destructive
      />

      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  count: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: 'rgba(26,26,26,0.5)',
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardBody: {
    gap: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(26,26,26,0.6)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDate: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(26,26,26,0.5)',
  },
  costBox: {
    backgroundColor: Colors.warning + '22',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  cardCosto: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.dark,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  fabIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '900',
  },
});
