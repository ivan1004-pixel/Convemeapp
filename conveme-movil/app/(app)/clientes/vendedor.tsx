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
import { getClientes } from '../../../src/services/cliente.service';
import { useClienteStore } from '../../../src/store/clienteStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError, formatPhone } from '../../../src/utils';
import type { Cliente } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { useAuth } from '../../../src/hooks/useAuth';

const CLIENTE_IMAGES = [
  require('../../../assets/images/fotoc1.jpg'),
  require('../../../assets/images/fotoc2.jpg'),
  require('../../../assets/images/fotoc3.jpg'),
];

function ClienteCard({
  item,
  onPress,
}: {
  item: Cliente;
  onPress: () => void;
}) {
  const imageIndex = item.id_cliente % CLIENTE_IMAGES.length;
  const avatarImage = CLIENTE_IMAGES[imageIndex];

  return (
    <Pressable
      onPress={onPress}
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
          <Text style={styles.cardMeta}>MI CLIENTE</Text>
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
          <Text style={styles.infoText}>{item.telefono ? formatPhone(item.telefono) : 'SIN TELÉFONO'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function VendedorClientesScreen() {
  const { usuario } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { clientes, setClientes } = useClienteStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      // Mostrar todos los clientes (admin y vendedor pueden ver todos)
      setClientes(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setClientes, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getClientes();
      // Mostrar todos los clientes (admin y vendedor pueden ver todos)
      setClientes(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [setClientes, showToast, usuario]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre_completo.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telefono?.includes(q)
    );
  }, [clientes, search]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>MIS CLIENTES</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="BUSCAR MIS CLIENTES..."
          />
        </View>

        {loading && clientes.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_cliente)}
            contentContainerStyle={[
              styles.listContent,
              filtered.length === 0 && styles.listEmpty,
            ]}
            renderItem={({ item }) => (
              <ClienteCard
                item={item}
                onPress={() => router.push(`/clientes/${item.id_cliente}`)}
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
                icon="account-search"
                title="SIN CLIENTES"
                message={search ? 'NO HAY RESULTADOS QUE COINCIDAN.' : 'AÚN NO TIENES CLIENTES ASIGNADOS.'}
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
  headerActions: { flexDirection: 'row', gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
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
    shadowOpacity: 0.1,
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
});
