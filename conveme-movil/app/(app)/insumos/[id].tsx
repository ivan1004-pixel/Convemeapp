import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getInsumos, deleteInsumo } from '../../../src/services/insumo.service';
import { useInsumoStore } from '../../../src/store/insumoStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Insumo } from '../../../src/types';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: theme.muted }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    flex: 1,
  },
  value: {
    ...Typography.body,
    flex: 2,
    textAlign: 'right',
  },
});

export default function InsumoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { insumos, setInsumos, removeInsumo } = useInsumoStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const insumo: Insumo | undefined = insumos.find((i) => i.id_insumo === Number(id));

  const fetchIfNeeded = useCallback(async () => {
    if (insumo) return;
    setLoading(true);
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [insumo, setInsumos]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    if (!insumo) return;
    setDeleting(true);
    try {
      await deleteInsumo(insumo.id_insumo);
      removeInsumo(insumo.id_insumo);
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [insumo, removeInsumo]);

  if (loading || !insumo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={[styles.backIcon, { color: Colors.primary }]}>←</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Detalle</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <LoadingSpinner fullScreen message="Cargando..." />
      </SafeAreaView>
    );
  }

  const isLowStock =
    insumo.stock_minimo_alerta != null &&
    insumo.stock_actual != null &&
    insumo.stock_actual <= insumo.stock_minimo_alerta;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={[styles.backIcon, { color: Colors.primary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Insumo</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: isLowStock ? Colors.error : theme.border }, Shadows.sm]}>
          <View style={[styles.heroIcon, { backgroundColor: isLowStock ? '#FEE2E2' : Colors.primaryLight }]}>
            <Text style={styles.heroIconText}></Text>
          </View>
          <Text style={[styles.heroName, { color: theme.text }]}>{insumo.nombre}</Text>
          {isLowStock && <Badge text="Stock bajo — Requiere reabastecimiento" color="error" />}
        </View>

        {/* Stock section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Inventario</Text>
          <InfoRow label="Unidad de medida" value={insumo.unidad_medida} />
          <InfoRow label="Stock actual" value={insumo.stock_actual != null ? String(insumo.stock_actual) : null} />
          <InfoRow label="Stock mínimo alerta" value={insumo.stock_minimo_alerta != null ? String(insumo.stock_minimo_alerta) : null} />
        </View>

        <View style={styles.actions}>
          <Button
            title="Editar"
            variant="outline"
            onPress={() => router.push(`/insumos/create?id=${insumo.id_insumo}`)}
            style={styles.actionBtn}
          />
          <Button
            title="Eliminar"
            variant="danger"
            onPress={() => setShowConfirm(true)}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showConfirm}
        title="Eliminar insumo"
        message={`¿Deseas eliminar "${insumo.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '500',
  },
  headerTitle: {
    ...Typography.h3,
  },
  headerPlaceholder: {
    width: 34,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: {
    fontSize: 32,
  },
  heroName: {
    ...Typography.h2,
    textAlign: 'center',
  },
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.label,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
