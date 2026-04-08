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
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPromociones } from '../../../src/services/promocion.service';
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
  index,
  onPress,
}: {
  item: Promocion;
  index: number;
  onPress: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(index * 100)}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={onPress}
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
            <Text style={styles.footerAction}>VER DETALLE</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.primary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function VendedorPromocionesScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { promociones, setPromociones } = usePromocionStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

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
            renderItem={({ item, index }) => (
              <PromocionCard
                item={item}
                index={index}
                onPress={() => router.push(`/(app)/promociones/${item.id_promocion}`)}
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
                message={search ? 'NO SE ENCONTRARON RESULTADOS.' : 'AÚN NO HAY PROMOS VIGENTES.'}
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
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  searchSection: { paddingHorizontal: 20, paddingBottom: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: 20, marginBottom: 18, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4 },
  cardPressed: { transform: [{ translateY: 2 }, { translateX: 2 }], shadowOffset: { width: 2, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 15 },
  iconContainer: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  headerText: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  cardTipo: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 2 },
  statusText: { fontSize: 8, fontWeight: '900' },
  cardBody: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, borderWidth: 2, borderColor: Colors.dark },
  promoRow: { flexDirection: 'row', alignItems: 'center' },
  promoItem: { flex: 1, alignItems: 'center' },
  promoDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)' },
  promoLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  promoValue: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  promoDates: { fontSize: 10, fontWeight: '800', color: Colors.dark, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 2, borderTopColor: Colors.dark, paddingTop: 12 },
  footerAction: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },
});
