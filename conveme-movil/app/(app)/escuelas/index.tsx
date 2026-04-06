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
import { getEscuelas, deleteEscuela } from '../../../src/services/escuela.service';
import { useEscuelaStore } from '../../../src/store/escuelaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import type { Escuela } from '../../../src/types';

function EscuelaCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Escuela;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const location = [item.municipio?.nombre, item.municipio?.estado?.nombre]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.initialsText}>{item.siglas?.substring(0, 3)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.nombre.toUpperCase()}</Text>
          <Text style={styles.cardMeta}>{item.siglas || 'SIN SIGLAS'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.activa ? Colors.success + '22' : Colors.error + '22' }]}>
          <Text style={[styles.statusText, { color: item.activa ? Colors.success : Colors.error }]}>
            {item.activa ? 'ACTIVA' : 'INACTIVA'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color="rgba(26,26,26,0.5)" />
          <Text style={styles.infoText}>{location || 'SIN UBICACIÓN'}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
         <Text style={styles.footerAction}>Editar escuela</Text>
         <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

export default function EscuelasScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { escuelas, setEscuelas, removeEscuela } = useEscuelaStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEscuelas();
      setEscuelas(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setEscuelas, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getEscuelas();
      setEscuelas(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [setEscuelas, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return escuelas;
    const q = search.toLowerCase();
    return escuelas.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.siglas.toLowerCase().includes(q) ||
        e.municipio?.nombre?.toLowerCase().includes(q)
    );
  }, [escuelas, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteEscuela(deleteId);
      removeEscuela(deleteId);
      showToast('Escuela eliminada correctamente', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeEscuela, showToast]);

  const deleteTarget = escuelas.find((e) => e.id_escuela === deleteId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
           </TouchableOpacity>
           <Text style={styles.title}>Escuelas</Text>
        </View>
        <Text style={styles.count}>{filtered.length} registros</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o siglas..."
        />
      </View>

      {loading && escuelas.length === 0 ? (
        <LoadingSpinner message="Cargando escuelas..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_escuela)}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listEmpty,
          ]}
          renderItem={({ item }) => (
            <EscuelaCard
              item={item}
              onPress={() => router.push(`/escuelas/create?id=${item.id_escuela}`)}
              onLongPress={() => setDeleteId(item.id_escuela)}
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
              icon="school"
              title="Sin escuelas"
              message={search ? 'No hay resultados.' : 'Aún no hay escuelas registradas.'}
              actionLabel="Agregar escuela"
              onAction={() => router.push('/escuelas/create')}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/escuelas/create')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar escuela"
        message={`¿Deseas eliminar "${deleteTarget?.nombre ?? ''}"? Esta acción no se puede deshacer.`}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
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
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  initialsText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
  },
  headerInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  cardMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(26,26,26,0.4)',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  cardContent: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(26,26,26,0.6)',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
    gap: 4,
  },
  footerAction: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
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
