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
import { getClientes, deleteCliente } from '../../../src/services/cliente.service';
import { useClienteStore } from '../../../src/store/clienteStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Shadows } from '../../../src/theme/shadows';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError, formatPhone, formatDate } from '../../../src/utils';
import type { Cliente } from '../../../src/types';

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

export default function ClienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { clientes, setClientes, removeCliente } = useClienteStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const cliente: Cliente | undefined = clientes.find(
    (c) => c.id_cliente === Number(id)
  );

  const fetchIfNeeded = useCallback(async () => {
    if (cliente) return;
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  }, [cliente, setClientes]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    if (!cliente) return;
    setDeleting(true);
    try {
      await deleteCliente(cliente.id_cliente);
      removeCliente(cliente.id_cliente);
      router.back();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('foreign key constraint fails') || msg.includes('a parent row')) {
        Alert.alert(
          'No se puede eliminar',
          'Este cliente tiene ventas o pedidos registrados. Para mantener la integridad de los datos, no es posible eliminarlo por completo.'
        );
      } else {
        Alert.alert('Error', parseGraphQLError(err));
      }
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [cliente, removeCliente]);

  if (loading || !cliente) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
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
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cliente</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Avatar name={cliente.nombre_completo} size={72} />
          <Text style={[styles.heroName, { color: theme.text }]}>{cliente.nombre_completo}</Text>
          <Text style={[styles.heroPuesto, { color: Colors.info }]}>CLIENTE REGISTRADO</Text>
        </View>

        {/* Contact section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contacto</Text>
          <InfoRow label="Email" value={cliente.email || 'No registrado'} />
          <InfoRow label="Teléfono" value={cliente.telefono ? formatPhone(cliente.telefono) : 'No registrado'} />
        </View>

        {/* Address section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ubicación y Registro</Text>
          <InfoRow label="Dirección de envío" value={cliente.direccion_envio || 'No registrada'} />
          <InfoRow label="Fecha de registro" value={formatDate(cliente.fecha_registro)} />
        </View>

        {/* Usuario section */}
        {cliente.usuario && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Usuario Vinculado</Text>
            <InfoRow label="Username" value={cliente.usuario.username} />
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Editar"
            variant="outline"
            onPress={() => router.push(`/clientes/create?id=${cliente.id_cliente}`)}
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
        title="Eliminar cliente"
        message={`¿Deseas eliminar a "${cliente.nombre_completo}"? Esta acción no se puede deshacer.`}
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
