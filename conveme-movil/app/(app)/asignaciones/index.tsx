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
import { getAsignaciones, deleteAsignacion } from '../../../src/services/asignacion.service';
import { useAsignacionStore } from '../../../src/store/asignacionStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError, formatDate } from '../../../src/utils';
import type { Asignacion } from '../../../src/types';

const ESTADO_BADGE: Record<string, string> = {
  Activa: Colors.success,
  Finalizado: '#6B7280',
  Pendiente: Colors.warning,
};

function AsignacionCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Asignacion;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const estado = item.estado ?? 'Pendiente';
  const totalPiezas = item.detalles?.reduce((acc, det) => acc + (det.cantidad_asignada || 0), 0) ?? 0;

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
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="clipboard-list-outline" size={32} color={Colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardName}>{item.vendedor?.nombre_completo || 'Sin vendedor'}</Text>
          <Text style={styles.cardMeta}>ID ASIGNACIÓN #{item.id_asignacion}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (ESTADO_BADGE[estado] || Colors.warning) + '22' }]}>
          <Text style={[styles.statusText, { color: (ESTADO_BADGE[estado] || Colors.warning) === Colors.warning ? '#B45309' : (ESTADO_BADGE[estado] || Colors.warning) }]}>
            {estado.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-outline" size={16} color="rgba(26,26,26,0.5)" />
          <Text style={styles.infoText}>{formatDate(item.fecha_asignacion)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="package-variant-closed" size={16} color="rgba(26,26,26,0.5)" />
          <Text style={styles.infoText}>
            <Text style={{ fontWeight: '900', color: Colors.dark }}>{totalPiezas}</Text> {totalPiezas === 1 ? 'pieza asignada' : 'piezas en total'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
         <Text style={styles.footerAction}>Ver detalles</Text>
         <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

export default function AsignacionesScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { asignaciones, setAsignaciones, removeAsignacion } = useAsignacionStore();
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
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setAsignaciones, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getAsignaciones(search);
      setAsignaciones(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [search, setAsignaciones, showToast]);

  useEffect(() => {
    fetchData();
  }, []);

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
      removeAsignacion(deleteId);
      showToast('Asignación eliminada correctamente', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeAsignacion, showToast]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
           </TouchableOpacity>
           <Text style={styles.title}>Asignaciones</Text>
        </View>
        <Text style={styles.count}>{asignaciones.length} registros</Text>
      </View>

      <View style={styles.searchSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por vendedor..."
        />
      </View>

      {loading && asignaciones.length === 0 ? (
        <LoadingSpinner message="Cargando asignaciones..." />
      ) : (
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
              onPress={() => router.push(`/asignaciones/create?id=${item.id_asignacion}`)}
              onLongPress={() => setDeleteId(item.id_asignacion)}
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
              icon="clipboard-list"
              title="Sin asignaciones"
              message={search ? 'No hay resultados.' : 'Aún no hay asignaciones registradas.'}
              actionLabel="Agregar asignación"
              onAction={() => router.push('/asignaciones/create')}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/asignaciones/create')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar asignación"
        message={`¿Deseas eliminar la asignación #${deleteId}? Esta acción no se puede deshacer.`}
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
  container: { flex: 1, backgroundColor: Colors.beige },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backBtn: { padding: Spacing.xs },
  title: { ...Typography.h2, fontWeight: '900', color: '#1A1A1A' },
  count: { ...Typography.bodySmall, fontWeight: '700', color: 'rgba(26,26,26,0.5)' },
  searchSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  headerInfo: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  cardMeta: { fontSize: 10, fontWeight: '700', color: 'rgba(26,26,26,0.4)', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontSize: 9, fontWeight: '900' },
  cardContent: { gap: Spacing.xs, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { fontSize: 13, fontWeight: '600', color: 'rgba(26,26,26,0.6)' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: Spacing.sm, gap: 4 },
  footerAction: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  fab: { position: 'absolute', bottom: 90, right: Spacing.lg, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, zIndex: 999 },
  fabIcon: { fontSize: 32, color: '#ffffff', fontWeight: '900' },
});
