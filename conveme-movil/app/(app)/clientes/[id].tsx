import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getClientes, deleteCliente } from '../../../src/services/cliente.service';
import { useClienteStore } from '../../../src/store/clienteStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Avatar } from '../../../src/components/ui/Avatar';

const AVATAR_LG = 56;
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { formatDate, parseGraphQLError, formatPhone } from '../../../src/utils';
import type { Cliente } from '../../../src/types';

function DetailRow({ label, value }: { label: string; value: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.label, { color: theme.muted }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light2.border,
  },
  label: { ...Typography.bodySmall },
  value: {
    ...Typography.bodySmall,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: Spacing.sm,
  },
});

export default function ClienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const { clientes, setClientes, removeCliente } = useClienteStore();
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const clienteId = Number(id);
  const cliente: Cliente | undefined = clientes.find((c) => c.id_cliente === clienteId);

  const fetchIfNeeded = useCallback(async () => {
    if (!cliente) {
      setLoading(true);
      try {
        const data = await getClientes();
        setClientes(data);
      } catch (err) {
        Alert.alert('Error', parseGraphQLError(err));
      } finally {
        setLoading(false);
      }
    }
  }, [cliente, setClientes]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteCliente(clienteId);
      removeCliente(clienteId);
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }, [clienteId, removeCliente]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingSpinner fullScreen message="Cargando cliente..." />
      </SafeAreaView>
    );
  }

  if (!cliente) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Cliente</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.notFound}>
          <Text style={{ ...Typography.body, color: theme.muted }}>Cliente no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {cliente.nombre_completo}
        </Text>
        <Pressable
          onPress={() => setShowDelete(true)}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel="Eliminar cliente"
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileContent}>
            <Avatar name={cliente.nombre_completo} size={AVATAR_LG} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {cliente.nombre_completo}
              </Text>
              {cliente.usuario && (
                <Text style={[styles.profileUsername, { color: theme.muted }]}>
                  @{cliente.usuario.username}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Contact Card */}
        <Card title="Contacto" style={styles.sectionCard}>
          <DetailRow label="Email" value={cliente.email ?? 'No registrado'} />
          <DetailRow label="Teléfono" value={formatPhone(cliente.telefono)} />
          <DetailRow label="Dirección" value={cliente.direccion_envio ?? 'No registrada'} />
          <DetailRow label="Registro" value={formatDate(cliente.fecha_registro)} />
        </Card>

        {/* Quick Actions */}
        {(cliente.email || cliente.telefono) && (
          <Card title="Acciones rápidas" style={styles.sectionCard}>
            <View style={styles.quickActions}>
              {cliente.email && (
                <Pressable
                  onPress={() => Linking.openURL(`mailto:${cliente.email}`)}
                  style={({ pressed }) => [
                    styles.quickActionBtn,
                    { borderColor: Colors.primary },
                    pressed && styles.quickActionPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickActionIcon}>✉️</Text>
                  <Text style={[styles.quickActionText, { color: Colors.primary }]}>Email</Text>
                </Pressable>
              )}
              {cliente.telefono && (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${cliente.telefono}`)}
                  style={({ pressed }) => [
                    styles.quickActionBtn,
                    { borderColor: Colors.success },
                    pressed && styles.quickActionPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.quickActionIcon}>📞</Text>
                  <Text style={[styles.quickActionText, { color: Colors.success }]}>Llamar</Text>
                </Pressable>
              )}
            </View>
          </Card>
        )}

        {/* Actions */}
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
            onPress={() => setShowDelete(true)}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showDelete}
        title="Eliminar cliente"
        message={`¿Deseas eliminar a "${cliente.nombre_completo}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  backIcon: { fontSize: 22, color: Colors.primary },
  title: { ...Typography.h4, flex: 1 },
  headerPlaceholder: { width: 32 },
  deleteBtn: { padding: Spacing.xs },
  deleteIcon: { fontSize: 20 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  profileCard: { marginBottom: Spacing.md },
  profileContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  profileInfo: { flex: 1 },
  profileName: { ...Typography.h4, marginBottom: Spacing.xs },
  profileUsername: { ...Typography.bodySmall },
  sectionCard: { marginBottom: Spacing.md },
  quickActions: { flexDirection: 'row', gap: Spacing.sm },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
  },
  quickActionPressed: { opacity: 0.75 },
  quickActionIcon: { fontSize: 16 },
  quickActionText: { ...Typography.buttonSmall },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
