import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Clipboard,
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
  onCopy,
}: {
  item: any;
  onPress: () => void;
  onLongPress: () => void;
  onCopy: (text: string) => void;
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
          <Text style={styles.cardName}>{item.banco.toUpperCase()}</Text>
          <Text style={styles.cardMeta}>{item.titular_cuenta.toUpperCase()}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.dark} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="card-text-outline" size={18} color={Colors.dark} />
          <Text style={styles.infoText}>NO. CUENTA: {maskAccount(item.numero_cuenta)}</Text>
        </View>
        {item.clabe_interbancaria && (
          <View style={[styles.infoRow, styles.clabeRow]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="form-textbox" size={18} color={Colors.dark} />
                <Text style={styles.infoText}>CLABE: {item.clabe_interbancaria}</Text>
            </View>
            <TouchableOpacity onPress={() => onCopy(item.clabe_interbancaria)} style={styles.copyBtn}>
                <MaterialCommunityIcons name="content-copy" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        {item.vendedor && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-tie" size={18} color={Colors.dark} />
            <Text style={styles.infoText}>VENDEDOR: {item.vendedor.nombre_completo.toUpperCase()}</Text>
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
      setCuentas(data || []);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getCuentasBancarias();
      setCuentas(data || []);
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
    if (!search.trim()) return cuentas;
    const q = search.toLowerCase();
    return cuentas.filter((c) => {
      const banco = c.banco?.toLowerCase() ?? '';
      const titular = c.titular_cuenta?.toLowerCase() ?? '';
      const vendedor = c.vendedor?.nombre_completo?.toLowerCase() ?? '';
      const cuentaNum = c.numero_cuenta?.toLowerCase() ?? '';
      const clabe = c.clabe_interbancaria?.toLowerCase() ?? '';

    return (
      banco.includes(q) ||
      titular.includes(q) ||
      vendedor.includes(q) ||
      cuentaNum.includes(q) ||
      clabe.includes(q)
    );
    });
  }, [cuentas, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteCuentaBancaria(deleteId);
      setCuentas((prev) => prev.filter((c) => c.id_cuenta !== deleteId));
      showToast('CUENTA ELIMINADA CORRECTAMENTE', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, showToast]);

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    showToast('CLABE COPIADA AL PORTAPAPELES', 'success');
  };

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)/mas')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>CUENTAS</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
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
            placeholder="BUSCAR POR BANCO, TITULAR..."
          />
        </View>

        {loading && cuentas.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO CUENTAS..." />
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
                onPress={() => router.push(`/cuentas-bancarias/create?id=${item.id_cuenta}`)}
                onLongPress={() => setDeleteId(item.id_cuenta)}
                onCopy={handleCopy}
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
                title="SIN CUENTAS"
                message={search ? 'NO HAY RESULTADOS.' : 'AÚN NO HAY CUENTAS BANCARIAS.'}
                actionLabel="AGREGAR CUENTA"
                onAction={() => router.push('/cuentas-bancarias/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="ELIMINAR CUENTA"
          message="¿DESEAS ELIMINAR ESTA CUENTA BANCARIA?"
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
  title: { fontSize: 24, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
    backgroundColor: Colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  headerInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  cardMeta: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  cardContent: {
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  clabeRow: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
  },
  copyBtn: {
    padding: 6,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: Colors.dark,
    borderRadius: 6,
  },
});

