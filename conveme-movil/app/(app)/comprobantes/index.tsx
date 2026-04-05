import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getComprobantes } from '../../../src/services/comprobante.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { Badge } from '../../../src/components/ui/Badge';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Comprobante } from '../../../src/types';

function ComprobanteCard({
  item,
  onPress,
}: {
  item: Comprobante;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const isPendiente = (item.saldo_pendiente ?? 0) > 0;

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
        <Text style={[styles.cardDate, { color: theme.muted }]}>
          📅 {formatDate(item.fecha_corte)}
        </Text>
        <Badge
          text={isPendiente ? 'Pendiente' : 'Liquidado'}
          color={isPendiente ? 'warning' : 'success'}
          size="sm"
        />
      </View>
      <View style={styles.cardRow}>
        <View style={styles.cardCol}>
          <Text style={[styles.cardLabel, { color: theme.muted }]}>Total vendido</Text>
          <Text style={[styles.cardAmount, { color: theme.text }]}>
            {formatCurrency(item.total_vendido ?? 0)}
          </Text>
        </View>
        <View style={styles.cardCol}>
          <Text style={[styles.cardLabel, { color: theme.muted }]}>Saldo pendiente</Text>
          <Text
            style={[
              styles.cardAmount,
              { color: isPendiente ? Colors.warning : Colors.success },
            ]}
          >
            {formatCurrency(item.saldo_pendiente ?? 0)}
          </Text>
        </View>
      </View>
      <Text style={[styles.cardMeta, { color: theme.muted }]}>
        👤 {item.vendedor?.nombre_completo ?? 'Sin vendedor'}
      </Text>
    </Pressable>
  );
}

export default function ComprobantesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

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
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getComprobantes();
      setComprobantes(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

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

  if (loading && comprobantes.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Comprobantes</Text>
        </View>
        <LoadingSpinner fullScreen message="Cargando comprobantes..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Comprobantes</Text>
        <Text style={[styles.count, { color: theme.muted }]}>{filtered.length} registros</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por vendedor..."
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id_comprobante)}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => (
          <ComprobanteCard
            item={item}
            onPress={() => router.push(`/comprobantes/${item.id_comprobante}`)}
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
            icon="🧾"
            title="Sin comprobantes"
            message={
              search
                ? 'No hay comprobantes que coincidan con tu búsqueda.'
                : 'Aún no hay comprobantes registrados.'
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h3 },
  count: { ...Typography.bodySmall },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardDate: { ...Typography.bodySmall },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cardCol: { flex: 1 },
  cardLabel: { ...Typography.caption, marginBottom: 2 },
  cardAmount: { ...Typography.h4 },
  cardMeta: { ...Typography.caption },
});
