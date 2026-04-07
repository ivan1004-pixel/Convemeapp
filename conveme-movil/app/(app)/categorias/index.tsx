import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  getCategorias,
  deleteCategoria,
  updateCategoria,
} from '../../../src/services/categoria.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { parseGraphQLError } from '../../../src/utils';
import type { Categoria } from '../../../src/types';

export default function CategoriasScreen() {
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getCategorias();
      setCategorias(data);
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
    if (!search.trim()) return categorias;
    const q = search.toLowerCase();
    return categorias.filter((c) => c.nombre.toLowerCase().includes(q));
  }, [categorias, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteCategoria(deleteId);
      setCategorias((prev) => prev.filter((c) => c.id_categoria !== deleteId));
      showToast('CATEGORÍA ELIMINADA', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, showToast]);

  const startEdit = useCallback((item: Categoria) => {
    setEditId(item.id_categoria);
    setEditName(item.nombre);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (editId == null || !editName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateCategoria({ id_categoria: editId, nombre: editName.trim() });
      setCategorias((prev) =>
        prev.map((c) => (c.id_categoria === editId ? { ...c, nombre: updated.nombre } : c))
      );
      setEditId(null);
      showToast('CATEGORÍA ACTUALIZADA', 'success');
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSaving(false);
    }
  }, [editId, editName, showToast]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>CATEGORÍAS</Text>
                    <Text style={styles.subtitle}>{filtered.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/categorias/create')} style={styles.addBtn}>
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
            placeholder="BUSCAR CATEGORÍA..."
          />
        </View>

        {loading && categorias.length === 0 ? (
          <LoadingSpinner fullScreen message="CARGANDO..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_categoria)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isEditing = editId === item.id_categoria;
              return (
                <View style={[styles.card, isEditing && styles.cardEditing]}>
                  {isEditing ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editInput}
                        value={editName}
                        onChangeText={setEditName}
                        autoFocus
                        placeholder="NOMBRE DE CATEGORÍA"
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity onPress={handleSaveEdit} disabled={saving} style={styles.saveMiniBtn}>
                          <MaterialCommunityIcons name="check-bold" size={20} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditId(null)} style={styles.cancelMiniBtn}>
                          <MaterialCommunityIcons name="close-thick" size={20} color={Colors.dark} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.cardRow}>
                      <View style={styles.iconBox}>
                          <MaterialCommunityIcons name="tag" size={22} color={Colors.primary} />
                      </View>
                      <Text style={styles.cardName}>{item.nombre.toUpperCase()}</Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => startEdit(item)} style={styles.actionBtn}>
                          <MaterialCommunityIcons name="pencil" size={18} color={Colors.dark} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDeleteId(item.id_categoria)} style={styles.actionBtn}>
                          <MaterialCommunityIcons name="trash-can" size={18} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="tag-multiple"
                title="SIN CATEGORÍAS"
                message={search ? 'NO SE ENCONTRARON RESULTADOS.' : 'AÚN NO HAY CATEGORÍAS REGISTRADAS.'}
                actionLabel="CREAR CATEGORÍA"
                onAction={() => router.push('/categorias/create')}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmDialog
          visible={deleteId !== null}
          title="ELIMINAR CATEGORÍA"
          message="¿ESTÁS SEGURO DE QUE DESEAS ELIMINAR ESTA CATEGORÍA?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="ELIMINAR"
          destructive
          loading={deleting}
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
  title: { fontSize: 22, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 5 },
  searchSection: { paddingHorizontal: 20, paddingBottom: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: 15, marginBottom: 15, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.1, elevation: 3 },
  cardEditing: { borderColor: Colors.primary, borderWidth: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + '10', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '900', color: Colors.dark, flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editInput: { flex: 1, height: 48, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: Colors.dark, borderRadius: 12, paddingHorizontal: 12, fontWeight: '900', color: Colors.dark, fontSize: 14 },
  saveMiniBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  cancelMiniBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
});
