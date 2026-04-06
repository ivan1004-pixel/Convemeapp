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
import { getCortes, deleteCorte } from '../../../src/services/corte.service';
import { useCorteStore } from '../../../src/store/corteStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError, formatDate, formatCurrency } from '../../../src/utils';
import type { Corte } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

function CorteCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Corte;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const diff = item.diferencia_corte || 0;
  const isOk = Math.abs(diff) < 0.01;

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
          <MaterialCommunityIcons name="cash-register" size={32} color={Colors.success} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardName}>{item.vendedor?.nombre_completo || 'Sin vendedor'}</Text>
          <Text style={styles.cardMeta}>CORTE #{item.id_corte} • ASIG #{item.asignacion?.id_asignacion}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isOk ? Colors.success + '22' : Colors.error + '22' }]}>
          <Text style={[styles.statusText, { color: isOk ? Colors.success : Colors.error }]}>
            {isOk ? 'CUADRADO' : 'CON DIF.'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.moneyRow}>
            <View style={styles.moneyItem}>
                <Text style={styles.moneyLabel}>ESPERADO</Text>
                <Text style={styles.moneyValue}>{formatCurrency(item.dinero_expected || item.dinero_esperado || 0)}</Text>
            </View>
            <View style={styles.moneyDivider} />
            <View style={styles.moneyItem}>
                <Text style={styles.moneyLabel}>ENTREGADO</Text>
                <Text style={styles.moneyValue}>{formatCurrency(item.dinero_total_entregado || 0)}</Text>
            </View>
        </View>

        {!isOk && (
            <View style={styles.diffAlert}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.diffText}>
                    Diferencia: <Text style={{fontWeight: '900'}}>{formatCurrency(diff)}</Text>
                </Text>
            </View>
        )}

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-outline" size={16} color="rgba(26,26,26,0.5)" />
          <Text style={styles.infoText}>{formatDate(item.fecha_corte)}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
         <Text style={styles.footerAction}>VER DETALLES DEL CORTE</Text>
         <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.success} />
      </View>
    </Pressable>
  );
}

export default function CortesScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { cortes, setCortes, removeCorte } = useCorteStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const data = await getCortes(q);
      setCortes(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setCortes, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getCortes(search);
      setCortes(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [search, setCortes, showToast]);

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
      await deleteCorte(deleteId);
      removeCorte(deleteId);
      showToast('Corte eliminado correctamente', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeCorte, showToast]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)/mas')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Cortes</Text>
                    <Text style={styles.subtitle}>{cortes.length} registros</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/cortes/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="BUSCAR POR VENDEDOR..."
          />
        </View>

        {loading && cortes.length === 0 ? (
          <LoadingSpinner message="Cargando cortes..." />
        ) : (
          <FlatList
            data={cortes}
            keyExtractor={(item) => String(item.id_corte)}
            contentContainerStyle={[
              styles.listContent,
              cortes.length === 0 && styles.listEmpty,
            ]}
            renderItem={({ item }) => (
              <CorteCard
                item={item}
                onPress={() => router.push(`/cortes/${item.id_corte}`)}
                onLongPress={() => setDeleteId(item.id_corte)}
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
                icon="cash-register"
                title="SIN CORTES"
                message={search ? 'No hay resultados.' : 'Aún no hay cortes registrados.'}
                actionLabel="REALIZAR CORTE"
                onAction={() => router.push('/cortes/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="Eliminar corte"
          message={`¿Deseas eliminar el corte #${deleteId}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
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
  title: { fontSize: 24, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.success + '15', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  headerInfo: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  cardMeta: { fontSize: 10, fontWeight: '700', color: 'rgba(26,26,26,0.4)', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontSize: 9, fontWeight: '900' },
  cardContent: { gap: Spacing.sm, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  moneyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.xs },
  moneyItem: { flex: 1, alignItems: 'center' },
  moneyDivider: { width: 1, height: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
  moneyLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  moneyValue: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  diffAlert: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  diffText: { fontSize: 12, fontWeight: '700', color: Colors.error },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { fontSize: 13, fontWeight: '600', color: 'rgba(26,26,26,0.6)' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: Spacing.sm, gap: 4 },
  footerAction: { fontSize: 12, fontWeight: '800', color: Colors.success },
  fab: { display: 'none' },
  fabIcon: { display: 'none' },
});