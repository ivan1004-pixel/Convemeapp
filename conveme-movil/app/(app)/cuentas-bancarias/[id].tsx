import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCuentasBancarias, deleteCuentaBancaria } from '../../../src/services/cuenta-bancaria.service';
import { useCuentaBancariaStore } from '../../../src/store/cuentaBancariaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

export default function CuentaBancariaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { cuentasBancarias, setCuentasBancarias, removeCuentaBancaria } = useCuentaBancariaStore();

  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cuenta = cuentasBancarias.find((c) => String(c.id_cuenta) === String(id));

  useEffect(() => {
    if (!cuenta) {
      setLoading(true);
      getCuentasBancarias()
        .then((data) => setCuentasBancarias(data))
        .catch((err) => showToast(parseGraphQLError(err), 'error'))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCuentaBancaria(parseInt(id, 10));
      removeCuentaBancaria(parseInt(id, 10));
      showToast('Cuenta eliminada', 'success');
      setTimeout(() => router.back(), 1000);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading || !cuenta) return <LoadingSpinner fullScreen />;

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalles</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
               <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="bank" size={32} color={Colors.success} />
               </View>
               <View style={{flex: 1}}>
                  <Text style={styles.bancoTitle}>{cuenta.banco}</Text>
                  <Text style={styles.cuentaId}>ID: {cuenta.id_cuenta}</Text>
               </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>TITULAR</Text>
              <Text style={styles.value}>{cuenta.titular_cuenta}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>NÚMERO DE CUENTA</Text>
              <Text style={styles.value}>{cuenta.numero_cuenta}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>CLABE INTERBANCARIA</Text>
              <Text style={styles.value}>{cuenta.clabe_interbancaria || 'No especificada'}</Text>
            </View>
            
            {cuenta.vendedor && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>VENDEDOR ASIGNADO</Text>
                <View style={styles.vendedorBadge}>
                    <MaterialCommunityIcons name="account-tie" size={16} color={Colors.primary} />
                    <Text style={styles.vendedorText}>{cuenta.vendedor.nombre_completo}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.warning }]}
                onPress={() => router.push(`/(app)/cuentas-bancarias/create?id=${id}`)}
            >
                <MaterialCommunityIcons name="pencil" size={20} color={Colors.dark} />
                <Text style={[styles.actionText, { color: Colors.dark }]}>EDITAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.error }]}
                onPress={() => setShowDelete(true)}
            >
                <MaterialCommunityIcons name="delete" size={20} color="#FFF" />
                <Text style={[styles.actionText, { color: '#FFF' }]}>ELIMINAR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={showDelete}
          title="Eliminar cuenta"
          message="¿Deseas eliminar esta cuenta bancaria? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
          destructive
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
  },
  scroll: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: 20,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 15,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.success + '15',
    borderWidth: 2,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bancoTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.dark,
  },
  cuentaId: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.4)',
  },
  detailRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  vendedorBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.primary,
  },
  vendedorText: {
      fontSize: 14,
      fontWeight: '800',
      color: Colors.primary,
  },
  actions: {
      gap: 12,
  },
  actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: Colors.dark,
      gap: 8,
      shadowColor: Colors.dark,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
  },
  actionText: {
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 1,
  },
});
