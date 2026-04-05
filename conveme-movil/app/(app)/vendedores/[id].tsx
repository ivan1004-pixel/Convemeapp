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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getVendedores, deleteVendedor } from '../../../src/services/vendedor.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError, formatPhone } from '../../../src/utils';
import type { Vendedor } from '../../../src/types';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  if (value === undefined || value === null || value === '') return null;
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
    fontWeight: '600',
  },
});

export default function VendedorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list: Vendedor[] = await getVendedores();
      const found = list.find((v) => v.id_vendedor === Number(id));
      setVendedor(found ?? null);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(async () => {
    if (!vendedor) return;
    setDeleting(true);
    try {
      await deleteVendedor(vendedor.id_vendedor);
      router.back();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('foreign key constraint fails') || msg.includes('a parent row')) {
        Alert.alert(
          'No se puede eliminar',
          'Este vendedor tiene registros asociados (ventas, comisiones, etc.). No es posible eliminarlo por completo.'
        );
      } else {
        Alert.alert('Error', parseGraphQLError(err));
      }
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [vendedor]);

  if (loading || !vendedor) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Detalle</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <LoadingSpinner fullScreen message="Cargando..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Vendedor</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Avatar name={vendedor.nombre_completo} size={72} />
          <Text style={[styles.heroName, { color: theme.text }]}>{vendedor.nombre_completo}</Text>
          <Text style={[styles.heroPuesto, { color: Colors.primary }]}>
            {vendedor.escuela?.nombre || 'SIN ESCUELA ASIGNADA'}
          </Text>
        </View>

        {/* Contact section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contacto</Text>
          <InfoRow label="Email" value={vendedor.email} />
          <InfoRow label="Teléfono" value={vendedor.telefono ? formatPhone(vendedor.telefono) : null} />
          <InfoRow label="Instagram" value={vendedor.instagram_handle ? `@${vendedor.instagram_handle}` : null} />
        </View>

        {/* Académico / Laboral */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Información Académica</Text>
          <InfoRow label="Escuela" value={vendedor.escuela?.nombre} />
          <InfoRow label="Facultad / Campus" value={vendedor.facultad_o_campus} />
          <InfoRow label="Punto de entrega" value={vendedor.punto_entrega_habitual} />
          <InfoRow label="Estado laboral" value={vendedor.estado_laboral} />
        </View>

        {/* Comisiones section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Comisiones y Metas</Text>
          <InfoRow label="Comisión Menudeo" value={`${vendedor.comision_fija_menudeo}%`} />
          <InfoRow label="Comisión Mayoreo" value={`${vendedor.comision_fija_mayoreo}%`} />
          <InfoRow label="Meta Mensual" value={`$${vendedor.meta_ventas_mensual}`} />
        </View>

        {/* Ubicación section */}
        {vendedor.municipio && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Ubicación</Text>
            <InfoRow label="Municipio" value={vendedor.municipio.nombre} />
            <InfoRow label="Estado" value={vendedor.municipio.estado?.nombre} />
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Editar"
            variant="outline"
            onPress={() => router.push(`/vendedores/create?id=${vendedor.id_vendedor}`)}
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
        title="Eliminar vendedor"
        message={`¿Deseas eliminar a "${vendedor.nombre_completo}"? Esta acción no se puede deshacer.`}
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
  headerTitle: {
    ...Typography.h3,
    fontWeight: '900',
  },
  headerPlaceholder: {
    width: 34,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 3,
    gap: Spacing.md,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroName: {
    ...Typography.h2,
    textAlign: 'center',
    fontWeight: '900',
  },
  heroPuesto: {
    ...Typography.body,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    fontWeight: '800',
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
