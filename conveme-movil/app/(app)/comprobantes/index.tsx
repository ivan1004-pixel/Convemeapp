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
import { getComprobantes } from '../../../src/services/comprobante.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { Badge } from '../../../src/components/ui/Badge';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Comprobante } from '../../../src/types';

function ComprobanteCard({
  item,
  onPress,
}: {
  item: Comprobante;
  onPress: () => void;
}) {
  const isPendiente = (item.saldo_pendiente ?? 0) > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        !isPendiente && { borderColor: Colors.success }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: isPendiente ? Colors.warning + '15' : Colors.success + '15' }]}>
            <MaterialCommunityIcons 
                name="file-document-outline" 
                size={24} 
                color={isPendiente ? Colors.warning : Colors.success} 
            />
        </View>
        <View style={styles.headerText}>
            <Text style={styles.cardVendedor}>{item.vendedor?.nombre_completo?.toUpperCase() ?? 'SIN VENDEDOR'}</Text>
            <Text style={styles.cardDate}>{formatDate(item.fecha_corte).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isPendiente ? Colors.warning + '22' : Colors.success + '22', borderColor: isPendiente ? Colors.warning : Colors.success }]}>
          <Text style={[styles.statusText, { color: isPendiente ? Colors.warning : Colors.success }]}>
            {isPendiente ? 'PENDIENTE' : 'LIQUIDADO'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
          <View style={styles.amountRow}>
              <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>TOTAL VENDIDO</Text>
                  <Text style={styles.amountValue}>{formatCurrency(item.total_vendido ?? 0)}</Text>
              </View>
              <View style={styles.amountDivider} />
              <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>SALDO PENDIENTE</Text>
                  <Text style={[styles.amountValue, { color: isPendiente ? Colors.error : Colors.success }]}>
                      {formatCurrency(item.saldo_pendiente ?? 0)}
                  </Text>
              </View>
          </View>
      </View>

      <View style={styles.cardFooter}>
          <Text style={styles.footerAction}>VER DETALLE DE LIQUIDACIÓN</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

export default function ComprobantesScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getComprobantes();
      setComprobantes(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getComprobantes();
      setComprobantes(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return comprobantes;
    const q = search.toLowerCase();
    return comprobantes.filter((c) =>
      c.vendedor?.nombre_completo?.toLowerCase().includes(q)
    );
  }, [comprobantes, search]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>COMPROBANTES</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
                </View>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
            </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="BUSCAR POR VENDEDOR..."
          />
        </View>

        {loading && comprobantes.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_comprobante)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ComprobanteCard
                item={item}
                onPress={() => router.push(`/(app)/comprobantes/${item.id_comprobante}`)}
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
                icon="file-document-multiple"
                title="SIN COMPROBANTES"
                message={search ? 'NO SE ENCONTRARON RESULTADOS.' : 'AÚN NO HAY COMPROBANTES REGISTRADOS.'}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

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
  title: { fontSize: 22, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  searchSection: { paddingHorizontal: 20, paddingBottom: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: 20, marginBottom: 18, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.1, elevation: 3 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  iconContainer: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  headerText: { flex: 1 },
  cardVendedor: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  cardDate: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 8, fontWeight: '900' },
  cardBody: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountItem: { flex: 1, alignItems: 'center' },
  amountDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)' },
  amountLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  amountValue: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  footerAction: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },
});
