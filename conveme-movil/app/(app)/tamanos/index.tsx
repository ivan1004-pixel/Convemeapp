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
  getTamanos,
  deleteTamano,
  updateTamano,
} from '../../../src/services/tamano.service';
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
import type { Tamano } from '../../../src/types';

export default function TamanosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [tamanos, setTamanos] = useState<Tamano[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTamanos();
      setTamanos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getTamanos();
      setTamanos(data);
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
    if (!search.trim()) return tamanos;
    const q = search.toLowerCase();
    return tamanos.filter((t) => t.descripcion.toLowerCase().includes(q));
  }, [tamanos, search]);

  const handleDelete = useCallback(async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteTamano(deleteId);
      setTamanos((prev) => prev.filter((t) => t.id_tamano !== deleteId));
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId]);

  const startEdit = useCallback((item: Tamano) => {
    setEditId(item.id_tamano);
    setEditDesc(item.descripcion);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (editId == null || !editDesc.trim()) return;
    setSaving(true);
    try {
      const updated = await updateTamano({ id_tamano: editId, descripcion: editDesc.trim() });
      setTamanos((prev) =>
        prev.map((t) => (t.id_tamano === editId ? { ...t, descripcion: updated.descripcion } : t))
      );
      setEditId(null);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setSaving(false);
    }
  }, [editId, editDesc]);

  if (loading && tamanos.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Tamaños</Text>
        </View>
        <LoadingSpinner fullScreen message="Cargando tamaños..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Tamaños</Text>
        <Text style={[styles.count, { color: theme.muted }]}>{filtered.length} registros</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar tamaño..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id_tamano)}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => {
          const isEditing = editId === item.id_tamano;
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
                    value={editDesc}
                    onChangeText={setEditDesc}
                    autoFocus
                    placeholder="Descripción"
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
                  <Text style={[styles.cardDesc, { color: theme.text }]}>{item.descripcion}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => startEdit(item)}
                      style={styles.actionBtn}
                      accessibilityLabel="Editar"
                    >
                      <Text style={styles.actionEdit}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteId(item.id_tamano)}
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
            icon="📏"
            title="Sin tamaños"
            message={search ? 'No hay tamaños que coincidan.' : 'Aún no hay tamaños registrados.'}
            actionLabel={!search ? 'Crear tamaño' : undefined}
            onAction={!search ? () => router.push('/tamanos/create') : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, Shadows.lg]}
        onPress={() => router.push('/tamanos/create')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Nuevo tamaño"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar tamaño"
        message="¿Deseas eliminar este tamaño? Esta acción no se puede deshacer."
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
  searchContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
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
  cardDesc: { ...Typography.body, fontWeight: '500', flex: 1 },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { padding: Spacing.xs },
  actionEdit: { fontSize: 18 },
  actionDelete: { fontSize: 18 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
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
