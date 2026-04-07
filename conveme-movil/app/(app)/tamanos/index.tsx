import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getTamanos,
  deleteTamano,
} from '../../../src/services/tamano.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import type { Tamano } from '../../../src/types';

function TamanoCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Tamano;
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
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
                name="ruler" 
                size={24} 
                color={Colors.primary} 
            />
        </View>
        <View style={styles.headerInfo}>
            <Text style={styles.cardName}>{item.descripcion.toUpperCase()}</Text>
            <Text style={styles.cardMeta}>ID: {item.id_tamano}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
          <Text style={styles.footerAction}>GESTIONAR TAMAÑO</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

export default function TamanosScreen() {
  const { toast, show, hide } = useToast();
  const [tamanos, setTamanos] = useState<Tamano[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTamano, setSelectedTamano] = useState<Tamano | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTamanos();
      setTamanos(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [show]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getTamanos();
      setTamanos(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [show]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tamanos;
    const q = search.toLowerCase();
    return tamanos.filter((t) => t.descripcion.toLowerCase().includes(q));
  }, [tamanos, search]);

  const handleDelete = useCallback(async () => {
    if (!selectedTamano) return;
    setDeleting(true);
    try {
      await deleteTamano(selectedTamano.id_tamano);
      setTamanos((prev) => prev.filter((t) => t.id_tamano !== selectedTamano.id_tamano));
      show('TAMAÑO ELIMINADO', 'success');
      setSelectedTamano(null);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }, [selectedTamano, show]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>TAMAÑOS</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/tamanos/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="BUSCAR TAMAÑO..."
          />
        </View>

        {loading && tamanos.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_tamano)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TamanoCard
                item={item}
                onPress={() => router.push({
                  pathname: '/tamanos/create',
                  params: { id: item.id_tamano, descripcion: item.descripcion }
                })}
                onLongPress={() => setSelectedTamano(item)}
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
                icon="ruler"
                title="SIN TAMAÑOS"
                message={search ? 'NO SE ENCONTRARON RESULTADOS.' : 'AÚN NO HAY TAMAÑOS REGISTRADOS.'}
                actionLabel="REGISTRAR TAMAÑO"
                onAction={() => router.push('/tamanos/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={selectedTamano !== null}
          title="ELIMINAR TAMAÑO"
          message={`¿DESEAS ELIMINAR EL TAMAÑO "${selectedTamano?.descripcion.toUpperCase()}"?`}
          confirmText="ELIMINAR"
          onConfirm={handleDelete}
          onCancel={() => setSelectedTamano(null)}
          loading={deleting}
          destructive
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 5 },
  searchSection: { paddingHorizontal: 20, paddingBottom: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.1, elevation: 3 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + '10', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  cardMeta: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  footerAction: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },
});
