import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getVentas } from '../../../src/services/venta.service';
import { getCortes } from '../../../src/services/corte.service';
import { useVentaStore } from '../../../src/store/ventaStore';
import { Colors } from '../../../src/theme/colors';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import { BarChart } from '../../../src/components/ui/BarChart';
import { useAuth } from '../../../src/hooks/useAuth';
import type { Venta, Corte } from '../../../src/types';

function VentaCard({ item, onPress }: { item: Venta; onPress: () => void }) {
  return (
    <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.idBadge}><Text style={styles.cardId}>#{item.id_venta}</Text></View>
        <Badge text={item.estado || 'Completada'} color="success" size="sm" />
      </View>
      <Text style={styles.cardAmount}>{formatCurrency(item.monto_total)}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.footerDate}>{formatDate(item.fecha_venta)}</Text>
        <Text style={styles.footerMeta}>{item.metodo_pago?.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

export default function VendedorVentasScreen() {
  const { usuario } = useAuth();
  const { toast, show, hide } = useToast();
  const { ventas, setVentas } = useVentaStore();
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const TAKE = 20;

  const fetchData = useCallback(async (isRefresh = true) => {
    if (isRefresh) {
        setLoading(true);
        setHasMore(true);
    } else {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
    }

    try {
      const skip = isRefresh ? 0 : ventas.length;
      // Note: getCortes doesn't have pagination yet, keeping it as is for now
      const [vData, cData] = await Promise.all([
          getVentas(skip, TAKE), 
          isRefresh ? getCortes() : Promise.resolve(cortes)
      ]);
      
      if (vData.length < TAKE) {
        setHasMore(false);
      }

      if (isRefresh) {
        setVentas(vData);
        setCortes(cData);
      } else {
        setVentas([...ventas, ...vData]);
      }
    } catch (err) { 
        show(parseGraphQLError(err), 'error'); 
    } finally { 
        setLoading(false); 
        setLoadingMore(false);
    }
  }, [usuario, setVentas, show, ventas.length, hasMore, loadingMore, cortes]);

  const onRefresh = () => fetchData(true);
  const onEndReached = () => fetchData(false);

  useEffect(() => { 
    if (ventas.length === 0) {
        fetchData(true); 
    }
  }, []);

  const filteredVentas = useMemo(() => {
    return ventas.filter(v => 
        v.id_venta.toString().includes(search)
    );
  }, [ventas, search]);

  const performanceData = useMemo(() => {
    let total = 0;
    ventas.forEach(v => { total += v.monto_total; });
    
    return [
        { label: 'VENTAS', value: total },
        { label: 'META', value: 5000 } // Ejemplo de meta
    ];
  }, [ventas]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={{flex: 1}} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Mis Ventas</Text>
                    <Text style={styles.subtitle}>{filteredVentas.length} transacciones</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => setShowAnalytics(true)} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="chart-line" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/ventas/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <FlatList
          data={filteredVentas}
          keyExtractor={(item, index) => `${item.id_venta}-${index}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SearchBar 
              value={search} 
              onChangeText={setSearch} 
              placeholder="Buscar por ID de venta..." 
              style={{marginBottom: 30}} 
            />
          }
          renderItem={({ item }) => (
            <VentaCard 
                item={item} 
                onPress={() => router.push(`/(app)/ventas/${item.id_venta}`)} 
            />
          )}
          refreshControl={<RefreshControl refreshing={loading && ventas.length > 0} onRefresh={onRefresh} tintColor={Colors.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
                <View style={styles.footerLoading}>
                    <ActivityIndicator color={Colors.primary} />
                </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState 
                icon="cash-register" 
                title="Sin ventas" 
                message="Aún no has registrado ventas hoy."
                actionLabel="REGISTRAR VENTA"
                onAction={() => router.push('/ventas/create')}
            />
          }
        />

        <Modal visible={showAnalytics} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Mi Rendimiento</Text>
                    <BarChart data={performanceData} color={Colors.primary} />
                    <View style={styles.statsSummary}>
                        <Text style={styles.statLabel}>TOTAL ACUMULADO</Text>
                        <Text style={styles.statValue}>{formatCurrency(performanceData[0].value)}</Text>
                    </View>
                    <Button title="CERRAR" onPress={() => setShowAnalytics(false)} style={{marginTop: 20}} />
                </View>
            </View>
        </Modal>
      </SafeAreaView>
      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActions: { flexDirection: 'row', gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 150 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, elevation: 0 },
  cardPressed: { transform: [{translateY: 2}, {translateX: 2}], shadowOffset: {width: 2, height: 2} },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  idBadge: { backgroundColor: Colors.beige, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: Colors.dark },
  cardId: { fontSize: 10, fontWeight: '900' },
  cardAmount: { fontSize: 28, fontWeight: '900', marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  footerDate: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.4)' },
  footerMeta: { fontSize: 11, fontWeight: '900', color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.beige, borderRadius: 24, padding: 25, borderWidth: 4, borderColor: Colors.dark },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  statsSummary: { marginTop: 20, padding: 15, backgroundColor: '#FFF', borderRadius: 15, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 5 },
  statValue: { fontSize: 24, fontWeight: '900', color: Colors.primary },
  footerLoading: { paddingVertical: 20, alignItems: 'center' },
});
