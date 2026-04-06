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
import { getCuentasBancarias, deleteCuentaBancaria } from '../../../src/services/cuenta-bancaria.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

function CuentaBancariaCard({
  item,
  onPress,
  onLongPress,
}: {
  item: any;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const maskAccount = (num: string) => {
    if (!num) return '****';
    return '****' + num.slice(-4);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="bank" size={28} color={Colors.success} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardName}>{item.banco}</Text>
          <Text style={styles.cardMeta}>{item.titular_cuenta.toUpperCase()}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(26,26,26,0.3)" />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="card-text-outline" size={16} color="rgba(26,26,26,0.5)" />
          <Text style={styles.infoText}>No. Cuenta: {maskAccount(item.numero_cuenta)}</Text>
        </View>
        {item.clabe_interbancaria && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="form-textbox" size={16} color="rgba(26,26,26,0.5)" />
            <Text style={styles.infoText}>CLABE: {item.clabe_interbancaria}</Text>
          </View>
        )}
        {item.vendedor && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-tie" size={16} color="rgba(26,26,26,0.5)" />
            <Text style={styles.infoText}>Vendedor: {item.vendedor.nombre_completo}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function CuentasBancariasScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCuentasBancarias();
      setCuentas(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getCuentasBancarias();
      setCuentas(data);
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
    if (!search.trim()) return cuentas;
    const q = search.toLowerCase();
    return cuentas.filter(
      (c) =>
        c.banco.toLowerCase().includes(q) ||
        c.titular_cuenta.toLowerCase().includes(q) ||
        c.vendedor?.nombre_completo.toLowerCase().includes(q)
    );
  }, [cuentas, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteCuentaBancaria(deleteId);
      setCuentas((prev) => prev.filter((c) => c.id_cuenta !== deleteId));
      showToast('Cuenta eliminada correctamente', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)/mas')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Cuentas</Text>
                    <Text style={styles.subtitle}>{filtered.length} registros</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/cuentas-bancarias/create')} style={styles.addBtn}>
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
            placeholder="Buscar por banco, titular..."
          />
        </View>

        {loading && cuentas.length === 0 ? (
          <LoadingSpinner fullScreen message="Cargando cuentas..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_cuenta)}
            contentContainerStyle={[
              styles.listContent,
              filtered.length === 0 && styles.listEmpty,
            ]}
            renderItem={({ item }) => (
              <CuentaBancariaCard
                item={item}
                onPress={() => router.push(`/cuentas-bancarias/${item.id_cuenta}`)}
                onLongPress={() => setDeleteId(item.id_cuenta)}
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
                icon="bank"
                title="Sin cuentas"
                message={search ? 'No hay resultados.' : 'Aún no hay cuentas bancarias.'}
                actionLabel="Agregar cuenta"
                onAction={() => router.push('/cuentas-bancarias/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="Eliminar cuenta"
          message="¿Deseas eliminar esta cuenta bancaria?"
          confirmText="Eliminar"
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
  title: { fontSize: 24, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
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
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 2, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
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
    color: Colors.success,
    letterSpacing: 0.5,
  },
  cardContent: {
    gap: Spacing.xs,
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
});

