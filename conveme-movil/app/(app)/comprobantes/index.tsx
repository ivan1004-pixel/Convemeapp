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
import { Spacing } from '../../../src/theme/spacing';
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
            <Text style={styles.cardVendedor}>{item.vendedor?.nombre_completo ?? 'SIN VENDEDOR'}</Text>
            <Text style={styles.cardDate}>{formatDate(item.fecha_corte).toUpperCase()}</Text>
        </View>
        <Badge
          text={isPendiente ? 'PENDIENTE' : 'LIQUIDADO'}
          color={isPendiente ? 'warning' : 'success'}
          size="sm"
        />
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
          <Text style={styles.footerText}>Ver detalle de liquidación</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.dark} />
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
            <View>
                <Text style={styles.title}>Comprobantes</Text>
                <Text style={styles.subtitle}>{comprobantes.length} registros de liquidación</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                <MaterialCommunityIcons name="refresh" size={24} color={Colors.primary} />
            </TouchableOpacity>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_comprobante)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por vendedor..."
              style={{ marginBottom: 25 }}
            />
          }
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
            loading ? (
                <LoadingSpinner message="Cargando comprobantes..." />
            ) : (
                <EmptyState
                    icon="file-document-outline"
                    title="Sin comprobantes"
                    message={search ? 'No se encontraron resultados.' : 'No hay comprobantes registrados aún.'}
                />
            )
          }
          showsVerticalScrollIndicator={false}
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 15, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, elevation: 0 },
  cardPressed: { transform: [{ translateY: 2 }, { translateX: 2 }], shadowOffset: { width: 2, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  headerText: { flex: 1 },
  cardVendedor: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  cardDate: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)' },
  cardBody: { backgroundColor: '#F9FAFB', borderRadius: 15, padding: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountItem: { flex: 1, alignItems: 'center' },
  amountDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.05)' },
  amountLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  amountValue: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.3)' },
});
