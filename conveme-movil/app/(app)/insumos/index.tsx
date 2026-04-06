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
        <View style={[styles.iconContainer, { backgroundColor: isLowStock ? Colors.error + '15' : Colors.primary + '15' }]}>
            <MaterialCommunityIcons 
                name={isLowStock ? "alert-outline" : "package-variant-closed"} 
                size={24} 
                color={isLowStock ? Colors.error : Colors.primary} 
            />
        </View>
        <View style={styles.headerText}>
            <Text style={styles.cardName}>{item.nombre.toUpperCase()}</Text>
            <View style={styles.unitBadge}>
              <Text style={styles.cardUnitText}>{item.unidad_medida?.toUpperCase() || 'UNIDAD'}</Text>
            </View>
        </View>
        {isLowStock && <Badge text="BAJO STOCK" color="error" size="sm" />}
      </View>

      <View style={styles.cardBody}>
          <View style={styles.stockRow}>
              <View style={styles.stockItem}>
                  <Text style={styles.stockLabel}>STOCK ACTUAL</Text>
                  <Text style={[styles.stockValue, isLowStock && { color: Colors.error }]}>{item.stock_actual}</Text>
              </View>
              <View style={styles.stockDivider} />
              <View style={styles.stockItem}>
                  <Text style={styles.stockLabel}>ALERTA MÍNIMA</Text>
                  <Text style={styles.stockValue}>{item.stock_minimo_alerta || 0}</Text>
              </View>
          </View>
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
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
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
    if (!selectedInsumo) return;
    setDeleting(true);
    try {
      await deleteInsumo(selectedInsumo.id_insumo);
      removeInsumo(selectedInsumo.id_insumo);
      show('Insumo eliminado correctamente', 'success');
      setSelectedInsumo(null);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }, [selectedInsumo, removeInsumo, show]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Insumos</Text>
                <Text style={styles.subtitle}>{insumos.length} materiales en inventario</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/insumos/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_insumo)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="BUSCAR MATERIAL..."
              style={{ marginBottom: 25 }}
            />
          }
          renderItem={({ item }) => (
            <InsumoCard
              item={item}
              onPress={() => router.push(`/(app)/insumos/${item.id_insumo}`)}
              onLongPress={() => setSelectedInsumo(item)}
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
                    icon="package-variant"
                    title="SIN INSUMOS"
                    message={search ? 'No se encontraron resultados.' : 'No hay materiales registrados.'}
                    actionLabel="REGISTRAR INSUMO"
                    onAction={() => router.push('/insumos/create')}
                />
            )
          }
          showsVerticalScrollIndicator={false}
        />

        <ConfirmDialog
          visible={selectedInsumo !== null}
          title="OPCIONES DE INSUMO"
          message={`¿Qué deseas hacer con "${selectedInsumo?.nombre}"?`}
          confirmText="ELIMINAR"
          onConfirm={handleDelete}
          onCancel={() => setSelectedInsumo(null)}
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
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 18, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, elevation: 0 },
  cardPressed: { transform: [{ translateY: 3 }, { translateX: 3 }], shadowOffset: { width: 2, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  iconContainer: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  headerText: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: '900', color: Colors.dark, marginBottom: 4 },
  unitBadge: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  cardUnitText: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.5)' },
  cardBody: { backgroundColor: '#F9FAFB', borderRadius: 18, padding: 15, borderWidth: 2, borderColor: Colors.dark },
  stockRow: { flexDirection: 'row', alignItems: 'center' },
  stockItem: { flex: 1, alignItems: 'center' },
  stockDivider: { width: 2, height: 35, backgroundColor: Colors.dark, opacity: 0.1 },
  stockLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 4, letterSpacing: 0.5 },
  stockValue: { fontSize: 22, fontWeight: '900', color: Colors.dark },
  fab: { display: 'none' },
  fabIcon: { display: 'none' }
});
