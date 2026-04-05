import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePedidosStore } from '@/src/store/pedidosStore';
import { deletePedido } from '@/src/services/pedido.service';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { Divider } from '@/src/components/ui/Divider';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { formatDate, formatCurrency } from '@/src/utils/formatters';
import { parseApiError } from '@/src/utils/errors';

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { pedidos, removePedido } = usePedidosStore();
  const { can } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);

  const pedido = pedidos.find((p) => p.id_pedido === Number(id));

  const handleDelete = () => {
    if (!pedido) return;
    Alert.alert(
      'Eliminar pedido',
      '¿Estás seguro de que quieres eliminar este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deletePedido(pedido.id_pedido);
              removePedido(pedido.id_pedido);
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

  if (!pedido) return <LoadingSpinner fullScreen message="Cargando..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
        {can('pedidos:delete') && (
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
        <Card style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>Pedido #{pedido.id_pedido}</Text>
            <StatusBadge status={pedido.estado} />
          </View>
          {pedido.fecha_pedido && (
            <Text style={styles.date}>Fecha: {formatDate(pedido.fecha_pedido)}</Text>
          )}
          {pedido.fecha_entrega && (
            <Text style={styles.date}>Entrega: {formatDate(pedido.fecha_entrega)}</Text>
          )}
        </Card>

        {pedido.cliente && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.sectionValue}>{pedido.cliente.nombre_completo}</Text>
          </Card>
        )}

        {pedido.vendedor && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Vendedor</Text>
            <Text style={styles.sectionValue}>{pedido.vendedor.nombre_completo}</Text>
          </Card>
        )}

        {pedido.detalles && pedido.detalles.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Productos</Text>
            {pedido.detalles.map((d, i) => (
              <View key={i}>
                {i > 0 && <Divider />}
                <View style={styles.row}>
                  <Text style={styles.productName}>{d.producto?.nombre ?? 'Producto'}</Text>
                  <Text style={styles.cantidad}>
                    x{d.cantidad} — {formatCurrency(d.precio_unitario)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {pedido.notas && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.sectionValue}>{pedido.notas}</Text>
          </Card>
        )}
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
  mainCard: { marginBottom: Spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { ...Typography.h3, color: Colors.text },
  date: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: Spacing.sm },
  sectionTitle: {
    ...Typography.caption, color: Colors.textSecondary,
    textTransform: 'uppercase', marginBottom: 8, fontWeight: '700',
  },
  sectionValue: { ...Typography.body, color: Colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  productName: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  cantidad: { ...Typography.body, color: Colors.textSecondary },
});
