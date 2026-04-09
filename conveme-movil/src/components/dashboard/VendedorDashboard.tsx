import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { getVentas } from '../../services/venta.service';
import { getPedidos } from '../../services/pedido.service';
import { getCortes } from '../../services/corte.service';
import { formatCurrency } from '../../utils';
import { Colors } from '../../theme/colors';
import { PredictionChart } from '../PredictionChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 6;
const GRID_PADDING = 20;
const BUTTON_WIDTH = (SCREEN_WIDTH - (GRID_PADDING * 2) - (CARD_MARGIN * 6)) / 3;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function QuickActionCard({ icon, label, onPress, color, index }: { icon: IconName; label: string; onPress: () => void; color?: string, index: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(100 * index)} style={styles.animatedCardContainer}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.actionCard, { borderTopColor: color ?? Colors.primary }]}>
        <View style={[styles.actionIconContainer, { backgroundColor: (color ?? Colors.primary) + '15' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color ?? Colors.primary} />
        </View>
        <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatCard({ icon, label, value, color, index }: { icon: IconName; label: string; value: string; color: string, index: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(100 * index)} style={{ flex: 1 }}>
      <View style={[styles.statCard, { borderLeftColor: color }]}>
        <View style={styles.statWatermark}><MaterialCommunityIcons name={icon} size={60} color={color + '08'} /></View>
        <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}><MaterialCommunityIcons name={icon} size={18} color={color} /></View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Helper para regresión
function getLinearRegression(data: { label: string, value: number }[]) {
  const n = data.length;
  if (n < 2) return { predict: (x: number) => (data[0]?.value || 0) };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  data.forEach((point, i) => { sumX += i; sumY += point.value; sumXY += i * point.value; sumXX += i * i; });
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { predict: (x: number) => (isNaN(slope) ? data[0].value : slope * x + intercept) };
}

export function VendedorDashboard() {
  const { usuario, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ ventasMes: 0, comisiones: 0, pedidosPend: 0, pinesMes: 0 });
  const [historicalData, setHistoricalData] = useState<{ label: string, value: number }[]>([]);
  const [prediction, setPrediction] = useState({ value: 0, label: '' });

  const loadStats = useCallback(async () => {
    // Solo proceder si tenemos token y usuario cargado
    const { token } = useAuthStore.getState();
    if (!token || !usuario) return;

    setLoading(true);
    try {
      const [ventas, pedidos, cortes] = await Promise.all([
        getVentas(0, 50), 
        getPedidos(0, 50),
        getCortes('', 0, 50)
      ]);
      
      // Filtrar por el vendedor logueado usando id_vendedor
      const miID = usuario?.id_vendedor;

      const misVentas = ventas.filter((v: any) => 
        v.vendedor?.id_vendedor === miID || 
        v.id_vendedor === miID
      );
      const misPedidos = pedidos.filter((p: any) => 
        p.vendedor?.id_vendedor === miID || 
        p.id_vendedor === miID
      );
      const misCortes = cortes.filter((c: any) => 
        c.vendedor?.id_vendedor === miID || 
        c.id_vendedor === miID
      );

      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();

      const mesActualVentas = misVentas.filter((v: any) => {
        const d = new Date(v.fecha_venta);
        return d.getMonth() === m && d.getFullYear() === y;
      });

      const mesActualCortes = misCortes.filter((c: any) => {
        const d = new Date(c.fecha_corte);
        return d.getMonth() === m && d.getFullYear() === y;
      });

      const totalVentasMes = mesActualVentas.length;
      
      // NUEVA LÓGICA: Calcular total de "pines" (unidades) vendidos en el mes
      const totalPinesVentas = mesActualVentas.reduce((acc: number, v: any) => 
        acc + (v.detalles || []).reduce((sum: number, d: any) => sum + (d.cantidad || 0), 0), 0
      );

      const totalPinesCortes = mesActualCortes.reduce((acc: number, c: any) => 
        acc + (c.detalles || []).reduce((sum: number, d: any) => sum + (d.cantidad_vendida || 0), 0), 0
      );

      const totalPines = totalPinesVentas + totalPinesCortes;
      
      // La comisión se calcula como: total de pines * 6.6
      const totalComisiones = totalPines * 6.5;

      setStats({
        ventasMes: totalVentasMes,
        comisiones: totalComisiones,
        pedidosPend: misPedidos.filter((p: any) => p.estado === 'Pendiente').length,
        pinesMes: totalPines
      });

      // Gráfica solo con sus ventas
      const revenueByMonth: Record<string, number> = {};
      misVentas.forEach((v: any) => {
        const d = new Date(v.fecha_venta);
        if (isNaN(d.getTime())) return;
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        revenueByMonth[mKey] = (revenueByMonth[mKey] || 0) + v.monto_total;
      });

      const historical = Object.keys(revenueByMonth).sort().slice(-5).map(key => ({ label: key.split('-')[1], value: revenueByMonth[key] }));
      setHistoricalData(historical);

      if (historical.length > 1) {
        const regression = getLinearRegression(historical);
        const lastMonthLabel = Object.keys(revenueByMonth).sort().slice(-1)[0];
        const lastMonthDate = new Date(lastMonthLabel + '-02T12:00:00Z');
        const nextMonthDate = new Date(lastMonthDate.setMonth(lastMonthDate.getMonth() + 1));
        const nextMonthLabel = (nextMonthDate.getMonth() + 1).toString().padStart(2, '0');
        setPrediction({ value: regression.predict(historical.length) > 0 ? regression.predict(historical.length) : 0, label: nextMonthLabel });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={Colors.primary} />}>
      <View style={styles.dashHeader}>
        <Animated.View entering={FadeInUp.duration(500)}>
          <View style={styles.dashHeaderRow}>
            <View>
              <Image source={require('../../../assets/images/logon.png')} style={styles.logoImage} contentFit="contain" />
              <Text style={styles.greeting}>Bienvenido, {usuario?.username ?? 'Vendedor'}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}><Text style={styles.logoutText}>SALIR</Text></TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          <StatCard index={1} icon="pin" label="Pines Mes" value={String(stats.pinesMes)} color={Colors.success} />
          <StatCard index={2} icon="cash-multiple" label="Mis Comisiones" value={formatCurrency(stats.comisiones)} color={Colors.info} />
        </View>
        <View style={styles.statsRow}>
          <StatCard index={3} icon="point-of-sale" label="Ventas Mes" value={String(stats.ventasMes)} color={Colors.primary} />
          <StatCard index={4} icon="clipboard-list-outline" label="Pedidos Pend." value={String(stats.pedidosPend)} color={Colors.warning} />
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>MIS ACCIONES</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard index={1} icon="plus-circle" label="Nueva Venta" onPress={() => router.push('/ventas/create')} color={Colors.primary} />
          <QuickActionCard index={2} icon="account-group" label="Mis Clientes" onPress={() => router.push('/clientes')} color={Colors.success} />
          <QuickActionCard index={3} icon="clipboard-list" label="Mis Pedidos" onPress={() => router.push('/pedidos')} color={Colors.warning} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 30, paddingBottom: 100 }}>
        <View style={styles.predSection}>
          <Text style={styles.predTitle}>MI TENDENCIA PERSONAL</Text>
          <PredictionChart data={historicalData} predictedValue={prediction.value} predictedLabel={prediction.label} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  dashHeader: { paddingHorizontal: 20, paddingTop: 10 },
  dashHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  logoImage: { width: 130, height: 35 },
  greeting: { fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: '700', marginLeft: 2 },
  logoutBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 2, borderColor: Colors.dark },
  logoutText: { fontSize: 10, fontWeight: '900', color: Colors.primary },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 0, overflow: 'hidden' },
  statWatermark: { position: 'absolute', right: -15, bottom: -15 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statInfo: { gap: 2 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#1A1A1A', marginTop: 10, marginBottom: 12, paddingHorizontal: 20, textTransform: 'uppercase', letterSpacing: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: GRID_PADDING - CARD_MARGIN, justifyContent: 'flex-start' },
  animatedCardContainer: { width: BUTTON_WIDTH, margin: CARD_MARGIN },
  actionCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center', borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, borderTopWidth: 4, height: 95, justifyContent: 'center' },
  actionIconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 8.5, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', width: '100%', textTransform: 'uppercase' },
  predSection: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  predTitle: { fontSize: 16, fontWeight: '900', marginBottom: 15 },
});
