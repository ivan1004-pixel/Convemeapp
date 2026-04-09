import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPromociones, deletePromocion } from '../../../src/services/promocion.service';
import { usePromocionStore } from '../../../src/store/promocionStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError, formatDate } from '../../../src/utils';
import type { Promocion } from '../../../src/types';
import { Badge } from '../../../src/components/ui/Badge';

function getPromocionStatus(promo: Promocion): { label: string; color: string } {
  const now = new Date();
  const start = new Date(promo.fecha_inicio);
  const end = new Date(promo.fecha_fin);

  if (!promo.activa) return { label: 'INACTIVA', color: '#6B7280' };
  if (now < start) return { label: 'PRÓXIMA', color: Colors.info };
  if (now >= start && now <= end) return { label: 'ACTIVA', color: Colors.success };
  return { label: 'VENCIDA', color: Colors.error };
}

export default function PromocionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show, hide } = useToast();
  const { promociones, setPromociones, removePromocion } = usePromocionStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const promocion: Promocion | undefined = promociones.find(
    (p) => p.id_promocion === Number(id),
  );

  const fetchData = useCallback(async () => {
    if (promocion) return;
    setLoading(true);
    try {
      const data = await getPromociones();
      setPromociones(data);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [promocion, setPromociones, show]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(async () => {
    if (!promocion) return;
    setDeleting(true);
    try {
      await deletePromocion(promocion.id_promocion);
      removePromocion(promocion.id_promocion);
      show('Promoción eliminada correctamente', 'success');
      setShowConfirm(false);
      setTimeout(() => router.replace('/promociones'), 1200);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  }, [promocion, removePromocion, show]);

  if (loading || !promocion) {
    return (
      <LoadingSpinner fullScreen message="Cargando promoción..." />
    );
  }

  const status = getPromocionStatus(promocion);

  return (
    <NeobrutalistBackground>
    <SafeAreaView style={styles.container} edges={['top']}>
    <View style={styles.header}>
    <TouchableOpacity
    onPress={() => router.replace('/promociones')}
    style={styles.backBtn}
    >
    <MaterialCommunityIcons
    name="arrow-left"
    size={24}
    color={Colors.dark}
    />
    </TouchableOpacity>
    <Text style={styles.title}>DETALLE PROMOCIÓN</Text>
    <TouchableOpacity
    onPress={() =>
      router.push(
        `/promociones/create?id=${promocion.id_promocion}`,
      )
    }
    style={styles.editBtn}
    >
    <MaterialCommunityIcons
    name="pencil"
    size={20}
    color={Colors.primary}
    />
    </TouchableOpacity>
    </View>

    <ScrollView
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
    >
    <View style={styles.mainCard}>
    <View style={styles.heroIcon}>
    <MaterialCommunityIcons
    name="sale-outline"
    size={40}
    color={status.color}
    />
    </View>
    <Text style={styles.promoName}>
    {promocion.nombre.toUpperCase()}
    </Text>
    <Badge
    text={status.label}
    color={
      status.label === 'ACTIVA'
      ? 'success'
      : status.label === 'PRÓXIMA'
      ? 'info'
      : status.label === 'INACTIVA'
      ? 'default'
      : 'error'
    }
    style={{ marginTop: 10 }}
    />
    </View>

    <Text style={styles.sectionTitle}>DETALLES</Text>

    <View style={styles.detailsContainer}>
    <View style={styles.detailRow}>
    <MaterialCommunityIcons
    name="format-list-bulleted-type"
    size={20}
    color={Colors.primary}
    />
    <View style={styles.detailInfo}>
    <Text style={styles.detailLabel}>TIPO</Text>
    <Text style={styles.detailValue}>
    {promocion.tipo_promocion.toUpperCase()}
    </Text>
    </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.detailRow}>
    <MaterialCommunityIcons
    name="calendar-range"
    size={20}
    color={Colors.info}
    />
    <View style={styles.detailInfo}>
    <Text style={styles.detailLabel}>PERIODO</Text>
    <Text style={styles.detailValue}>
    {formatDate(promocion.fecha_inicio)} –{' '}
    {formatDate(promocion.fecha_fin)}
    </Text>
    </View>
    </View>

    {promocion.valor_descuento != null && (
      <>
      <View style={styles.divider} />
      <View style={styles.detailRow}>
      <MaterialCommunityIcons
      name="percent-outline"
      size={20}
      color={Colors.success}
      />
      <View style={styles.detailInfo}>
      <Text style={styles.detailLabel}>VALOR</Text>
      <Text style={styles.detailValue}>
      {promocion.valor_descuento}
      </Text>
      </View>
      </View>
      </>
    )}

    {promocion.descripcion ? (
      <>
      <View style={styles.divider} />
      <View style={styles.detailRow}>
      <MaterialCommunityIcons
      name="text"
      size={20}
      color={Colors.dark}
      />
      <View style={styles.detailInfo}>
      <Text style={styles.detailLabel}>DESCRIPCIÓN</Text>
      <Text style={styles.detailDesc}>
      {promocion.descripcion}
      </Text>
      </View>
      </View>
      </>
    ) : null}
    </View>

    <TouchableOpacity
    style={styles.deleteBtn}
    onPress={() => setShowConfirm(true)}
    >
    <MaterialCommunityIcons
    name="trash-can-outline"
    size={20}
    color={Colors.error}
    />
    <Text style={styles.deleteBtnText}>ELIMINAR PROMOCIÓN</Text>
    </TouchableOpacity>
    </ScrollView>

    <ConfirmDialog
    visible={showConfirm}
    title="Eliminar promoción"
    message={`¿Deseas eliminar "${promocion.nombre}"? Esta acción no se puede deshacer.`}
    confirmText="Eliminar"
    onConfirm={handleDelete}
    onCancel={() => setShowConfirm(false)}
    loading={deleting}
    destructive
    />

    <Toast
    visible={toast.visible}
    type={toast.type}
    message={toast.message}
    onHide={hide}
    />
    </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  title: { fontSize: 18, fontWeight: '900', color: Colors.dark },
  scrollContent: { padding: 20, paddingBottom: 100 },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    marginBottom: 25,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  promoName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.4)',
                                 marginBottom: 15,
                                 textTransform: 'uppercase',
                                 letterSpacing: 1,
  },
  detailsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  detailInfo: { flex: 1 },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.4)',
                                 textTransform: 'uppercase',
  },
  detailValue: { fontSize: 14, fontWeight: '900', color: Colors.dark },
  detailDesc: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  divider: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
                                 marginVertical: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: Colors.error,
    backgroundColor: Colors.error + '05',
    marginBottom: 40,
  },
  deleteBtnText: {
    color: Colors.error,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
});
