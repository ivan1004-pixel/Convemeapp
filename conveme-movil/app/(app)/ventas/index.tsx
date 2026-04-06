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
import { getCortes } from '../../../src/services/corte.service';
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
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import { BarChart } from '../../../src/components/ui/BarChart';
import type { Venta, Corte } from '../../../src/types';

function VentaCard({ item, onPress, onLongPress }: { item: Venta; onPress: () => void; onLongPress: () => void }) {
  return (
    <Pressable 
        onPress={onPress} 
        onLongPress={onLongPress} 
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.idBadge}><Text style={styles.cardId}>#{item.id_venta}</Text></View>
        <Badge text={item.estado || 'Completada'} color="success" size="sm" />
      </View>
      <Text style={styles.cardAmount}>{formatCurrency(item.monto_total)}</Text>
      <View style={styles.infoBox}>
        <Text style={styles.label}>VENDEDOR</Text>
        <Text style={styles.value}>{item.vendedor?.nombre_completo || 'N/A'}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.footerDate}>{formatDate(item.fecha_venta)}</Text>
        <Text style={styles.footerMeta}>{item.metodo_pago?.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

export default function VentasScreen() {
  const { toast, show, hide } = useToast();
  const { ventas, setVentas, removeVenta } = useVentaStore();
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showVendorAnalytics, setShowVendorAnalytics] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vData, cData] = await Promise.all([getVentas(), getCortes()]);
      setVentas(vData);
      setCortes(cData);
    } catch (err) { show(parseGraphQLError(err), 'error'); }
    finally { setLoading(false); }
  }, [setVentas, show]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const vendorData = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach(v => { const n = v.vendedor?.nombre_completo || 'N/A'; map[n] = (map[n]||0) + v.monto_total; });
    cortes.forEach(c => { const n = c.vendedor?.nombre_completo || 'N/A'; map[n] = (map[n]||0) + (c.dinero_total_entregado||0); });
    return Object.entries(map).map(([label, value]) => ({ label: label.substring(0,8), value }));
  }, [ventas, cortes]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.header}>
          <Text style={styles.title}>Ventas</Text>
          <TouchableOpacity onPress={() => setShowVendorAnalytics(true)} style={styles.analyticsBtn}>
            <MaterialCommunityIcons name="chart-bar" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={ventas.filter(v => v.vendedor?.nombre_completo?.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={item => String(item.id_venta)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<SearchBar value={search} onChangeText={setSearch} placeholder="Buscar vendedor..." style={{marginBottom: 30}} />}
          renderItem={({ item }) => (
            <VentaCard 
                item={item} 
                onPress={() => router.push(`/(app)/ventas/${item.id_venta}`)} 
                onLongPress={() => {}} 
            />
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={Colors.primary} />}
        />

        <Modal visible={showVendorAnalytics} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Rendimiento Total</Text>
                    <BarChart data={vendorData} color={Colors.success} />
                    <Button title="CERRAR" onPress={() => setShowVendorAnalytics(false)} style={{marginTop: 20}} />
                </View>
            </View>
        </Modal>

        <TouchableOpacity style={styles.fab} onPress={() => router.push('/ventas/create')}><Text style={styles.fabIcon}>+</Text></TouchableOpacity>
      </SafeAreaView>
      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '900' },
  analyticsBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 150 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, elevation: 0 },
  cardPressed: { transform: [{translateY: 2}, {translateX: 2}], shadowOffset: {width: 2, height: 2} },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  idBadge: { backgroundColor: Colors.beige, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: Colors.dark },
  cardId: { fontSize: 10, fontWeight: '900' },
  cardAmount: { fontSize: 28, fontWeight: '900', marginBottom: 15 },
  infoBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  label: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  footerDate: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.4)' },
  footerMeta: { fontSize: 11, fontWeight: '900', color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.beige, borderRadius: 24, padding: 25, borderWidth: 4, borderColor: Colors.dark },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1 },
  fabIcon: { fontSize: 32, color: '#FFF', fontWeight: '900' }
});
