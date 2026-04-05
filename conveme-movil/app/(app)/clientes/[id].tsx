import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useClientesStore } from '@/src/store/clientesStore';
import { deleteCliente } from '@/src/services/cliente.service';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { Divider } from '@/src/components/ui/Divider';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { formatDate } from '@/src/utils/formatters';
import { parseApiError } from '@/src/utils/errors';

export default function ClienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { clientes, removeCliente } = useClientesStore();
  const { can } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);

  const cliente = clientes.find((c) => c.id_cliente === Number(id));

  const handleDelete = () => {
    if (!cliente) return;
    Alert.alert(
      'Eliminar cliente',
      '¿Estás seguro de que quieres eliminar este cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteCliente(cliente.id_cliente);
              removeCliente(cliente.id_cliente);
              router.back();
            } catch (err) {
              Alert.alert('Error', parseApiError(err));
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!cliente) return <LoadingSpinner fullScreen message="Cargando..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
        {can('clientes:delete') && (
          <Button
            title="Eliminar"
            onPress={handleDelete}
            variant="danger"
            size="small"
            loading={isDeleting}
          />
        )}
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {cliente.nombre_completo.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.nombre}>{cliente.nombre_completo}</Text>
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Información de contacto</Text>
          {cliente.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📧 Email</Text>
              <Text style={styles.infoValue}>{cliente.email}</Text>
            </View>
          )}
          {cliente.telefono && (
            <>
              <Divider />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📞 Teléfono</Text>
                <Text style={styles.infoValue}>{cliente.telefono}</Text>
              </View>
            </>
          )}
          {cliente.direccion && (
            <>
              <Divider />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍 Dirección</Text>
                <Text style={styles.infoValue}>{cliente.direccion}</Text>
              </View>
            </>
          )}
          {cliente.fecha_registro && (
            <>
              <Divider />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📅 Registro</Text>
                <Text style={styles.infoValue}>{formatDate(cliente.fecha_registro)}</Text>
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  navBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  backBtn: { padding: 4 },
  backText: { ...Typography.body, color: Colors.primary },
  scroll: { padding: Spacing.screenPadding, paddingTop: 0, paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { ...Typography.h1, color: Colors.white, fontSize: 32 },
  nombre: { ...Typography.h2, color: Colors.text },
  section: { marginBottom: Spacing.sm },
  sectionTitle: {
    ...Typography.label, color: Colors.textSecondary, marginBottom: 12,
    textTransform: 'uppercase', fontSize: 11,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, flexWrap: 'wrap' },
  infoLabel: { ...Typography.body, color: Colors.textSecondary },
  infoValue: { ...Typography.body, color: Colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
});
