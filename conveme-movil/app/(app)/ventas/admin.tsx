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

import { useAuth } from '../../../src/hooks/useAuth';

export default function VentasScreen() {
  const { usuario, isAdmin } = useAuth();
  const { toast, show, hide } = useToast();
  const { ventas, setVentas, removeVenta } = useVentaStore();
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showVendorAnalytics, setShowVendorAnalytics] = useState(false);

  // Filtrar ventas según el rol
  const filteredVentas = useMemo(() => {
    let list = ventas;
    if (!isAdmin) {
      list = ventas.filter(v => 
        v.vendedor?.id_vendedor === usuario?.id_vendedor || 
        v.id_vendedor === usuario?.id_vendedor
      );
    }
    return list.filter(v => 
        v.vendedor?.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
        v.id_venta.toString().includes(search)
    );
  }, [ventas, isAdmin, usuario, search]);

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
    
    // Filtrar datos para la gráfica de manera estricta
    const ventasGrafica = isAdmin ? ventas : ventas.filter(v => 
      v.vendedor?.id_vendedor === usuario?.id_vendedor || 
      v.id_vendedor === usuario?.id_vendedor
    );
    const cortesGrafica = isAdmin ? cortes : cortes.filter(c => 
      c.vendedor?.id_vendedor === usuario?.id_vendedor || 
      c.id_vendedor === usuario?.id_vendedor
    );

    ventasGrafica.forEach(v => { 
        const n = v.vendedor?.nombre_completo || v.vendedor?.username || 'MI RENDIMIENTO'; 
        map[n] = (map[n]||0) + v.monto_total; 
    });
    cortesGrafica.forEach(c => { 
        const n = c.vendedor?.nombre_completo || c.vendedor?.username || 'MI RENDIMIENTO'; 
        map[n] = (map[n]||0) + (c.dinero_total_entregado||0); 
    });
    
    // Si no es admin y el mapa está vacío, mostrar al menos una barra en cero con su nombre
    if (!isAdmin && Object.keys(map).length === 0) {
        map[usuario?.username || 'YO'] = 0;
    }

    return Object.entries(map).map(([label, value]) => ({ label: label.substring(0,8).toUpperCase(), value }));
  }, [ventas, cortes, isAdmin, usuario]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={{flex: 1}} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Ventas</Text>
                    <Text style={styles.subtitle}>{filteredVentas.length} transacciones</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                {isAdmin && (
                  <TouchableOpacity onPress={() => setShowVendorAnalytics(true)} style={styles.refreshBtn}>
                      <MaterialCommunityIcons name="chart-bar" size={24} color={Colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => router.push('/ventas/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <FlatList
          data={filteredVentas}
          keyExtractor={item => String(item.id_venta)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SearchBar 
              value={search} 
              onChangeText={setSearch} 
              placeholder={isAdmin ? "Buscar vendedor..." : "Buscar por ID de venta..."} 
              style={{marginBottom: 30}} 
            />
          }
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
                    <Text style={styles.modalTitle}>{isAdmin ? 'Rendimiento por Vendedor' : 'Mi Rendimiento Total'}</Text>
                    <BarChart data={vendorData} color={Colors.success} />
                    <Button title="CERRAR" onPress={() => setShowVendorAnalytics(false)} style={{marginTop: 20}} />
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
  infoBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  label: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  footerDate: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.4)' },
  footerMeta: { fontSize: 11, fontWeight: '900', color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.beige, borderRadius: 24, padding: 25, borderWidth: 4, borderColor: Colors.dark },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
});
