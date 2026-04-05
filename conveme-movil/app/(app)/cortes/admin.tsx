import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCortes, deleteCorte } from '../../../src/services/corte.service';
import { getAsignaciones, deleteAsignacion } from '../../../src/services/asignacion.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Badge } from '../../../src/components/ui/Badge';
import { ModalAsignacion } from '../../../src/components/ModalAsignacion';
import { ModalCorte } from '../../../src/components/ModalCorte';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Corte, Asignacion } from '../../../src/types';

type Tab = 'cortes' | 'asignaciones';
type SortDir = 'asc' | 'desc';

const ESTADO_BADGE: Record<string, 'success' | 'secondary' | 'warning'> = {
  Activa: 'success',
  Cerrada: 'secondary',
  Pendiente: 'warning',
};

// ─── Corte Card ────────────────────────────────────────────────────────────
function CorteCard({
  item,
  onDelete,
  isDark,
}: {
  item: Corte;
  onDelete: () => void;
  isDark: boolean;
}) {
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const diferencia = item.diferencia_corte ?? 0;
  const diferenciaColor =
    diferencia < 0 ? Colors.error : diferencia === 0 ? Colors.success : Colors.warning;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardId, { color: theme.muted }]}>Corte #{item.id_corte}</Text>
        <View style={styles.cardHeaderRight}>
          <Text style={[styles.cardDate, { color: theme.muted }]}>{formatDate(item.fecha_corte)}</Text>
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.cardVendedor, { color: theme.text }]}>
        {item.vendedor?.nombre_completo ?? 'Sin vendedor'}
      </Text>
      <View style={styles.amountsRow}>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: theme.muted }]}>Esperado</Text>
          <Text style={[styles.amountValue, { color: theme.text }]}>
            {formatCurrency(item.dinero_esperado ?? 0)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: theme.muted }]}>Entregado</Text>
          <Text style={[styles.amountValue, { color: theme.text }]}>
            {formatCurrency(item.dinero_total_entregado ?? 0)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: theme.muted }]}>Diferencia</Text>
          <Text style={[styles.amountValue, { color: diferenciaColor }]}>
            {formatCurrency(diferencia)}
          </Text>
        </View>
      </View>
      {item.observaciones ? (
        <Text style={[styles.cardMeta, { color: theme.muted }]} numberOfLines={1}>
          {item.observaciones}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Asignacion Card ────────────────────────────────────────────────────────
function AsignacionCard({
  item,
  onDelete,
  isDark,
}: {
  item: Asignacion;
  onDelete: () => void;
  isDark: boolean;
}) {
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const estado = item.estado ?? 'Pendiente';
  const itemCount = item.detalles?.length ?? 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardId, { color: theme.muted }]}>Asignacion #{item.id_asignacion}</Text>
        <View style={styles.cardHeaderRight}>
          <Badge text={estado} color={ESTADO_BADGE[estado] ?? 'secondary'} size="sm" />
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.cardVendedor, { color: theme.text }]}>
        {item.vendedor?.nombre_completo ?? 'Sin vendedor'}
      </Text>
      <View style={styles.cardFooterRow}>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>{formatDate(item.fecha_asignacion)}</Text>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>
          {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function CortesAdminScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [activeTab, setActiveTab] = useState<Tab>('cortes');

  // Cortes state
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [loadingCortes, setLoadingCortes] = useState(false);
  const [refreshingCortes, setRefreshingCortes] = useState(false);
  const [searchCortes, setSearchCortes] = useState('');
  const [deleteCorteId, setDeleteCorteId] = useState<number | null>(null);
  const [deletingCorte, setDeletingCorte] = useState(false);
  const [sortCorteField, setSortCorteField] = useState<'fecha_corte' | 'diferencia_corte'>('fecha_corte');
  const [sortCorteDir, setSortCorteDir] = useState<SortDir>('desc');

  // Asignaciones state
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loadingAsig, setLoadingAsig] = useState(false);
  const [refreshingAsig, setRefreshingAsig] = useState(false);
  const [searchAsig, setSearchAsig] = useState('');
  const [deleteAsigId, setDeleteAsigId] = useState<number | null>(null);
  const [deletingAsig, setDeletingAsig] = useState(false);

  // Modals
  const [showModalAsig, setShowModalAsig] = useState(false);
  const [showModalCorte, setShowModalCorte] = useState(false);

  const searchCorteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAsigTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchCortes = useCallback(async (q = '') => {
    setLoadingCortes(true);
    try {
      const data = await getCortes(q);
      setCortes(data);
    } catch (err) {
      Alert.alert('Error de conexion', parseGraphQLError(err));
    } finally {
      setLoadingCortes(false);
    }
  }, []);

  const fetchAsignaciones = useCallback(async (q = '') => {
    setLoadingAsig(true);
    try {
      const data = await getAsignaciones(q);
      setAsignaciones(data);
    } catch (err) {
      Alert.alert('Error de conexion', parseGraphQLError(err));
    } finally {
      setLoadingAsig(false);
    }
  }, []);

  useEffect(() => {
    fetchCortes('');
    fetchAsignaciones('');
  }, [fetchCortes, fetchAsignaciones]);

  // Search debounce
  useEffect(() => {
    if (searchCorteTimer.current) clearTimeout(searchCorteTimer.current);
    searchCorteTimer.current = setTimeout(() => fetchCortes(searchCortes), 300);
    return () => { if (searchCorteTimer.current) clearTimeout(searchCorteTimer.current); };
  }, [searchCortes, fetchCortes]);

  useEffect(() => {
    if (searchAsigTimer.current) clearTimeout(searchAsigTimer.current);
    searchAsigTimer.current = setTimeout(() => fetchAsignaciones(searchAsig), 300);
    return () => { if (searchAsigTimer.current) clearTimeout(searchAsigTimer.current); };
  }, [searchAsig, fetchAsignaciones]);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const sortedCortes = useMemo(() => {
    return [...cortes].sort((a, b) => {
      const aVal = (a as any)[sortCorteField] ?? '';
      const bVal = (b as any)[sortCorteField] ?? '';
      if (aVal < bVal) return sortCorteDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortCorteDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [cortes, sortCorteField, sortCorteDir]);

  const toggleSort = useCallback(
    (field: 'fecha_corte' | 'diferencia_corte') => {
      if (sortCorteField === field) {
        setSortCorteDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortCorteField(field);
        setSortCorteDir('desc');
      }
    },
    [sortCorteField],
  );

  // ── Delete handlers ────────────────────────────────────────────────────────
  const handleDeleteCorte = useCallback(async () => {
    if (deleteCorteId == null) return;
    setDeletingCorte(true);
    try {
      await deleteCorte(deleteCorteId);
      setCortes((prev) => prev.filter((c) => c.id_corte !== deleteCorteId));
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeletingCorte(false);
      setDeleteCorteId(null);
    }
  }, [deleteCorteId]);

  const handleDeleteAsig = useCallback(async () => {
    if (deleteAsigId == null) return;
    setDeletingAsig(true);
    try {
      await deleteAsignacion(deleteAsigId);
      setAsignaciones((prev) => prev.filter((a) => a.id_asignacion !== deleteAsigId));
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeletingAsig(false);
      setDeleteAsigId(null);
    }
  }, [deleteAsigId]);

  // ── Render ────────────────────────────────────────────────────────────────
  const SortIcon = ({ field }: { field: 'fecha_corte' | 'diferencia_corte' }) => (
    <MaterialCommunityIcons
      name={
        sortCorteField === field
          ? sortCorteDir === 'asc'
            ? 'sort-ascending'
            : 'sort-descending'
          : 'sort'
      }
      size={14}
      color={sortCorteField === field ? Colors.primary : theme.muted}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Page Header ── */}
      <View style={[styles.pageHeader, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Cortes y Asignaciones</Text>
          <Text style={[styles.pageSubtitle, { color: theme.muted }]}>
            Administra mercancia y conciliaciones
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: Colors.success }]}
            onPress={() => setShowModalAsig(true)}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={styles.headerBtnText}>Nueva Asignacion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: Colors.primary }]}
            onPress={() => setShowModalCorte(true)}
          >
            <MaterialCommunityIcons name="scale-balance" size={16} color="#fff" />
            <Text style={styles.headerBtnText}>Realizar Corte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cortes' && styles.tabActive]}
          onPress={() => setActiveTab('cortes')}
        >
          <MaterialCommunityIcons
            name="chart-bar"
            size={16}
            color={activeTab === 'cortes' ? Colors.primary : theme.muted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'cortes' ? Colors.primary : theme.muted },
              activeTab === 'cortes' && styles.tabLabelActive,
            ]}
          >
            Historial de Cortes
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: activeTab === 'cortes' ? Colors.primaryLight : theme.border }]}>
            <Text style={[styles.tabBadgeText, { color: activeTab === 'cortes' ? Colors.primary : theme.muted }]}>
              {cortes.length}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'asignaciones' && styles.tabActive]}
          onPress={() => setActiveTab('asignaciones')}
        >
          <MaterialCommunityIcons
            name="package-variant"
            size={16}
            color={activeTab === 'asignaciones' ? Colors.primary : theme.muted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'asignaciones' ? Colors.primary : theme.muted },
              activeTab === 'asignaciones' && styles.tabLabelActive,
            ]}
          >
            Mercancia en Ruta
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: activeTab === 'asignaciones' ? Colors.primaryLight : theme.border }]}>
            <Text style={[styles.tabBadgeText, { color: activeTab === 'asignaciones' ? Colors.primary : theme.muted }]}>
              {asignaciones.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {activeTab === 'cortes' ? (
        <View style={styles.content}>
          {/* Search + Sort */}
          <View style={styles.toolbarRow}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={theme.muted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Buscar corte..."
                placeholderTextColor={theme.muted}
                value={searchCortes}
                onChangeText={setSearchCortes}
              />
              {searchCortes ? (
                <TouchableOpacity onPress={() => setSearchCortes('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={theme.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.sortBtns}>
              <TouchableOpacity
                style={[styles.sortBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                onPress={() => toggleSort('fecha_corte')}
              >
                <SortIcon field="fecha_corte" />
                <Text style={[styles.sortBtnText, { color: theme.muted }]}>Fecha</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                onPress={() => toggleSort('diferencia_corte')}
              >
                <SortIcon field="diferencia_corte" />
                <Text style={[styles.sortBtnText, { color: theme.muted }]}>Dif.</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.counter, { color: theme.muted }]}>
            {sortedCortes.length} registros
          </Text>
          {loadingCortes ? (
            <LoadingSpinner />
          ) : (
            <FlatList
              data={sortedCortes}
              keyExtractor={(item) => String(item.id_corte)}
              renderItem={({ item }) => (
                <CorteCard
                  item={item}
                  onDelete={() => setDeleteCorteId(item.id_corte)}
                  isDark={isDark}
                />
              )}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingCortes}
                  onRefresh={async () => {
                    setRefreshingCortes(true);
                    await fetchCortes(searchCortes).finally(() => setRefreshingCortes(false));
                  }}
                  colors={[Colors.primary]}
                  tintColor={Colors.primary}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  icon="chart-bar"
                  title="Sin cortes"
                  message={searchCortes ? 'No coincide la busqueda.' : 'Aun no hay cortes registrados.'}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {/* Search */}
          <View style={styles.toolbarRow}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border, flex: 1 }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={theme.muted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Buscar asignacion..."
                placeholderTextColor={theme.muted}
                value={searchAsig}
                onChangeText={setSearchAsig}
              />
              {searchAsig ? (
                <TouchableOpacity onPress={() => setSearchAsig('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={theme.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <Text style={[styles.counter, { color: theme.muted }]}>
            {asignaciones.length} registros
          </Text>
          {loadingAsig ? (
            <LoadingSpinner />
          ) : (
            <FlatList
              data={asignaciones}
              keyExtractor={(item) => String(item.id_asignacion)}
              renderItem={({ item }) => (
                <AsignacionCard
                  item={item}
                  onDelete={() => setDeleteAsigId(item.id_asignacion)}
                  isDark={isDark}
                />
              )}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingAsig}
                  onRefresh={async () => {
                    setRefreshingAsig(true);
                    await fetchAsignaciones(searchAsig).finally(() => setRefreshingAsig(false));
                  }}
                  colors={[Colors.primary]}
                  tintColor={Colors.primary}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  icon="package-variant"
                  title="Sin asignaciones"
                  message={searchAsig ? 'No coincide la busqueda.' : 'Aun no hay asignaciones registradas.'}
                  actionLabel="Nueva Asignacion"
                  onAction={() => setShowModalAsig(true)}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* ── Modals ── */}
      <ModalAsignacion
        visible={showModalAsig}
        onClose={() => setShowModalAsig(false)}
        onSuccess={() => {
          setShowModalAsig(false);
          fetchAsignaciones(searchAsig);
          Alert.alert('Listo', 'Asignacion creada exitosamente');
        }}
      />
      <ModalCorte
        visible={showModalCorte}
        onClose={() => setShowModalCorte(false)}
        onSuccess={() => {
          setShowModalCorte(false);
          fetchCortes(searchCortes);
          fetchAsignaciones(searchAsig);
          Alert.alert('Listo', 'Corte realizado correctamente');
        }}
      />

      {/* ── Confirm Dialogs ── */}
      <ConfirmDialog
        visible={deleteCorteId !== null}
        title="Eliminar corte"
        message="¿Deseas eliminar este corte? Esta accion no se puede deshacer."
        onConfirm={handleDeleteCorte}
        onCancel={() => setDeleteCorteId(null)}
        confirmText={deletingCorte ? 'Eliminando...' : 'Eliminar'}
        destructive
      />
      <ConfirmDialog
        visible={deleteAsigId !== null}
        title="Eliminar asignacion"
        message="¿Deseas eliminar esta asignacion? Esta accion no se puede deshacer."
        onConfirm={handleDeleteAsig}
        onCancel={() => setDeleteAsigId(null)}
        confirmText={deletingAsig ? 'Eliminando...' : 'Eliminar'}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  pageTitle: { ...Typography.h3 },
  pageSubtitle: { ...Typography.caption },
  headerActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  headerBtnText: { ...Typography.buttonSmall, color: '#fff' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabLabel: { ...Typography.bodySmall },
  tabLabelActive: { fontWeight: '600' },
  tabBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },
  content: { flex: 1, paddingTop: Spacing.sm },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  searchInput: { flex: 1, ...Typography.bodySmall },
  sortBtns: { flexDirection: 'row', gap: Spacing.xs },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  sortBtnText: { ...Typography.caption },
  counter: { ...Typography.caption, paddingHorizontal: Spacing.md, marginBottom: Spacing.xs },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardId: { ...Typography.caption },
  cardDate: { ...Typography.caption },
  deleteBtn: { padding: 2 },
  cardVendedor: { ...Typography.body, fontWeight: '500' },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amountItem: { alignItems: 'center', flex: 1 },
  amountLabel: { ...Typography.caption, marginBottom: 2 },
  amountValue: { ...Typography.caption, fontWeight: '700' },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { ...Typography.caption },
});
