import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
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
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

const VENDEDOR_IMAGES = [
  require('../../../assets/images/fotv1.jpg'),
  require('../../../assets/images/fotv2.jpg'),
  require('../../../assets/images/fotv3.jpg'),
];

function VendedorCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Vendedor;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const imageIndex = item.id_vendedor % VENDEDOR_IMAGES.length;
  const avatarImage = VENDEDOR_IMAGES[imageIndex];

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
          <Image source={avatarImage} style={styles.avatarImg} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardName}>{item.nombre_completo.toUpperCase()}</Text>
          <Text style={styles.cardMeta}>VENDEDOR - {item.escuela?.nombre?.toUpperCase() || 'SIN ESCUELA'}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.dark} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="email-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{item.email?.toUpperCase() || 'SIN EMAIL'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="phone-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>{item.telefono || 'SIN TELÉFONO'}</Text>
        </View>
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
  }, [showToast]);

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
  }, [showToast]);

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
      showToast('¡VENDEDOR ELIMINADO! HASTA LA PRÓXIMA 🤠', 'success');
    } catch (err: any) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, showToast]);

  const deleteTarget = vendedores.find((v) => v.id_vendedor === deleteId);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>VENDEDORES</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/vendedores/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="BUSCAR POR NOMBRE, ESCUELA..."
          />
        </View>

        {loading && vendedores.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO..." />
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
                actionLabel={!search ? "AGREGAR VENDEDOR" : undefined}
                onAction={!search ? () => router.push('/vendedores/create') : undefined}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="ELIMINAR VENDEDOR"
          message={`¿DESEAS ELIMINAR A "${deleteTarget?.nombre_completo.toUpperCase() ?? ''}"?`}
          confirmText="ELIMINAR"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
          destructive
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActions: { flexDirection: 'row', gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 5 },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140,
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
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 3,
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
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: Colors.dark,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  avatarImg: { width: '100%', height: '100%' },
  headerInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
  },
  cardMeta: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  cardContent: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.3)',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark,
  },
  statDivider: {
    width: 1,
    height: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
