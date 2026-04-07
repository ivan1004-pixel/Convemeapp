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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getEscuelas, deleteEscuela } from '../../../src/services/escuela.service';
import { useEscuelaStore } from '../../../src/store/escuelaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
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
  const { escuelas, setEscuelas, removeEscuela } = useEscuelaStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const escuela: Escuela | undefined = escuelas.find((e) => e.id_escuela === Number(id));

  const fetchIfNeeded = useCallback(async () => {
    if (escuela) return;
    setLoading(true);
    try {
      const data = await getEscuelas();
      setEscuelas(data);
    } catch (err) {
      Alert.alert('ERROR', parseGraphQLError(err));
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
      removeEscuela(escuela.id_escuela);
      router.push('/(app)');
    } catch (err) {
      Alert.alert('ERROR', parseGraphQLError(err));
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [escuela, removeEscuela]);

  if (loading || !escuela) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
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
          <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
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
            <View style={styles.heroInitials}>
              <Text style={styles.heroInitialsText}>{escuela.siglas.toUpperCase()}</Text>
            </View>
            <Text style={styles.heroName}>{escuela.nombre.toUpperCase()}</Text>
            <Badge
              text={escuela.activa ? 'ACTIVA' : 'INACTIVA'}
              color={escuela.activa ? 'success' : 'secondary'}
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
            <TouchableOpacity style={styles.deleteLink} onPress={() => setShowConfirm(true)}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                <Text style={styles.deleteLinkText}>ELIMINAR ESTA ESCUELA</Text>
            </TouchableOpacity>
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
  heroInitials: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark, marginBottom: 15 },
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
});
