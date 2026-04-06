import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getOrdenesProduccion } from '../../../src/services/produccion.service';
import { useProduccionStore } from '../../../src/store/produccionStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { formatDate, parseGraphQLError } from '../../../src/utils';

const ESTADO_COLORS: Record<string, 'warning' | 'primary' | 'success' | 'error'> = {
  Pendiente: 'warning',
  'En Proceso': 'primary',
  Finalizada: 'success',
  Cancelada: 'error',
};

const ESTADO_ICONS: Record<string, string> = {
  Pendiente: 'clock-outline',
  'En Proceso': 'hammer-wrench',
  Finalizada: 'check-circle-outline',
  Cancelada: 'cancel',
};

function OrdenCard({ item, onPress }: { item: any; onPress: () => void }) {
  const estado = item.estado ?? 'Pendiente';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: Colors[ESTADO_COLORS[estado] || 'primary'] + '15' }]}>
            <MaterialCommunityIcons 
                name={ESTADO_ICONS[estado] || 'clipboard-text-outline'} 
                size={24} 
                color={Colors[ESTADO_COLORS[estado] || 'primary']} 
            />
        </View>
        <View style={styles.headerText}>
            <Text style={styles.cardId}>ORDEN #{item.id_orden_produccion}</Text>
            <Text style={styles.cardProduct}>{item.producto?.nombre || 'PRODUCTO DESCONOCIDO'}</Text>
        </View>
        <Badge
          text={estado.toUpperCase()}
          color={ESTADO_COLORS[estado] || 'secondary'}
          size="sm"
        />
      </View>

      <View style={styles.cardBody}>
          <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>CANTIDAD</Text>
                  <Text style={styles.infoValue}>{item.cantidad_a_producir}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>FECHA</Text>
                  <Text style={styles.infoValue}>{formatDate(item.fecha_orden, 'DD/MM/YY')}</Text>
              </View>
          </View>
      </View>

      <View style={styles.cardFooter}>
          <MaterialCommunityIcons name="account-outline" size={14} color="rgba(0,0,0,0.4)" />
          <Text style={styles.footerText}>{item.empleado?.nombre_completo || 'SIN ASIGNAR'}</Text>
      </View>
    </Pressable>
  );
}

export default function ProduccionScreen() {
  const { toast, show, hide } = useToast();
  const { ordenesProduccion, setOrdenesProduccion } = useProduccionStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrdenesProduccion();
      setOrdenesProduccion(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setOrdenesProduccion, show]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getOrdenesProduccion();
      setOrdenesProduccion(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [setOrdenesProduccion, show]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ordenesProduccion;
    const q = search.toLowerCase();
    return ordenesProduccion.filter(
      (o) =>
        o.producto?.nombre?.toLowerCase().includes(q) ||
        o.empleado?.nombre_completo?.toLowerCase().includes(q) ||
        String(o.id_orden_produccion).includes(q)
    );
  }, [ordenesProduccion, search]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Producción</Text>
                <Text style={styles.subtitle}>{ordenesProduccion.length} órdenes registradas</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/produccion/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_orden_produccion)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="BUSCAR ORDEN O PRODUCTO..."
              style={{ marginBottom: 25 }}
            />
          }
          renderItem={({ item }) => (
            <OrdenCard
              item={item}
              onPress={() => router.push(`/(app)/produccion/${item.id_orden_produccion}`)}
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
                <LoadingSpinner message="Cargando órdenes..." />
            ) : (
                <EmptyState
                    icon="clipboard-list-outline"
                    title="SIN ÓRDENES"
                    message={search ? 'No se encontraron resultados.' : 'No hay órdenes de producción.'}
                    actionLabel="NUEVA ORDEN"
                    onAction={() => router.push('/produccion/create')}
                />
            )
          }
          showsVerticalScrollIndicator={false}
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, marginBottom: 18, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, elevation: 0 },
  cardPressed: { transform: [{ translateY: 3 }, { translateX: 3 }], shadowOffset: { width: 2, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  headerText: { flex: 1 },
  cardId: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  cardProduct: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  cardBody: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 12, borderWidth: 2, borderColor: Colors.dark, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoItem: { flex: 1, alignItems: 'center' },
  infoDivider: { width: 2, height: 30, backgroundColor: Colors.dark, opacity: 0.1 },
  infoLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2, letterSpacing: 0.5 },
  infoValue: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 2, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10 },
  footerText: { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' },
});

