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
import { getComprobantes } from '../../../src/services/comprobante.service';
import { Colors } from '../../../src/theme/colors';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { ComprobanteTicket } from '../../../src/components/ui/ComprobanteTicket';
import { parseGraphQLError } from '../../../src/utils';
import type { Comprobante } from '../../../src/types';

import { useAuth } from '../../../src/hooks/useAuth';

export default function VendedorComprobanteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { usuario } = useAuth();
  
  const [comprobante, setComprobante] = useState<Comprobante | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list: Comprobante[] = await getComprobantes();
      const found = list.find((c) => 
        c.id_comprobante === Number(id) && (
          c.vendedor?.id_vendedor === usuario?.id_vendedor || 
          c.vendedor_id === usuario?.id_vendedor
        )
      );
      if (found) {
        setComprobante(found);
      }
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast, usuario]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <LoadingSpinner message="Generando vista de ticket..." />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  if (!comprobante) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
          </View>
          <View style={styles.center}>
            <Text style={styles.notFound}>Comprobante no encontrado.</Text>
          </View>
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>VISTA DE TICKET</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
        >
          <View style={styles.ticketWrapper}>
            <ComprobanteTicket comprobante={comprobante} />
          </View>
          
          <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={18} color="rgba(0,0,0,0.4)" />
              <Text style={styles.infoText}>
                  Este es un registro histórico. Los datos de liquidación no pueden ser modificados una vez guardados.
              </Text>
          </View>
        </ScrollView>
        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: { paddingBottom: 60, alignItems: 'center' },
  ticketWrapper: { marginTop: 10, marginBottom: 30 },
  infoBox: { flexDirection: 'row', gap: 10, paddingHorizontal: 30, alignItems: 'center', opacity: 0.6 },
  infoText: { fontSize: 11, fontWeight: '700', color: Colors.dark, flex: 1, lineHeight: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  notFound: { fontSize: 16, fontWeight: '800', color: 'rgba(0,0,0,0.3)' },
});
