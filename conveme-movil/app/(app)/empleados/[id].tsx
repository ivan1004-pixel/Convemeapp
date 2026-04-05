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
import { getEmpleados, deleteEmpleado } from '../../../src/services/empleado.service';
import { useEmpleadoStore } from '../../../src/store/empleadoStore';
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
import type { Empleado } from '../../../src/types';

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

export default function EmpleadoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { empleados, setEmpleados, removeEmpleado } = useEmpleadoStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const empleado: Empleado | undefined = empleados.find(
    (e) => e.id_empleado === Number(id)
  );

  const fetchIfNeeded = useCallback(async () => {
    if (empleado) return;
    setLoading(true);
    try {
      const data = await getEmpleados();
      setEmpleados(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [empleado, setEmpleados]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    if (!empleado) return;
    setDeleting(true);
    try {
      await deleteEmpleado(empleado.id_empleado);
      removeEmpleado(empleado.id_empleado);
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [empleado, removeEmpleado]);

  if (loading || !empleado) {
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

  const address = [
    empleado.calle_y_numero,
    empleado.colonia,
    empleado.codigo_postal,
  ]
    .filter(Boolean)
    .join(', ');

  const location = [
    empleado.municipio?.nombre,
    empleado.municipio?.estado?.nombre,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={[styles.backIcon, { color: Colors.primary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Empleado</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Avatar name={empleado.nombre_completo} size={72} />
          <Text style={[styles.heroName, { color: theme.text }]}>{empleado.nombre_completo}</Text>
          {empleado.puesto && (
            <Text style={[styles.heroPuesto, { color: Colors.primary }]}>{empleado.puesto}</Text>
          )}
        </View>

        {/* Contact section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contacto</Text>
          <InfoRow label="Email" value={empleado.email} />
          <InfoRow label="Teléfono" value={empleado.telefono ? formatPhone(empleado.telefono) : null} />
        </View>

        {/* Address section */}
        {address && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Dirección</Text>
            <InfoRow label="Calle y número" value={empleado.calle_y_numero} />
            <InfoRow label="Colonia" value={empleado.colonia} />
            <InfoRow label="C.P." value={empleado.codigo_postal} />
            <InfoRow label="Municipio" value={location || null} />
          </View>
        )}

        {/* Usuario section */}
        {empleado.usuario && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Usuario</Text>
            <InfoRow label="Username" value={empleado.usuario.username} />
            <InfoRow label="Rol" value={empleado.usuario.rol?.nombre} />
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Editar"
            variant="outline"
            onPress={() => router.push(`/empleados/create?id=${empleado.id_empleado}`)}
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
        title="Eliminar empleado"
        message={`¿Deseas eliminar a "${empleado.nombre_completo}"? Esta acción no se puede deshacer.`}
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
  },
  heroPuesto: {
    ...Typography.body,
    fontWeight: '600',
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
