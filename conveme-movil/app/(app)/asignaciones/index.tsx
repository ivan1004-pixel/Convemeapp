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
import type { AsignacionVendedor } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

function AsignacionCard({
  item,
  onPress,
  onLongPress,
}: {
  item: AsignacionVendedor;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const totalItems = item.detalles?.reduce((acc, det) => acc + det.cantidad_asignada, 0) || 0;

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
          <MaterialCommunityIcons name="clipboard-account" size={28} color={Colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardName}>{item.vendedor?.nombre_completo?.toUpperCase() || 'SIN VENDEDOR'}</Text>
          <Text style={styles.cardMeta}>ASIGNACIÓN #{item.id_asignacion}</Text>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: (item.estado === 'Entregado' || item.estado === 'Finalizado') ? Colors.success + '22' : Colors.warning + '22', 
          borderColor: (item.estado === 'Entregado' || item.estado === 'Finalizado') ? Colors.success : Colors.warning 
        }]}>
          <Text style={[styles.statusText, { color: (item.estado === 'Entregado' || item.estado === 'Finalizado') ? Colors.success : Colors.warning }]}>
            {item.estado?.toUpperCase() || 'PENDIENTE'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="package-variant" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{totalItems} PRODUCTOS ASIGNADOS</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{formatDate(item.fecha_asignacion)}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
         <Text style={styles.footerAction}>GESTIONAR ASIGNACIÓN</Text>
         <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.primary} />
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
      showToast('ASIGNACIÓN ELIMINADA', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeAsignacion, showToast]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>ASIGNACIONES</Text>
                    <Text style={styles.subtitle}>{asignaciones.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/asignaciones/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="BUSCAR POR VENDEDOR..."
          />
        </View>

        {loading && asignaciones.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO..." />
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
                title="SIN ASIGNACIONES"
                message={search ? 'No hay resultados que coincidan.' : 'Aún no hay asignaciones registradas.'}
                actionLabel="AGREGAR ASIGNACIÓN"
                onAction={() => router.push('/asignaciones/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="ELIMINAR ASIGNACIÓN"
          message={`¿DESEAS ELIMINAR LA ASIGNACIÓN #${deleteId}?`}
          confirmText="ELIMINAR"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
          destructive
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 5 },
  searchSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.1, elevation: 3 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatarContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.primary + '10', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  headerInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  cardMeta: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 8, fontWeight: '900' },
  cardContent: { gap: 6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12, paddingBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.5)' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  footerAction: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },
});
