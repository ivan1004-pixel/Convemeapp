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
import { getPromociones, deletePromocion } from '../../../src/services/promocion.service';
import { usePromocionStore } from '../../../src/store/promocionStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError, formatDate, formatCurrency } from '../../../src/utils';
import type { Promocion } from '../../../src/types';

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

export default function PromocionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { promociones, setPromociones, removePromocion } = usePromocionStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const promocion: Promocion | undefined = promociones.find(
    (p) => p.id_promocion === Number(id)
  );

  const fetchIfNeeded = useCallback(async () => {
    if (promocion) return;
    setLoading(true);
    try {
      const data = await getPromociones();
      setPromociones(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [promocion, setPromociones]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    if (!promocion) return;
    setDeleting(true);
    try {
      await deletePromocion(promocion.id_promocion);
      removePromocion(promocion.id_promocion);
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [promocion, removePromocion]);

  if (loading || !promocion) {
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

  const descuentoText =
    promocion.valor_descuento != null
      ? promocion.tipo_promocion === 'PORCENTAJE'
        ? `${promocion.valor_descuento}%`
        : formatCurrency(promocion.valor_descuento)
      : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={[styles.backIcon, { color: Colors.primary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Promoción</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <View style={styles.heroRow}>
            <Text style={[styles.heroName, { color: theme.text }]}>{promocion.nombre}</Text>
            <Badge
              text={promocion.activa ? 'Activa' : 'Inactiva'}
              color={promocion.activa ? 'success' : 'secondary'}
            />
          </View>
          {descuentoText && (
            <Text style={[styles.heroDescuento, { color: Colors.primary }]}>
              {descuentoText} de descuento
            </Text>
          )}
          {promocion.descripcion && (
            <Text style={[styles.heroDesc, { color: theme.muted }]}>{promocion.descripcion}</Text>
          )}
        </View>

        {/* Details */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Detalles</Text>
          <InfoRow label="Tipo" value={promocion.tipo_promocion} />
          <InfoRow label="Valor descuento" value={descuentoText} />
          <InfoRow label="Fecha inicio" value={formatDate(promocion.fecha_inicio)} />
          <InfoRow label="Fecha fin" value={formatDate(promocion.fecha_fin)} />
        </View>

        <View style={styles.actions}>
          <Button
            title="Editar"
            variant="outline"
            onPress={() => router.push(`/promociones/create?id=${promocion.id_promocion}`)}
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
        title="Eliminar promoción"
        message={`¿Deseas eliminar "${promocion.nombre}"? Esta acción no se puede deshacer.`}
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
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  heroName: {
    ...Typography.h2,
    flex: 1,
  },
  heroDescuento: {
    ...Typography.h3,
    fontWeight: '700',
  },
  heroDesc: {
    ...Typography.body,
    lineHeight: 22,
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
