import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCortes, deleteCorte } from '../../../src/services/corte.service';
import { useCorteStore } from '../../../src/store/corteStore';
import { Colors } from '../../../src/theme/colors';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError, formatDate, formatCurrency } from '../../../src/utils';
import type { Corte } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { useAuth } from '../../../src/hooks/useAuth';

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

  const handleShare = async () => {
    try {
      const message = `--NoManchesMx--\n` +
                      `RESUMEN DE CORTE #${item.id_corte}\n` +
                      `VENDEDOR: ${item.vendedor?.nombre_completo?.toUpperCase()}\n` +
                      `FECHA: ${formatDate(item.fecha_corte)}\n` +
                      `ESPERADO: ${formatCurrency(item.dinero_expected || item.dinero_esperado || 0)}\n` +
                      `ENTREGADO: ${formatCurrency(item.dinero_total_entregado || 0)}\n` +
                      `DIFERENCIA: ${formatCurrency(diff)}\n` +
                      `ESTADO: ${isOk ? 'CUADRADO' : 'CON DIFERENCIA'}\n\n` +
                      `nos vemos nomancherito`;
      await Share.share({ message });
    } catch (error) { console.error(error); }
  };

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
          <MaterialCommunityIcons name="cash-register" size={28} color={Colors.success} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardName}>{item.vendedor?.nombre_completo?.toUpperCase() || 'SIN VENDEDOR'}</Text>
          <Text style={styles.cardMeta}>CORTE #{item.id_corte} • ASIG #{item.asignacion?.id_asignacion}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isOk ? Colors.success + '22' : Colors.error + '22', borderColor: isOk ? Colors.success : Colors.error }]}>
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
                <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.diffText}>
                    DIFERENCIA: <Text style={{fontWeight: '900'}}>{formatCurrency(diff)}</Text>
                </Text>
            </View>
        )}

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{formatDate(item.fecha_corte).toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
         <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <MaterialCommunityIcons name="share-variant" size={18} color={Colors.primary} />
            <Text style={styles.shareText}>COMPARTIR</Text>
         </TouchableOpacity>
         <View style={styles.footerActionRow}>
            <Text style={styles.footerAction}>VER DETALLES</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.success} />
         </View>
      </View>
    </Pressable>
  );
}

export default function CortesScreen() {
  const { usuario, isAdmin } = useAuth();
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

  const filteredCortes = useMemo(() => {
    let list = cortes;
    if (!isAdmin) {
      list = cortes.filter(c => 
        c.vendedor?.id_vendedor === usuario?.id_vendedor || 
        c.id_vendedor === usuario?.id_vendedor
      );
    }
    return list.filter(c => 
      c.vendedor?.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
      c.id_corte.toString().includes(search)
    );
  }, [cortes, isAdmin, usuario, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteCorte(deleteId);
      removeCorte(deleteId);
      showToast('CORTE ELIMINADO', 'success');
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
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>CORTES</Text>
                    <Text style={styles.subtitle}>{filteredCortes.length} REGISTROS</Text>
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

        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={isAdmin ? "BUSCAR POR VENDEDOR..." : "BUSCAR POR ID DE CORTE..."}
          />
        </View>

        {loading && cortes.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO..." />
        ) : (
          <FlatList
            data={filteredCortes}
            keyExtractor={(item) => String(item.id_corte)}
            contentContainerStyle={[
              styles.listContent,
              filteredCortes.length === 0 && styles.listEmpty,
            ]}
            renderItem={({ item }) => (
              <CorteCard
                item={item}
                onPress={() => router.push(`/cortes/${item.id_corte}`)}
                onLongPress={() => isAdmin && setDeleteId(item.id_corte)}
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
                message={search ? 'No hay resultados que coincidan.' : 'Aún no hay cortes registrados.'}
                actionLabel="REALIZAR CORTE"
                onAction={() => router.push('/cortes/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="ELIMINAR CORTE"
          message={`¿DESEAS ELIMINAR EL CORTE #${deleteId}?`}
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
  avatarContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.success + '10', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  headerInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  cardMeta: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 8, fontWeight: '900' },
  cardContent: { gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12, paddingBottom: 12 },
  moneyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  moneyItem: { flex: 1, alignItems: 'center' },
  moneyDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)' },
  moneyLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  moneyValue: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  diffAlert: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.error + '10', padding: 8, borderRadius: 8 },
  diffText: { fontSize: 10, fontWeight: '800', color: Colors.error },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.5)' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  shareText: { fontSize: 9, fontWeight: '900', color: Colors.primary },
  footerActionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerAction: { fontSize: 10, fontWeight: '900', color: Colors.success, letterSpacing: 0.5 },
});
