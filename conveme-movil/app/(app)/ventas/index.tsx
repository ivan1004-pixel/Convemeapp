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
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getVentas, deleteVenta } from '../../../src/services/venta.service';
import { useVentaStore } from '../../../src/store/ventaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import { PredictionChart } from '../../../src/components/PredictionChart';
import type { Venta } from '../../../src/types';

const ESTADO_BADGE: Record<string, 'warning' | 'success' | 'error' | 'primary'> = {
  Pendiente: 'warning',
  Completada: 'success',
  Cancelada: 'error',
};

function VentaCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Venta;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const textPrimary = '#1A1A1A';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        indexStyles.card,
        { backgroundColor: '#FFFFFF' },
        pressed && indexStyles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={indexStyles.cardHeader}>
        <View style={[indexStyles.idBadge, { backgroundColor: Colors.pink + '20', borderColor: Colors.pink }]}>
          <Text style={[indexStyles.cardId, { color: Colors.pink, fontWeight: '900' }]}>#{item.id_venta}</Text>
        </View>
        <Badge
          text={item.estado ?? 'Pendiente'}
          color={ESTADO_BADGE[item.estado ?? 'Pendiente'] ?? 'secondary'}
          size="sm"
        />
      </View>

      <View style={indexStyles.amountContainer}>
        <Text style={[indexStyles.cardAmount, { color: '#1A1A1A' }]}>
          {formatCurrency(item.monto_total)}
        </Text>
      </View>

      <View style={indexStyles.cardRow}>
        <View style={indexStyles.infoBox}>
          <Text style={indexStyles.cardLabelText}>VENDEDOR</Text>
          <Text style={[indexStyles.cardValueText, { color: textPrimary }]}>
            {item.vendedor?.nombre_completo ?? 'Sin vendedor'}
          </Text>
        </View>
      </View>

      {item.cliente && (
        <View style={[indexStyles.infoBox, { marginTop: Spacing.xs, backgroundColor: Colors.blue + '05' }]}>
          <Text style={indexStyles.cardLabelText}>CLIENTE</Text>
          <Text style={[indexStyles.cardValueText, { color: textPrimary }]}>
            {item.cliente.nombre_completo}
          </Text>
        </View>
      )}

      <View style={indexStyles.cardFooter}>
        <View style={indexStyles.metaItem}>
          <MaterialCommunityIcons name="calendar-month" size={14} color="rgba(26,26,26,0.6)" />
          <Text style={[indexStyles.cardMetaText, { color: 'rgba(26,26,26,0.6)', marginLeft: 4 }]}>
            {formatDate(item.fecha_venta)}
          </Text>
        </View>
        {item.metodo_pago && (
          <View style={indexStyles.metaItem}>
            <MaterialCommunityIcons
              name={
                item.metodo_pago.toLowerCase() === 'efectivo'
                  ? 'cash'
                  : item.metodo_pago.toLowerCase() === 'transferencia'
                  ? 'bank-transfer'
                  : 'credit-card'
              }
              size={14}
              color={Colors.blue}
            />
            <Text style={[indexStyles.cardMetaText, { color: Colors.blue, fontWeight: '700', marginLeft: 4 }]}>
              {item.metodo_pago.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function VentasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textPrimary = isDark ? '#FFFFFF' : '#1A1A1A';

  const { toast, show, hide } = useToast();
  const { ventas, setVentas, removeVenta } = useVentaStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showVendorAnalytics, setShowVendorAnalytics] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVentas();
      setVentas(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setVentas]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getVentas();
      setVentas(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [setVentas]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ventas;
    const q = search.toLowerCase();
    return ventas.filter(
      (v) =>
        v.vendedor?.nombre_completo?.toLowerCase().includes(q) ||
        String(v.id_venta).includes(q) ||
        v.estado?.toLowerCase().includes(q)
    );
  }, [ventas, search]);

  const chartData = useMemo(() => {
    const salesByMonth: Record<string, number> = {};
    ventas.forEach((v: any) => {
      const d = new Date(v.fecha_venta);
      const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      salesByMonth[mKey] = (salesByMonth[mKey] || 0) + v.monto_total;
    });

    return Object.keys(salesByMonth)
      .sort()
      .slice(-6)
      .map(key => ({
        label: key.split('-')[1],
        value: salesByMonth[key]
      }));
  }, [ventas]);

  // Cálculo de ventas por vendedor para el nuevo gráfico
  const vendorSalesData = useMemo(() => {
    const vendorMap: Record<string, number> = {};
    ventas.forEach((v: any) => {
        const name = v.vendedor?.nombre_completo || 'Desconocido';
        vendorMap[name] = (vendorMap[name] || 0) + v.monto_total;
    });
    
    return Object.keys(vendorMap).map(name => ({
        label: name.substring(0, 8), // Recortamos para que quepa
        value: vendorMap[name]
    })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [ventas]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteVenta(deleteId);
      removeVenta(deleteId);
      show('Venta eliminada correctamente', 'success');
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeVenta]);

  const listHeader = () => (
    <View style={indexStyles.listHeader}>
        {chartData.length > 0 && (
            <View style={indexStyles.analyticsCard}>
                <View style={indexStyles.analyticsHeader}>
                    <Text style={indexStyles.analyticsTitle}>Rendimiento Mensual</Text>
                    <TouchableOpacity onPress={() => setShowVendorAnalytics(true)} style={indexStyles.vendorBtn}>
                        <MaterialCommunityIcons name="account-group" size={20} color={Colors.primary} />
                        <Text style={indexStyles.vendorBtnText}>VENDEDORES</Text>
                    </TouchableOpacity>
                </View>
                <PredictionChart data={chartData} />
            </View>
        )}
        <View style={indexStyles.searchContainer}>
            <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar por vendedor, estado..."
            />
        </View>
    </View>
  );

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={[indexStyles.container, { backgroundColor: 'transparent' }]}>
        <View style={indexStyles.header}>
          <Text style={[indexStyles.title, { color: textPrimary }]}>Ventas</Text>
          <Text style={[indexStyles.count, { color: 'rgba(26,26,26,0.6)' }]}>{filtered.length} registros</Text>
        </View>

        {loading && ventas.length === 0 ? (
          <LoadingSpinner fullScreen message="Cargando ventas..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_venta)}
            contentContainerStyle={[
              indexStyles.listContent,
              filtered.length === 0 && indexStyles.listEmpty,
            ]}
            ListHeaderComponent={listHeader}
            renderItem={({ item }) => (
              <VentaCard
                item={item}
                onPress={() => router.push(`/ventas/${item.id_venta}`)}
                onLongPress={() => setDeleteId(item.id_venta)}
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
                icon="cash-multiple"
                title="Sin ventas"
                message={
                  search ? 'No hay ventas que coincidan con tu búsqueda.' : 'Aún no hay ventas registradas.'
                }
                actionLabel={!search ? 'Registrar venta' : undefined}
                onAction={!search ? () => router.push('/ventas/create') : undefined}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Modal de Analíticas por Vendedor */}
        <Modal visible={showVendorAnalytics} transparent animationType="fade">
            <View style={indexStyles.modalOverlay}>
                <View style={indexStyles.modalContent}>
                    <View style={indexStyles.modalHeader}>
                        <Text style={indexStyles.modalTitle}>Ventas por Vendedor</Text>
                        <TouchableOpacity onPress={() => setShowVendorAnalytics(false)}>
                            <MaterialCommunityIcons name="close-thick" size={24} color={Colors.dark} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={{ maxHeight: 400 }}>
                        <PredictionChart data={vendorSalesData} />
                        
                        <View style={indexStyles.vendorStatsList}>
                            {vendorSalesData.map((v, i) => (
                                <View key={i} style={indexStyles.vendorStatRow}>
                                    <Text style={indexStyles.vendorStatName}>{v.label}</Text>
                                    <Text style={indexStyles.vendorStatValue}>{formatCurrency(v.value)}</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                    
                    <Button 
                        title="CERRAR VENTANA" 
                        onPress={() => setShowVendorAnalytics(false)} 
                        style={{ marginTop: 20 }}
                    />
                </View>
            </View>
        </Modal>

        <TouchableOpacity
          style={[indexStyles.fab, Shadows.lg]}
          onPress={() => router.push('/ventas/create')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Nueva venta"
        >
          <Text style={indexStyles.fabIcon}>+</Text>
        </TouchableOpacity>

        <ConfirmDialog
          visible={deleteId !== null}
          title="Eliminar venta"
          message={`¿Deseas eliminar la venta #${deleteId}? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
          destructive
        />

        <Toast
          visible={toast.visible}
          type={toast.type}
          message={toast.message}
          onHide={hide}
        />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const indexStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { ...Typography.h3, fontWeight: '900' },
  count: { ...Typography.bodySmall, fontWeight: '700' },
  searchContainer: { paddingHorizontal: 0, paddingBottom: Spacing.md },
  listHeader: { paddingHorizontal: Spacing.lg },
  listContent: { paddingBottom: Spacing.xxl + Spacing.xl },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: { borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  idBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, borderWidth: 1.5 },
  cardId: { fontSize: 12, fontWeight: '800' },
  amountContainer: { marginBottom: Spacing.md },
  cardAmount: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  infoBox: { backgroundColor: 'rgba(26,26,26,0.03)', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: 'rgba(26,26,26,0.05)' },
  cardLabelText: { fontSize: 10, fontWeight: '900', color: 'rgba(26,26,26,0.5)', letterSpacing: 1, marginBottom: 2 },
  cardValueText: { fontSize: 14, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(26,26,26,0.1)' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  cardMetaText: { fontSize: 11, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 90, right: Spacing.lg, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, zIndex: 999 },
  fabIcon: { fontSize: 32, color: '#ffffff', fontWeight: '900' },
  analyticsCard: { backgroundColor: '#FFF', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 3, borderColor: Colors.dark, marginBottom: Spacing.lg, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  analyticsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  analyticsTitle: { ...Typography.h4, fontWeight: '900' },
  vendorBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary },
  vendorBtnText: { fontSize: 9, fontWeight: '900', color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.beige, width: '100%', borderRadius: BorderRadius.xxl, padding: Spacing.lg, borderWidth: 4, borderColor: Colors.dark, shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  vendorStatsList: { marginTop: 20, gap: 10 },
  vendorStatRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 2, borderColor: Colors.dark },
  vendorStatName: { fontWeight: '800', fontSize: 13 },
  vendorStatValue: { fontWeight: '900', color: Colors.success, fontSize: 13 },
});
