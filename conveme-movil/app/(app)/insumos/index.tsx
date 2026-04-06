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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInsumos, deleteInsumo } from '../../../src/services/insumo.service';
import { useInsumoStore } from '../../../src/store/insumoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import type { Insumo } from '../../../src/types';

function InsumoCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Insumo;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const isLowStock =
    item.stock_minimo_alerta != null &&
    item.stock_actual != null &&
    item.stock_actual <= item.stock_minimo_alerta;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        isLowStock && { borderColor: Colors.error }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: isLowStock ? Colors.error + '15' : Colors.info + '15' }]}>
            <MaterialCommunityIcons 
                name={isLowStock ? "alert-outline" : "flask-outline"} 
                size={24} 
                color={isLowStock ? Colors.error : Colors.info} 
            />
        </View>
        <View style={styles.headerText}>
            <Text style={styles.cardName}>{item.nombre}</Text>
            <Text style={styles.cardUnit}>{item.unidad_medida?.toUpperCase()}</Text>
        </View>
        {isLowStock && <Badge text="BAJO STOCK" color="error" size="sm" />}
      </View>

      <View style={styles.cardBody}>
          <View style={styles.stockRow}>
              <View style={styles.stockItem}>
                  <Text style={styles.stockLabel}>ACTUAL</Text>
                  <Text style={[styles.stockValue, isLowStock && { color: Colors.error }]}>{item.stock_actual}</Text>
              </View>
              <View style={styles.stockDivider} />
              <View style={styles.stockItem}>
                  <Text style={styles.stockLabel}>MÍNIMO</Text>
                  <Text style={styles.stockValue}>{item.stock_minimo_alerta || 0}</Text>
              </View>
          </View>
      </View>

      <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Gestionar inventario</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.dark} />
      </View>
    </Pressable>
  );
}

export default function InsumosScreen() {
  const { toast, show, hide } = useToast();
  const { insumos, setInsumos, removeInsumo } = useInsumoStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setInsumos, show]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [setInsumos, show]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return insumos;
    const q = search.toLowerCase();
    return insumos.filter(
      (i) =>
        i.nombre.toLowerCase().includes(q) ||
        i.unidad_medida?.toLowerCase().includes(q)
    );
  }, [insumos, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteInsumo(deleteId);
      removeInsumo(deleteId);
      show('Insumo eliminado correctamente', 'success');
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeInsumo, show]);

  const deleteTarget = insumos.find((i) => i.id_insumo === deleteId);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Insumos</Text>
                <Text style={styles.subtitle}>{insumos.length} materiales registrados</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                <MaterialCommunityIcons name="refresh" size={24} color={Colors.primary} />
            </TouchableOpacity>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_insumo)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar insumo..."
              style={{ marginBottom: 25 }}
            />
          }
          renderItem={({ item }) => (
            <InsumoCard
              item={item}
              onPress={() => router.push(`/(app)/insumos/${item.id_insumo}`)}
              onLongPress={() => setDeleteId(item.id_insumo)}
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
            loading ? (
                <LoadingSpinner message="Cargando materiales..." />
            ) : (
                <EmptyState
                    icon="flask-empty-outline"
                    title="Sin insumos"
                    message={search ? 'No se encontraron resultados.' : 'No hay insumos registrados aún.'}
                    actionLabel="Registrar Insumo"
                    onAction={() => router.push('/insumos/create')}
                />
            )
          }
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/insumos/create')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        <ConfirmDialog
          visible={deleteId !== null}
          title="Eliminar insumo"
          message={`¿Deseas eliminar "${deleteTarget?.nombre ?? ''}"?`}
          confirmText="Eliminar"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
          destructive
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 15, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, elevation: 0 },
  cardPressed: { transform: [{ translateY: 2 }, { translateX: 2 }], shadowOffset: { width: 2, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  headerText: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: '900', color: Colors.dark },
  cardUnit: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)' },
  cardBody: { backgroundColor: '#F9FAFB', borderRadius: 15, padding: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', marginBottom: 12 },
  stockRow: { flexDirection: 'row', alignItems: 'center' },
  stockItem: { flex: 1, alignItems: 'center' },
  stockDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.05)' },
  stockLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  stockValue: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.3)' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, zIndex: 999 },
  fabIcon: { fontSize: 32, color: '#FFF', fontWeight: '900' }
});
