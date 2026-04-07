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
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
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
          <Text style={styles.initialsText}>{item.siglas?.substring(0, 3).toUpperCase() || 'ESC'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.nombre.toUpperCase()}</Text>
          <Text style={styles.cardMeta}>{item.siglas?.toUpperCase() || 'SIN SIGLAS'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.activa ? Colors.success + '22' : Colors.error + '22', borderColor: item.activa ? Colors.success : Colors.error }]}>
          <Text style={[styles.statusText, { color: item.activa ? Colors.success : Colors.error }]}>
            {item.activa ? 'ACTIVA' : 'INACTIVA'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{location?.toUpperCase() || 'SIN UBICACIÓN'}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
         <Text style={styles.footerAction}>GESTIONAR ESCUELA</Text>
         <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.primary} />
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
      showToast('ESCUELA ELIMINADA', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeEscuela, showToast]);

  const deleteTarget = escuelas.find((e) => e.id_escuela === deleteId);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>ESCUELAS</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/escuelas/create')} style={styles.addBtn}>
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
            placeholder="BUSCAR ESCUELA..."
          />
        </View>

        {loading && escuelas.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO..." />
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
                title="SIN ESCUELAS"
                message={search ? 'No hay resultados que coincidan.' : 'Aún no hay escuelas registradas.'}
                actionLabel="AGREGAR ESCUELA"
                onAction={() => router.push('/escuelas/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="ELIMINAR ESCUELA"
          message={`¿DESEAS ELIMINAR "${deleteTarget?.nombre.toUpperCase() ?? ''}"?`}
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
  headerActions: { flexDirection: 'row', gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
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
  initialsText: { fontSize: 14, fontWeight: '900', color: Colors.primary },
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
