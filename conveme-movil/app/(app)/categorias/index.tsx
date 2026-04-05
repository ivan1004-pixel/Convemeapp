import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Alert,
  TouchableOpacity,
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
import { Shadows } from '../../../src/theme/shadows';
import { SearchBar } from '../../../src/components/ui/SearchBar';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Button } from '../../../src/components/ui/Button';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Categoria } from '../../../src/types';

export default function CategoriasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

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
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

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
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

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
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSaving(false);
    }
  }, [editId, editName]);

  if (loading && categorias.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Categorías</Text>
        </View>
        <LoadingSpinner fullScreen message="Cargando categorías..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Categorías</Text>
        <Text style={[styles.count, { color: theme.muted }]}>{filtered.length} registros</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar categoría..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id_categoria)}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => {
          const isEditing = editId === item.id_categoria;
          return (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                Shadows.sm,
              ]}
            >
              {isEditing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[
                      styles.editInput,
                      { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    placeholder="Nombre"
                    placeholderTextColor={theme.muted}
                  />
                  <Button
                    title={saving ? '...' : '✓'}
                    size="sm"
                    onPress={handleSaveEdit}
                    loading={saving}
                    style={styles.editSaveBtn}
                  />
                  <Button
                    title="✕"
                    size="sm"
                    variant="outline"
                    onPress={() => setEditId(null)}
                    style={styles.editCancelBtn}
                  />
                </View>
              ) : (
                <View style={styles.cardRow}>
                  <Text style={[styles.cardName, { color: theme.text }]}>{item.nombre}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => startEdit(item)}
                      style={styles.actionBtn}
                      accessibilityLabel="Editar"
                    >
                      <Text style={styles.actionEdit}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteId(item.id_categoria)}
                      style={styles.actionBtn}
                      accessibilityLabel="Eliminar"
                    >
                      <Text style={styles.actionDelete}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
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
            icon="🏷️"
            title="Sin categorías"
            message={search ? 'No hay categorías que coincidan.' : 'Aún no hay categorías.'}
            actionLabel={!search ? 'Crear categoría' : undefined}
            onAction={!search ? () => router.push('/categorias/create') : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, Shadows.lg]}
        onPress={() => router.push('/categorias/create')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Nueva categoría"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar categoría"
        message="¿Deseas eliminar esta categoría? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmText={deleting ? 'Eliminando...' : 'Eliminar'}
        destructive
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h3 },
  count: { ...Typography.bodySmall },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + Spacing.xl,
  },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: { ...Typography.body, fontWeight: '500', flex: 1 },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { padding: Spacing.xs },
  actionEdit: { fontSize: 18 },
  actionDelete: { fontSize: 18 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    ...Typography.body,
  },
  editSaveBtn: { minWidth: 36 },
  editCancelBtn: { minWidth: 36 },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, color: '#ffffff', lineHeight: 32 },
});
