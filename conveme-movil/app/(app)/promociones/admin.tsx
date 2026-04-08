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
import { getPromociones, deletePromocion } from '../../../src/services/promocion.service';
import { usePromocionStore } from '../../../src/store/promocionStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { Badge } from '../../../src/components/ui/Badge';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { parseGraphQLError, formatDate, formatCurrency } from '../../../src/utils';
import type { Promocion } from '../../../src/types';

function formatDescuento(promocion: Promocion): string {
  if (promocion.valor_descuento == null) return '';
  if (promocion.tipo_promocion === 'PORCENTAJE') {
    return `${promocion.valor_descuento}%`;
  }
  return formatCurrency(promocion.valor_descuento);
}

function PromocionCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Promocion;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        !item.activa && { opacity: 0.7 }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.activa ? Colors.success + '15' : Colors.dark + '10' }]}>
            <MaterialCommunityIcons 
                name={item.tipo_promocion === 'PORCENTAJE' ? "percent" : "cash-multiple"} 
                size={24} 
                color={item.activa ? Colors.success : Colors.dark} 
            />
        </View>
        <View style={styles.headerText}>
            <Text style={styles.cardName}>{item.nombre.toUpperCase()}</Text>
            <Text style={styles.cardTipo}>{item.tipo_promocion?.toUpperCase() || 'PROMOCIÓN'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.activa ? Colors.success + '22' : Colors.error + '22', borderColor: item.activa ? Colors.success : Colors.error }]}>
          <Text style={[styles.statusText, { color: item.activa ? Colors.success : Colors.error }]}>
            {item.activa ? 'ACTIVA' : 'INACTIVA'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
          <View style={styles.promoRow}>
              <View style={styles.promoItem}>
                  <Text style={styles.promoLabel}>DESCUENTO</Text>
                  <Text style={styles.promoValue}>{formatDescuento(item)}</Text>
              </View>
              <View style={styles.promoDivider} />
              <View style={styles.promoItem}>
                  <Text style={styles.promoLabel}>VIGENCIA</Text>
                  <Text style={styles.promoDates}>
                      {item.fecha_inicio ? formatDate(item.fecha_inicio).toUpperCase() : 'INICIO'} - {item.fecha_fin ? formatDate(item.fecha_fin).toUpperCase() : 'FIN'}
                  </Text>
              </View>
          </View>
      </View>

      <View style={styles.cardFooter}>
          <Text style={styles.footerAction}>GESTIONAR PROMO</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

export default function AdminPromocionesScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { promociones, setPromociones, removePromocion } = usePromocionStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPromociones();
      setPromociones(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setPromociones, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getPromociones();
      setPromociones(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [setPromociones, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return promociones;
    const q = search.toLowerCase();
    return promociones.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.tipo_promocion?.toLowerCase().includes(q)
    );
  }, [promociones, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deletePromocion(deleteId);
      removePromocion(deleteId);
      showToast('PROMOCIÓN ELIMINADA', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removePromocion, showToast]);

  const deleteTarget = promociones.find((p) => p.id_promocion === deleteId);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>PROMOS</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/promociones/create')} style={styles.addBtn}>
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
            placeholder="BUSCAR PROMOCIÓN..."
          />
        </View>

        {loading && promociones.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_promocion)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <PromocionCard
                item={item}
                onPress={() => router.push(`/(app)/promociones/${item.id_promocion}`)}
                onLongPress={() => setDeleteId(item.id_promocion)}
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
                icon="tag-multiple"
                title="SIN PROMOCIONES"
                message={search ? 'NO SE ENCONTRARON RESULTADOS.' : 'AÚN NO HAY PROMOS REGISTRADAS.'}
                actionLabel="CREAR PROMOCIÓN"
                onAction={() => router.push('/promociones/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="ELIMINAR PROMOCIÓN"
          message={`¿DESEAS ELIMINAR "${deleteTarget?.nombre.toUpperCase()}"?`}
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
  searchSection: { paddingHorizontal: 20, paddingBottom: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: 20, marginBottom: 18, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.1, elevation: 3 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 15 },
  iconContainer: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  headerText: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  cardTipo: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 8, fontWeight: '900' },
  cardBody: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  promoRow: { flexDirection: 'row', alignItems: 'center' },
  promoItem: { flex: 1, alignItems: 'center' },
  promoDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)' },
  promoLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  promoValue: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  promoDates: { fontSize: 10, fontWeight: '800', color: Colors.dark, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  footerAction: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },
});
