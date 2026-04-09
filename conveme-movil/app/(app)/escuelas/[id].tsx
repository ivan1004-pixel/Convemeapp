import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// 🟢 Importamos updateEscuela
import { getEscuelas, deleteEscuela, updateEscuela } from '../../../src/services/escuela.service';
import { useEscuelaStore } from '../../../src/store/escuelaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast'; // 🟢 Agregado el Toast
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { parseGraphQLError } from '../../../src/utils';
import type { Escuela } from '../../../src/types';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
    <Text style={styles.infoValue}>{value.toUpperCase()}</Text>
    </View>
  );
}

export default function EscuelaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  // 🟢 Traemos updateEscuelaStore para actualizar el estado local al reactivar
  const { escuelas, setEscuelas, removeEscuela, updateEscuela: updateEscuelaStore } = useEscuelaStore();

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const escuela: Escuela | undefined = escuelas.find((e) => e.id_escuela === Number(id));

  const fetchIfNeeded = useCallback(async () => {
    if (escuela) return;
    setLoading(true);
    try {
      const data = await getEscuelas();
      setEscuelas(data);
    } catch (err) {
      setErrorMessage('No pudimos cargar la información de esta escuela.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }, [escuela, setEscuelas]);

  useEffect(() => {
    fetchIfNeeded();
  }, [fetchIfNeeded]);

  const handleDelete = useCallback(async () => {
    if (!escuela) return;
    setDeleting(true);
    try {
      await deleteEscuela(escuela.id_escuela);
      // En lugar de borrarla de la lista de React, mejor la actualizamos a inactiva localmente
      updateEscuelaStore({ ...escuela, activa: false });

      showToast('ESCUELA ELIMINADA', 'success');
      setTimeout(() => router.replace('/escuelas'), 1500);
    } catch (err) {
      setErrorMessage(parseGraphQLError(err));
      setShowErrorModal(true);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [escuela, updateEscuelaStore, showToast]);

  // 🟢 NUEVA FUNCIÓN: Reactivar Escuela
  const handleReactivate = useCallback(async () => {
    if (!escuela) return;
    setLoading(true);
    try {
      const updated = await updateEscuela({ id_escuela: escuela.id_escuela, activa: true });
      updateEscuelaStore({ ...escuela, ...updated, activa: true });
      showToast('¡ESCUELA REACTIVADA!', 'success');
    } catch (err) {
      setErrorMessage(parseGraphQLError(err));
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }, [escuela, updateEscuelaStore, showToast]);

  if (loading || !escuela) {
    return (
      <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => router.replace('/escuelas')} style={styles.backBtn}>
      <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>DETALLE</Text>
      <View style={styles.headerPlaceholder} />
      </View>
      <LoadingSpinner fullScreen message="CARGANDO..." />
      </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  return (
    <NeobrutalistBackground>
    <SafeAreaView style={styles.container}>
    <View style={styles.header}>
    <TouchableOpacity onPress={() => router.replace('/escuelas')} style={styles.backBtn}>
    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>ESCUELA</Text>
    <View style={styles.headerPlaceholder} />
    </View>

    <ScrollView
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
    >
    {/* Hero card */}
    <View style={styles.heroCard}>
    <View style={[styles.heroInitials, !escuela.activa && { backgroundColor: Colors.error + '15', borderColor: Colors.error }]}>
    <Text style={[styles.heroInitialsText, !escuela.activa && { color: Colors.error }]}>
    {escuela.siglas.substring(0, 3).toUpperCase()}
    </Text>
    </View>
    <Text style={styles.heroName}>{escuela.nombre.toUpperCase()}</Text>
    <Badge
    text={escuela.activa ? 'ACTIVA' : 'INACTIVA'}
    color={escuela.activa ? 'success' : 'error'}
    />
    </View>

    {/* Info section */}
    <View style={styles.card}>
    <Text style={styles.sectionTitle}>INFORMACIÓN GENERAL</Text>
    <InfoRow label="NOMBRE" value={escuela.nombre} />
    <InfoRow label="SIGLAS" value={escuela.siglas} />
    <InfoRow label="MUNICIPIO" value={escuela.municipio?.nombre} />
    <InfoRow label="ESTADO" value={escuela.municipio?.estado?.nombre} />
    </View>

    <View style={styles.actions}>
    <Button
    title="EDITAR ESCUELA"
    onPress={() => router.push(`/escuelas/create?id=${escuela.id_escuela}`)}
    style={styles.actionBtn}
    size="lg"
    />

    {/* 🟢 LÓGICA DEL BOTÓN DISCRETO */}
    {escuela.activa ? (
      <TouchableOpacity style={styles.deleteLink} onPress={() => setShowConfirm(true)}>
      <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
      <Text style={styles.deleteLinkText}>ELIMINAR ESTA ESCUELA</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.reactivateLink} onPress={handleReactivate}>
      <MaterialCommunityIcons name="restore" size={20} color={Colors.success} />
      <Text style={styles.reactivateLinkText}>REACTIVAR ESTA ESCUELA</Text>
      </TouchableOpacity>
    )}
    </View>
    </ScrollView>

    <ConfirmDialog
    visible={showConfirm}
    title="ELIMINAR ESCUELA"
    message={`¿DESEAS ELIMINAR "${escuela.nombre.toUpperCase()}"?`}
    confirmText="ELIMINAR"
    cancelText="CANCELAR"
    onConfirm={handleDelete}
    onCancel={() => setShowConfirm(false)}
    loading={deleting}
    destructive
    />

    <Modal visible={showErrorModal} transparent animationType="fade">
    <View style={styles.errorOverlay}>
    <View style={styles.errorCard}>
    <Image source={require('../../../assets/images/memeerror.png')} style={styles.errorImg} resizeMode="contain" />
    <Text style={styles.errorTitle}>¡UPS! ALGO SALIÓ MAL</Text>
    <Text style={styles.errorDesc}>
    {errorMessage || 'No pudimos realizar esta acción con la escuela.'}
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

    <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h4, fontWeight: '900', color: Colors.dark },
  headerPlaceholder: { width: 40 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 100 },
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    elevation: 6
  },
  heroInitials: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary, marginBottom: 15 },
  heroInitialsText: { color: Colors.primary, fontWeight: '900', fontSize: 24 },
  heroName: { fontSize: 20, fontWeight: '900', color: Colors.dark, textAlign: 'center', marginBottom: 10 },
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
  sectionTitle: { fontSize: 10, fontWeight: '900', color: Colors.primary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 1.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
                                 infoLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.5)', flex: 1 },
                                 infoValue: { fontSize: 13, fontWeight: '800', color: Colors.dark, flex: 2, textAlign: 'right' },
                                 actions: { marginTop: Spacing.sm, gap: 15 },
                                 actionBtn: { shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 },
                                 deleteLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
                                 deleteLinkText: { fontSize: 12, fontWeight: '900', color: Colors.error, textDecorationLine: 'underline' },
                                 // 🟢 Estilos del nuevo botón de reactivar
                                 reactivateLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
                                 reactivateLinkText: { fontSize: 12, fontWeight: '900', color: Colors.success, textDecorationLine: 'underline' },

                                 errorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
                                 errorCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 25, padding: 30, alignItems: 'center', borderWidth: 4, borderColor: Colors.dark, shadowColor: '#000', shadowOffset: { width: 10, height: 10 }, shadowOpacity: 1 },
                                 errorImg: { width: 200, height: 200, marginBottom: 20 },
                                 errorTitle: { fontSize: 18, fontWeight: '900', color: Colors.error, marginBottom: 15, textAlign: 'center' },
                                 errorDesc: { fontSize: 14, fontWeight: '700', color: 'rgba(0,0,0,0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
});
