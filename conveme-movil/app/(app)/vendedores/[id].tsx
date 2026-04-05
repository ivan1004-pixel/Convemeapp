import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getVendedores } from '../../../src/services/vendedor.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Badge } from '../../../src/components/ui/Badge';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';
import type { Vendedor } from '../../../src/types';

function InfoRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value?: string | null;
  isDark: boolean;
}) {
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
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  label: { ...Typography.bodySmall, flex: 1 },
  value: { ...Typography.body, flex: 1.5, textAlign: 'right', fontWeight: '500' },
});

export default function VendedorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingSpinner fullScreen message="Cargando vendedor..." />
      </SafeAreaView>
    );
  }

  if (!vendedor) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backText, { color: Colors.primary }]}>‹ Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: theme.muted }]}>Vendedor no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: Colors.primary }]}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {vendedor.nombre_completo}
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/vendedores/create',
              params: {
                id: String(vendedor.id_vendedor),
                nombre_completo: vendedor.nombre_completo,
                email: vendedor.email ?? '',
                telefono: vendedor.telefono ?? '',
                instagram_handle: vendedor.instagram_handle ?? '',
                comision_fija_menudeo: String(vendedor.comision_fija_menudeo ?? ''),
                comision_fija_mayoreo: String(vendedor.comision_fija_mayoreo ?? ''),
                meta_ventas_mensual: String(vendedor.meta_ventas_mensual ?? ''),
              },
            })
          }
        >
          <Text style={[styles.editText, { color: Colors.primary }]}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Datos personales</Text>
          <InfoRow label="Nombre" value={vendedor.nombre_completo} isDark={isDark} />
          <InfoRow label="Email" value={vendedor.email} isDark={isDark} />
          <InfoRow label="Teléfono" value={vendedor.telefono} isDark={isDark} />
          <InfoRow
            label="Instagram"
            value={vendedor.instagram_handle ? `@${vendedor.instagram_handle}` : null}
            isDark={isDark}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Comisiones y metas</Text>
          <View style={styles.badgeRow}>
            {vendedor.comision_fija_menudeo != null && (
              <Badge text={`Menudeo ${vendedor.comision_fija_menudeo}%`} color="primary" size="sm" />
            )}
            {vendedor.comision_fija_mayoreo != null && (
              <Badge text={`Mayoreo ${vendedor.comision_fija_mayoreo}%`} color="secondary" size="sm" />
            )}
          </View>
          {vendedor.meta_ventas_mensual != null && (
            <InfoRow
              label="Meta mensual"
              value={`$${vendedor.meta_ventas_mensual.toLocaleString('es-MX')}`}
              isDark={isDark}
            />
          )}
        </View>

        {(vendedor.escuela || vendedor.municipio) && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Ubicación</Text>
            <InfoRow label="Escuela" value={vendedor.escuela?.nombre} isDark={isDark} />
            <InfoRow label="Municipio" value={vendedor.municipio?.nombre} isDark={isDark} />
            <InfoRow label="Estado" value={vendedor.municipio?.estado?.nombre} isDark={isDark} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backText: { ...Typography.body, fontWeight: '600' },
  title: { ...Typography.h4, flex: 1 },
  editText: { ...Typography.body, fontWeight: '600' },
  content: { padding: Spacing.lg, gap: Spacing.md },
  section: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  sectionTitle: { ...Typography.label, marginBottom: Spacing.sm },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...Typography.body },
});
