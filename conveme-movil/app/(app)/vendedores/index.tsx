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
import { getVendedores, deleteVendedor } from '../../../src/services/vendedor.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import type { Vendedor } from '../../../src/types';

function VendedorCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Vendedor;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account-tie" size={32} color={Colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardName}>{item.nombre_completo}</Text>
          <Text style={styles.cardMeta}>VENDEDOR - {item.escuela?.nombre?.toUpperCase() || 'SIN ESCUELA'}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(26,26,26,0.3)" />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="email-outline" size={16} color="rgba(26,26,26,0.5)" />
          <Text style={styles.infoText}>{item.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="phone-outline" size={16} color="rgba(26,26,26,0.5)" />
          <Text style={styles.infoText}>{item.telefono || 'Sin teléfono'}</Text>
        </View>
        {item.instagram_handle && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="instagram" size={16} color="rgba(26,26,26,0.5)" />
            <Text style={styles.infoText}>@{item.instagram_handle}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>COMISIÓN</Text>
          <Text style={styles.statValue}>{item.comision_fija_menudeo}% / {item.comision_fija_mayoreo}%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>META</Text>
          <Text style={styles.statValue}>${item.meta_ventas_mensual}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function VendedoresScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendedores();
      setVendedores(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getVendedores();
      setVendedores(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return vendedores;
    const q = search.toLowerCase();
    return vendedores.filter(
      (v) =>
        v.nombre_completo.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.escuela?.nombre?.toLowerCase().includes(q)
    );
  }, [vendedores, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteVendedor(deleteId);
      setVendedores((prev) => prev.filter((v) => v.id_vendedor !== deleteId));
      showToast('Vendedor eliminado correctamente', 'success');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('foreign key constraint fails') || msg.includes('a parent row')) {
        showToast('No se puede eliminar: el vendedor tiene registros asociados.', 'error');
      } else {
        showToast(parseGraphQLError(err), 'error');
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  const deleteTarget = vendedores.find((v) => v.id_vendedor === deleteId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendedores</Text>
        <Text style={styles.count}>{filtered.length} registros</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, escuela..."
        />
      </View>

      {loading && vendedores.length === 0 ? (
        <LoadingSpinner fullScreen message="Cargando vendedores..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_vendedor)}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listEmpty,
          ]}
          renderItem={({ item }) => (
            <VendedorCard
              item={item}
              onPress={() => router.push(`/vendedores/${item.id_vendedor}`)}
              onLongPress={() => setDeleteId(item.id_vendedor)}
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
              icon="account-tie"
              title="Sin vendedores"
              message={search ? 'No hay resultados.' : 'Aún no hay vendedores.'}
              actionLabel="Agregar vendedor"
              onAction={() => router.push('/vendedores/create')}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/vendedores/create')}
        activeOpacity={0.85}
        accessibilityLabel="Agregar vendedor"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar vendedor"
        message={`¿Deseas eliminar a "${deleteTarget?.nombre_completo ?? ''}"?`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        destructive
      />

      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  count: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: 'rgba(26,26,26,0.5)',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  cardMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  cardContent: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(26,26,26,0.6)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,26,0.03)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(26,26,26,0.4)',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(26,26,26,0.1)',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  fabIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '900',
  },
});
