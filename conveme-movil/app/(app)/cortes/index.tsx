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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getCortes, deleteCorte } from '../../../src/services/corte.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatCurrency, formatDate, parseGraphQLError } from '../../../src/utils';

function getDiferenciaColor(diferencia: number, isDark: boolean) {
  const theme = isDark ? Colors.dark2 : Colors.light2;
  if (diferencia > 0) return Colors.error;
  if (diferencia === 0) return Colors.success;
  return Colors.warning;
}

function CorteCard({
  item,
  onPress,
  onLongPress,
}: {
  item: any;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        Shadows.sm,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardId, { color: theme.muted }]}>Corte #{item.id_corte}</Text>
        <Text style={[styles.cardDate, { color: theme.muted }]}>{formatDate(item.fecha_corte)}</Text>
      </View>
      <Text style={[styles.vendedor, { color: theme.text }]}>
        👤 {item.vendedor?.nombre_completo ?? 'Sin vendedor'}
      </Text>
      <View style={styles.amountsRow}>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: theme.muted }]}>Esperado</Text>
          <Text style={[styles.amountValue, { color: theme.text }]}>
            {formatCurrency(item.dinero_esperado)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: theme.muted }]}>Entregado</Text>
          <Text style={[styles.amountValue, { color: theme.text }]}>
            {formatCurrency(item.dinero_total_entregado)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: theme.muted }]}>Diferencia</Text>
          <Text
            style={[
              styles.amountValue,
              { color: getDiferenciaColor(item.diferencia_corte, isDark) },
            ]}
          >
            {formatCurrency(item.diferencia_corte)}
          </Text>
        </View>
      </View>
      {item.observaciones ? (
        <Text style={[styles.observaciones, { color: theme.muted }]} numberOfLines={1}>
          📝 {item.observaciones}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function CortesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [cortes, setCortes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const data = await getCortes(q);
      setCortes(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData('');
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getCortes(search);
      setCortes(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, [search]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    fetchData(text);
  }, [fetchData]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCorte(deleteId);
      setCortes((prev) => prev.filter((c) => c.id_corte !== deleteId));
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  const filtered = useMemo(() => cortes, [cortes]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Cortes</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Colors.primary }]}
          onPress={() => router.push('/(app)/cortes/create')}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>
      <SearchBar
        value={search}
        onChangeText={handleSearch}
        placeholder="Buscar por vendedor..."
      />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_corte)}
          renderItem={({ item }) => (
            <CorteCard
              item={item}
              onPress={() => router.push(`/(app)/cortes/${item.id_corte}`)}
              onLongPress={() => setDeleteId(item.id_corte)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState message="No hay cortes registrados" />}
        />
      )}
      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar corte"
        message="¿Deseas eliminar este corte? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
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
    marginBottom: Spacing.xs,
  },
  cardId: { fontSize: 12, fontWeight: '500' },
  cardDate: { fontSize: 12 },
  vendedor: { fontSize: 14, fontWeight: '600', marginBottom: Spacing.sm },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  amountItem: { alignItems: 'center', flex: 1 },
  amountLabel: { fontSize: 11, marginBottom: 2 },
  amountValue: { fontSize: 13, fontWeight: '700' },
  observaciones: { fontSize: 12, marginTop: Spacing.xs },
});
