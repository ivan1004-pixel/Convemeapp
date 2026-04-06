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
import { Spacing } from '../../../src/theme/spacing';
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
        <View style={styles.headerText}>
            <Text style={styles.cardName}>{item.descripcion}</Text>
            <Text style={styles.cardId}>ID: {item.id_tamano}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Toca para editar · Mantén para eliminar</Text>
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
      show('Tamaño eliminado correctamente', 'success');
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
            <View>
                <Text style={styles.title}>Tamaños</Text>
                <Text style={styles.subtitle}>{tamanos.length} registros</Text>
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

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id_tamano)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="BUSCAR TAMAÑO..."
              style={{ marginBottom: 25 }}
            />
          }
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
            loading ? (
                <LoadingSpinner message="Cargando tamaños..." />
            ) : (
                <EmptyState
                    icon="ruler"
                    title="SIN TAMAÑOS"
                    message={search ? 'No se encontraron resultados.' : 'No hay tamaños registrados.'}
                    actionLabel="REGISTRAR TAMAÑO"
                    onAction={() => router.push('/tamanos/create')}
                />
            )
          }
          showsVerticalScrollIndicator={false}
        />

        <ConfirmDialog
          visible={selectedTamano !== null}
          title="ELIMINAR TAMAÑO"
          message={`¿Deseas eliminar "${selectedTamano?.descripcion}"?`}
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
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.dark },
  subtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 18, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, elevation: 0 },
  cardPressed: { transform: [{ translateY: 3 }, { translateX: 3 }], shadowOffset: { width: 2, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  iconContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  headerText: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: '900', color: Colors.dark, marginBottom: 2 },
  cardId: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)' },
  cardFooter: { borderTopWidth: 2, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10, marginTop: 5 },
  footerText: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.3)', textAlign: 'right' },
});
