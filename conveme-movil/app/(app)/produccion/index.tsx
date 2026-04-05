import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getOrdenesProduccion } from '../../../src/services/produccion.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatDate, parseGraphQLError } from '../../../src/utils';

const ESTADO_BADGE: Record<string, 'warning' | 'primary' | 'success' | 'error'> = {
  Pendiente: 'warning',
  'En Proceso': 'primary',
  Finalizada: 'success',
  Cancelada: 'error',
};

function OrdenCard({ item, onPress }: { item: any; onPress: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        Shadows.sm,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardId, { color: theme.muted }]}>Orden #{item.id_orden_produccion}</Text>
        <Badge
          text={item.estado ?? 'Pendiente'}
          color={ESTADO_BADGE[item.estado ?? 'Pendiente'] ?? 'secondary'}
          size="sm"
        />
      </View>
      <Text style={[styles.cardProduct, { color: theme.text }]}>
        🛍️ {item.producto?.nombre ?? 'Producto desconocido'}
      </Text>
      <View style={styles.cardMeta}>
        <Text style={[styles.metaText, { color: theme.muted }]}>
          📦 Cantidad: {item.cantidad_a_producir}
        </Text>
        <Text style={[styles.metaText, { color: theme.muted }]}>
          📅 {formatDate(item.fecha_orden)}
        </Text>
      </View>
      <Text style={[styles.empleado, { color: theme.muted }]}>
        👤 {item.empleado?.nombre_completo ?? 'Sin empleado'}
      </Text>
    </Pressable>
  );
}

export default function ProduccionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrdenesProduccion();
      setOrdenes(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getOrdenesProduccion();
      setOrdenes(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Producción</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Colors.primary }]}
          onPress={() => router.push('/(app)/produccion/create')}
        >
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={ordenes}
          keyExtractor={(item) => String(item.id_orden_produccion)}
          renderItem={({ item }) => (
            <OrdenCard
              item={item}
              onPress={() => router.push(`/(app)/produccion/${item.id_orden_produccion}`)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState message="No hay órdenes de producción" />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  title: { ...Typography.h2 },
  addButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardId: { fontSize: 12, fontWeight: '500' },
  cardProduct: { fontSize: 15, fontWeight: '700', marginBottom: Spacing.xs },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaText: { fontSize: 12 },
  empleado: { fontSize: 12 },
});
