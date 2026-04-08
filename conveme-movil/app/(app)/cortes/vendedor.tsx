import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, Layout, FadeInRight } from 'react-native-reanimated';
import { getCortes } from '../../../src/services/corte.service';
import { useCorteStore } from '../../../src/store/corteStore';
import { Colors } from '../../../src/theme/colors';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError, formatDate, formatCurrency } from '../../../src/utils';
import type { Corte } from '../../../src/types';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { useAuth } from '../../../src/hooks/useAuth';

function CorteCard({ item, index, onPress }: { item: Corte; index: number; onPress: () => void }) {
  const diff = item.diferencia_corte || 0;
  const isOk = Math.abs(diff) < 0.01;

  return (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).duration(500).springify()}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="cash-register" size={28} color={Colors.success} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.cardMeta}>CORTE #{item.id_corte} • ASIG #{item.asignacion?.id_asignacion}</Text>
            <Text style={styles.infoText}>{formatDate(item.fecha_corte).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOk ? Colors.success + '22' : Colors.error + '22', borderColor: isOk ? Colors.success : Colors.error }]}>
            <Text style={[styles.statusText, { color: isOk ? Colors.success : Colors.error }]}>
              {isOk ? 'CUADRADO' : 'CON DIF.'}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.moneyRow}>
              <View style={styles.moneyItem}>
                  <Text style={styles.moneyLabel}>ENTREGADO</Text>
                  <Text style={styles.moneyValue}>{formatCurrency(item.dinero_total_entregado || 0)}</Text>
              </View>
          </View>
          {!isOk && (
              <View style={styles.diffAlert}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.diffText}>DIFERENCIA: {formatCurrency(diff)}</Text>
              </View>
          )}
        </View>
        
        <View style={styles.cardFooter}>
           <Text style={styles.footerAction}>VER DETALLES</Text>
           <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.success} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function VendedorCortesScreen() {
  const { usuario } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const { cortes, setCortes } = useCorteStore();
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCortes();
      // Filtrar por el vendedor logueado usando id_vendedor
      const myCortes = data.filter(c => 
        c.vendedor?.id_vendedor === usuario?.id_vendedor || 
        c.id_vendedor === usuario?.id_vendedor
      );
      setCortes(myCortes);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [usuario, setCortes, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Animated.View entering={FadeInRight.duration(600)} style={styles.header}>
            <View style={styles.headerTitleRow}>
                <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>MIS CORTES</Text>
                    <Text style={styles.subtitle}>{cortes.length} REGISTROS</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => router.push('/cortes/create')} style={styles.addBtn}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                    <MaterialCommunityIcons name="refresh" size={24} color={Colors.dark} />
                </TouchableOpacity>
            </View>
        </Animated.View>

        {loading && cortes.length === 0 ? (
          <LoadingSpinner message="CARGANDO..." />
        ) : (
          <FlatList
            data={cortes}
            keyExtractor={(item) => String(item.id_corte)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <CorteCard item={item} index={index} onPress={() => router.push(`/cortes/${item.id_corte}`)} />
            )}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={Colors.primary} />}
            ListEmptyComponent={
              <EmptyState
                icon="cash-register"
                title="SIN CORTES"
                message="AÚN NO HAS REALIZADO CORTES."
                actionLabel="REALIZAR CORTE"
                onAction={() => router.push('/cortes/create')}
              />
            }
          />
        )}
        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.dark, textTransform: 'uppercase' },
  subtitle: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1 },
  cardPressed: { transform: [{translateY: 2}, {translateX: 2}], shadowOffset: {width: 2, height: 2} },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatarContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.success + '10', borderWidth: 3, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  headerInfo: { flex: 1 },
  cardMeta: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 2 },
  statusText: { fontSize: 8, fontWeight: '900' },
  cardContent: { gap: 8, borderTopWidth: 2, borderTopColor: Colors.dark, paddingTop: 12, paddingBottom: 12 },
  moneyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, borderWidth: 2, borderColor: Colors.dark },
  moneyItem: { flex: 1, alignItems: 'center' },
  moneyLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 2 },
  moneyValue: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  diffAlert: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.error + '10', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.error },
  diffText: { fontSize: 10, fontWeight: '800', color: Colors.error },
  infoText: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.5)' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: Colors.dark, paddingTop: 12 },
  footerAction: { fontSize: 10, fontWeight: '900', color: Colors.success, letterSpacing: 0.5 },
});
