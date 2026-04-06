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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getEmpleados, deleteEmpleado } from '../../../src/services/empleado.service';
import { useEmpleadoStore } from '../../../src/store/empleadoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Empleado } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

function EmpleadoCard({
  item,
  onPress,
  onLongPress,
}: {
  item: Empleado;
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
          <Text style={styles.cardPuesto}>{item.puesto?.toUpperCase() ?? 'EMPLEADO'}</Text>
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
        {item.municipio && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="rgba(26,26,26,0.5)" />
            <Text style={styles.infoText}>
              {item.municipio.nombre}, {item.municipio.estado?.nombre}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function EmpleadosScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { empleados, setEmpleados, removeEmpleado } = useEmpleadoStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmpleados();
      setEmpleados(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [setEmpleados]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getEmpleados();
      setEmpleados(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [setEmpleados]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return empleados;
    const q = search.toLowerCase();
    return empleados.filter(
      (e) =>
        e.nombre_completo.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.puesto?.toLowerCase().includes(q)
    );
  }, [empleados, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteEmpleado(deleteId);
      removeEmpleado(deleteId);
      showToast('Empleado eliminado correctamente', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, removeEmpleado]);

  const deleteTarget = empleados.find((e) => e.id_empleado === deleteId);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Empleados</Text>
                <Text style={styles.subtitle}>{filtered.length} registros</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/empleados/create')} style={styles.addBtn}>
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
            placeholder="Buscar por nombre, puesto..."
          />
        </View>

        {loading && empleados.length === 0 ? (
          <LoadingSpinner fullScreen message="Cargando empleados..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_empleado)}
            contentContainerStyle={[
              styles.listContent,
              filtered.length === 0 && styles.listEmpty,
            ]}
            renderItem={({ item }) => (
              <EmpleadoCard
                item={item}
                onPress={() => router.push(`/empleados/${item.id_empleado}`)}
                onLongPress={() => setDeleteId(item.id_empleado)}
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
                icon="account-group"
                title="Sin empleados"
                message={search ? 'No hay resultados.' : 'Aún no hay empleados.'}
                actionLabel="Agregar empleado"
                onAction={() => router.push('/empleados/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="Eliminar empleado"
          message={`¿Deseas eliminar a "${deleteTarget?.nombre_completo ?? ''}"?`}
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
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.dark },
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
  cardPuesto: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
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
