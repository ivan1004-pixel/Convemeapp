import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getVendedores, deleteVendedor } from '../../../src/services/vendedor.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { parseGraphQLError, formatPhone } from '../../../src/utils';
import type { Vendedor } from '../../../src/types';

const VENDEDOR_IMAGES = [
  require('../../../assets/images/fotv1.jpg'),
  require('../../../assets/images/fotv2.jpg'),
  require('../../../assets/images/fotv3.jpg'),
];

function InfoRow({ label, value, icon }: { label: string; value?: string | number | null; icon?: string }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.labelContainer}>
        {icon && <MaterialCommunityIcons name={icon as any} size={16} color="rgba(0,0,0,0.4)" style={{ marginRight: 6 }} />}
        <Text style={infoStyles.label}>{label}</Text>
      </View>
      <Text style={infoStyles.value}>{String(value).toUpperCase()}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  labelContainer: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' },
  value: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: Spacing.sm,
  },
});

export default function VendedorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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
      Alert.alert('ERROR', parseGraphQLError(err));
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
      router.push('/(app)');
    } catch (err: any) {
      Alert.alert('ERROR', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [vendedor]);

  if (loading || !vendedor) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>DETALLE</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <LoadingSpinner fullScreen message="CARGANDO..." />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  const imageIndex = vendedor.id_vendedor % VENDEDOR_IMAGES.length;
  const avatarImage = VENDEDOR_IMAGES[imageIndex];

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>VENDEDOR</Text>
          <TouchableOpacity onPress={() => setShowConfirm(true)} style={styles.deleteHeaderBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero card */}
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
                <View style={styles.heroIconContainer}>
                    <Image source={avatarImage} style={styles.heroAvatar} />
                </View>
                <View style={styles.heroInfo}>
                    <Text style={styles.heroName}>{vendedor.nombre_completo.toUpperCase()}</Text>
                    <Text style={styles.heroPuesto}>{vendedor.escuela?.nombre?.toUpperCase() || 'SIN ESCUELA'}</Text>
                </View>
            </View>
          </View>

          {/* Contact section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>CONTACTO</Text>
            <InfoRow label="EMAIL" value={vendedor.email} icon="email-outline" />
            <InfoRow label="TELÉFONO" value={vendedor.telefono ? formatPhone(vendedor.telefono) : null} icon="phone-outline" />
            <InfoRow label="INSTAGRAM" value={vendedor.instagram_handle ? `@${vendedor.instagram_handle}` : null} icon="instagram" />
          </View>

          {/* Laboral section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>INFORMACIÓN LABORAL</Text>
            <InfoRow label="ESCUELA" value={vendedor.escuela?.nombre} icon="school-outline" />
            <InfoRow label="COMISIÓN MENUDEO" value={`${vendedor.comision_fija_menudeo}%`} icon="percent-outline" />
            <InfoRow label="COMISIÓN MAYOREO" value={`${vendedor.comision_fija_mayoreo}%`} icon="percent-outline" />
            <InfoRow label="META MENSUAL" value={`$${vendedor.meta_ventas_mensual}`} icon="trending-up" />
          </View>

          {/* Ubicación section */}
          {vendedor.municipio && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>UBICACIÓN</Text>
              <InfoRow label="MUNICIPIO" value={vendedor.municipio.nombre} icon="map-marker-outline" />
              <InfoRow label="ESTADO" value={vendedor.municipio.estado?.nombre} icon="city-variant-outline" />
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title="EDITAR VENDEDOR"
              onPress={() => router.push(`/vendedores/create?id=${vendedor.id_vendedor}`)}
              style={styles.actionBtn}
              size="lg"
            />
          </View>

          <TouchableOpacity 
            style={styles.deleteFooterBtn}
            onPress={() => setShowConfirm(true)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
            <Text style={styles.deleteFooterText}>ELIMINAR ESTE REGISTRO</Text>
          </TouchableOpacity>
        </ScrollView>

        <ConfirmDialog
          visible={showConfirm}
          title="ELIMINAR VENDEDOR"
          message={`¿DESEAS ELIMINAR A "${vendedor.nombre_completo.toUpperCase()}"?`}
          confirmText="ELIMINAR"
          cancelText="CANCELAR"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
          destructive
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.h4, fontWeight: '900', color: Colors.dark },
  headerPlaceholder: { width: 40 },
  deleteHeaderBtn: { padding: Spacing.xs },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    elevation: 6
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroIconContainer: {
    width: 75,
    height: 75,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark,
    overflow: 'hidden',
  },
  heroAvatar: { width: '100%', height: '100%' },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '900', color: Colors.dark, marginBottom: 2 },
  heroPuesto: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 1, marginBottom: 6 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  actions: { marginTop: Spacing.sm },
  actionBtn: {
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5,
  },
  deleteFooterBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: Spacing.xl, 
    gap: 8 
  },
  deleteFooterText: { 
    fontSize: 11, 
    fontWeight: '900', 
    color: Colors.error, 
    textDecorationLine: 'underline' 
  },
});
