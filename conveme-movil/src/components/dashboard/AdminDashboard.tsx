import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useAuth } from '../../hooks/useAuth';
import { PredictionChart } from '../PredictionChart';
import { useToast } from '../Toast';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

import { getVentas } from '../../services/venta.service';
import { getEmpleados } from '../../services/empleado.service';
import { getVendedores } from '../../services/vendedor.service';
import { getPedidos } from '../../services/pedido.service';
import { getCortes } from '../../services/corte.service';
import { getEventos } from '../../services/evento.service';
import { formatCurrency } from '../../utils';
import type { Evento } from '../../types';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function QuickActionCard({ icon, label, onPress, color, width }: { icon: IconName; label: string; onPress: () => void; color?: string, width: number }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7} 
      style={[styles.actionCardContainer, { width }]}
    >
      <View style={styles.actionCardShadow}>
        <View style={[styles.actionCard, { borderTopColor: color ?? Colors.primary }]}>
          <View style={[styles.actionIconContainer, { backgroundColor: (color ?? Colors.primary) + '15' }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color ?? Colors.primary} />
          </View>
          <Text style={styles.actionLabel} numberOfLines={1}>{label.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, color, width, isFullWidth }: { icon: IconName; label: string; value: string; color: string, width?: number, isFullWidth?: boolean }) {
  return (
    <View style={[styles.statCardShadow, isFullWidth ? { width: '100%' } : { width }]}>
      <View style={[styles.statCard, { borderLeftColor: color }]}>
        <View style={styles.statWatermark}><MaterialCommunityIcons name={icon} size={64} color={color + '08'} /></View>
        <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}><MaterialCommunityIcons name={icon} size={20} color={color} /></View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
          <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

export function AdminDashboard() {
  const { usuario, logout } = useAuth();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [stats, setStats] = useState({ ingresosMes: 0, pedidosPend: 0, empleados: 0, vendedores: 0 });
  const [historicalData, setHistoricalData] = useState<{ label: string, value: number }[]>([]);
  const [prediction, setPrediction] = useState({ value: 0, label: '' });
  const [loading, setLoading] = useState(false);

  const GRID_PADDING = 20;
  const GAP = 12;
  const cardWidth = (SCREEN_WIDTH - (GRID_PADDING * 2) - GAP) / 2;

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [ventas, cortes, pedidos, empleados, vendedores] = await Promise.all([
        getVentas(), getCortes(), getPedidos(), getEmpleados(), getVendedores()
      ]);
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      const ingresosMes = ventas.filter((v: any) => new Date(v.fecha_venta).getMonth() === m && new Date(v.fecha_venta).getFullYear() === y).reduce((s: number, v: any) => s + v.monto_total, 0) +
        cortes.filter((c: any) => new Date(c.fecha_corte).getMonth() === m && new Date(c.fecha_corte).getFullYear() === y).reduce((s: number, c: any) => s + (c.dinero_total_entregado || 0), 0);
      setStats({ ingresosMes, pedidosPend: pedidos.filter((p: any) => p.estado === 'Pendiente').length, empleados: empleados.length, vendedores: vendedores.length });
      
      const revenueByMonth: Record<string, number> = {};
      [...ventas, ...cortes].forEach((item: any) => {
        const d = new Date(item.fecha_venta || item.fecha_corte);
        if (isNaN(d.getTime())) return;
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        revenueByMonth[mKey] = (revenueByMonth[mKey] || 0) + (item.monto_total || item.dinero_total_entregado || 0);
      });
      const historical = Object.keys(revenueByMonth).sort().slice(-5).map(key => ({ label: key.split('-')[1], value: revenueByMonth[key] }));
      setHistoricalData(historical);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent} 
      showsVerticalScrollIndicator={false} 
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={Colors.primary} />}
    >
      <View style={styles.dashHeader}>
        <View style={styles.dashHeaderRow}>
          <View>
            <Image source={require('../../../assets/images/logon.png')} style={styles.logoImage} contentFit="contain" />
            <Text style={styles.greeting}>HOLA, {usuario?.username?.toUpperCase() ?? 'ADMIN'}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} hitSlop={10}><Text style={styles.logoutText}>SALIR</Text></TouchableOpacity>
        </View>

        <View style={styles.mainKpiContainer}>
          <StatCard icon="cash-multiple" label="Ingresos del último mes" value={formatCurrency(stats.ingresosMes)} color={Colors.primary} isFullWidth />
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="package-variant" label="Pedidos pend." value={String(stats.pedidosPend)} color={Colors.warning} width={cardWidth} />
          <StatCard icon="account-tie" label="Vendedores" value={String(stats.vendedores)} color={Colors.success} width={cardWidth} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCIONES DE NEGOCIO</Text>
        <View style={styles.actionGrid}>
          <QuickActionCard icon="cash-register" label="Ventas" onPress={() => router.push('/ventas')} color={Colors.success} width={cardWidth} />
          <QuickActionCard icon="warehouse" label="Inventario" onPress={() => router.push('/productos')} color={Colors.primary} width={cardWidth} />
          <QuickActionCard icon="bank" label="Cortes" onPress={() => router.push('/cortes')} color={Colors.warning} width={cardWidth} />
          <QuickActionCard icon="account-star-outline" label="Clientes" onPress={() => router.push('/clientes')} color={Colors.pink} width={cardWidth} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADMINISTRACIÓN</Text>
        <View style={styles.actionGrid}>
          <QuickActionCard icon="account-group" label="Empleados" onPress={() => router.push('/empleados')} color={Colors.info} width={cardWidth} />
          <QuickActionCard icon="calendar-star" label="Eventos" onPress={() => router.push('/eventos')} color={Colors.pink} width={cardWidth} />
          <QuickActionCard icon="chart-areaspline" label="Bitácora mes" onPress={() => router.push('/resumen-mensual')} color={Colors.warning} width={cardWidth} />
        </View>
      </View>

      <View style={[styles.section, { paddingBottom: 100 }]}>
        <View style={styles.predSectionShadow}>
          <View style={styles.predSection}>
            <Text style={styles.predTitle}>TENDENCIA DE INGRESOS</Text>
            <PredictionChart data={historicalData} predictedValue={prediction.value} predictedLabel={prediction.label} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100, backgroundColor: Colors.secondary },
  dashHeader: { paddingHorizontal: 20, paddingTop: 20 },
  dashHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  logoImage: { width: 140, height: 40 },
  greeting: { fontSize: 12, fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: 1, marginTop: 4 },
  logoutBtn: { backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: Colors.dark },
  logoutText: { fontSize: 11, fontWeight: '900', color: Colors.primary },
  mainKpiContainer: { marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCardShadow: { backgroundColor: Colors.dark, borderRadius: 16 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: Colors.dark, transform: [{ translateX: -4 }, { translateY: -4 }], overflow: 'hidden' },
  statWatermark: { position: 'absolute', right: -15, bottom: -15 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statInfo: { gap: 2 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: 0.5 },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#1A1A1A', marginBottom: 16, letterSpacing: 1.5 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCardContainer: { marginBottom: 4 },
  actionCardShadow: { backgroundColor: Colors.dark, borderRadius: 14 },
  actionCard: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 10, alignItems: 'center', borderWidth: 2, borderColor: Colors.dark, borderTopWidth: 5, transform: [{ translateX: -4 }, { translateY: -4 }], height: 100, justifyContent: 'center' },
  actionIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 10, fontWeight: '900', color: '#1A1A1A', textAlign: 'center' },
  predSectionShadow: { backgroundColor: Colors.dark, borderRadius: 20 },
  predSection: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 3, borderColor: Colors.dark, transform: [{ translateX: -6 }, { translateY: -6 }] },
  predTitle: { fontSize: 16, fontWeight: '900', marginBottom: 20, letterSpacing: 1 },
});
