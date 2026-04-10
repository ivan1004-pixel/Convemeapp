import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getClientes, deleteCliente, updateCliente } from '../../../src/services/cliente.service';
import { useClienteStore } from '../../../src/store/clienteStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { formatPhone, formatDate, parseGraphQLError } from '../../../src/utils';
import type { Cliente } from '../../../src/types';

const CLIENTE_IMAGES = [
  require('../../../assets/images/fotoc1.jpg'),
  require('../../../assets/images/fotoc2.jpg'),
  require('../../../assets/images/fotoc3.jpg'),
];

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: string }) {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.labelContainer}>
        {icon && <MaterialCommunityIcons name={icon as any} size={16} color="rgba(0,0,0,0.4)" style={{ marginRight: 6 }} />}
        <Text style={infoStyles.label}>{label}</Text>
      </View>
      <Text style={infoStyles.value}>{value.toUpperCase()}</Text>
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

export default function ClienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clientes, setClientes, removeCliente } = useClienteStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

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
        setShowErrorModal(true);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [cliente, removeCliente]);

  if (loading || !cliente) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <LoadingSpinner fullScreen message="CARGANDO..." />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  const imageIndex = cliente.id_cliente % CLIENTE_IMAGES.length;
  const avatarImage = CLIENTE_IMAGES[imageIndex];

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>CLIENTE</Text>
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
                    <Text style={styles.heroName}>{cliente.nombre_completo.toUpperCase()}</Text>
                    <Text style={styles.heroPuesto}>CLIENTE REGISTRADO</Text>
                </View>
            </View>
          </View>

          {/* Contact section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>CONTACTO</Text>
            <InfoRow label="EMAIL" value={cliente.email || 'NO REGISTRADO'} icon="email-outline" />
            <InfoRow label="TELÉFONO" value={cliente.telefono ? formatPhone(cliente.telefono) : 'NO REGISTRADO'} icon="phone-outline" />
          </View>

          {/* Address section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>UBICACIÓN Y REGISTRO</Text>
            <InfoRow label="DIRECCIÓN" value={cliente.direccion_envio || 'NO REGISTRADA'} icon="map-marker-outline" />
            <InfoRow label="REGISTRO" value={formatDate(cliente.fecha_registro)} icon="calendar-check-outline" />
          </View>

          <View style={styles.actions}>
            <Button
              title="EDITAR CLIENTE"
              onPress={() => router.push(`/clientes/create?id=${cliente.id_cliente}`)}
              style={styles.actionBtn}
              size="lg"
            />
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={showConfirm}
          title="ELIMINAR CLIENTE"
          message={`¿DESEAS ELIMINAR A "${cliente.nombre_completo.toUpperCase()}"?`}
          confirmText="ELIMINAR"
          cancelText="CANCELAR"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
          destructive
        />

        {/* MODAL ERROR BELLO */}
        <Modal visible={showErrorModal} transparent animationType="fade">
            <View style={styles.errorOverlay}>
                <View style={styles.errorCard}>
                    <Image source={require('../../../assets/images/memeerror.png')} style={styles.errorImg} resizeMode="contain" />
                    <Text style={styles.errorTitle}>¡UPS! NO PODEMOS HACER ESO</Text>
                    <Text style={styles.errorDesc}>
                        Este cliente es muy importante y tiene registros (pedidos o ventas) vinculados. 
                        {"\n\n"}
                        Para no perder tu historia, este registro se mantendrá seguro en tu base de datos.
                    </Text>
                    <Button 
                        title="ENTENDIDO" 
                        onPress={() => setShowErrorModal(false)} 
                        variant="primary"
                        style={{ width: '100%' }}
                    />
                </View>
            </View>
        </Modal>

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
  badgeContainer: { alignSelf: 'flex-start' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
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
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  statusValue: { fontSize: 12, fontWeight: '900' },
  statusToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, borderWidth: 2, borderColor: Colors.dark },
  toggleOn: { backgroundColor: Colors.success },
  toggleOff: { backgroundColor: Colors.error },
  statusToggleText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  actions: { marginTop: Spacing.sm },
  actionBtn: {
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5,
  },
  errorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 25, padding: 30, alignItems: 'center', borderWidth: 4, borderColor: Colors.dark, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 1 },
  errorImg: { width: 200, height: 200, marginBottom: 20 },
  errorTitle: { fontSize: 18, fontWeight: '900', color: Colors.error, marginBottom: 15, textAlign: 'center' },
  errorDesc: { fontSize: 14, fontWeight: '700', color: 'rgba(0,0,0,0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
});