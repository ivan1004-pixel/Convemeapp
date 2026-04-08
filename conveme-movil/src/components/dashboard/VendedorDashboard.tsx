import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useAuth } from '../../hooks/useAuth';
import { getVentas } from '../../services/venta.service';
import { getPedidos } from '../../services/pedido.service';
import { getCortes } from '../../services/corte.service';
import { formatCurrency } from '../../utils';
import { Colors } from '../../theme/colors';
import { PredictionChart } from '../PredictionChart';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function QuickActionCard({ icon, label, onPress, color, width }: { icon: IconName; label: string; onPress: () => void; color?: string, width: number }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.actionCardContainer, { width }]}>
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

export function VendedorDashboard() {
  const { usuario, logout } = useAuth();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ ventasMes: 0, comisiones: 0, pedidosPend: 0, pinesMes: 0 });
  const [historicalData, setHistoricalData] = useState<{ label: string, value: number }[]>([]);

  const GRID_PADDING = 20;
  const GAP = 12;
  const cardWidth = (SCREEN_WIDTH - (GRID_PADDING * 2) - GAP) / 2;

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [ventas, pedidos, cortes] = await Promise.all([
        getVentas(), 
        getPedidos(),
        getCortes()
      ]);
      
      const miID = usuario?.id_vendedor;
      const misVentas = ventas.filter((v: any) => v.vendedor?.id_vendedor === miID || v.id_vendedor === miID);
      const misPedidos = pedidos.filter((p: any) => p.vendedor?.id_vendedor === miID || p.id_vendedor === miID);
      const misCortes = cortes.filter((c: any) => c.vendedor?.id_vendedor === miID || c.id_vendedor === miID);

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

      const totalPinesVentas = mesActualVentas.reduce((acc: number, v: any) => 
        acc + (v.detalles || []).reduce((sum: number, d: any) => sum + (d.cantidad || 0), 0), 0
      );
      const totalPinesCortes = mesActualCortes.reduce((acc: number, c: any) => 
        acc + (c.detalles || []).reduce((sum: number, d: any) => sum + (d.cantidad_vendida || 0), 0), 0
      );

      const totalPines = totalPinesVentas + totalPinesCortes;
      const totalComisiones = totalPines * 6.6;

      setStats({
        ventasMes: mesActualVentas.length,
        comisiones: totalComisiones,
        pedidosPend: misPedidos.filter((p: any) => p.estado === 'Pendiente').length,
        pinesMes: totalPines
      });

      const revenueByMonth: Record<string, number> = {};
      misVentas.forEach((v: any) => {
        const d = new Date(v.fecha_venta);
        if (isNaN(d.getTime())) return;
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        revenueByMonth[mKey] = (revenueByMonth[mKey] || 0) + v.monto_total;
      });

      const historical = Object.keys(revenueByMonth).sort().slice(-5).map(key => ({ label: key.split('-')[1], value: revenueByMonth[key] }));
      setHistoricalData(historical);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

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
            <Text style={styles.greeting}>HOLA, {usuario?.username?.toUpperCase() ?? 'VENDEDOR'}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} hitSlop={10}><Text style={styles.logoutText}>SALIR</Text></TouchableOpacity>
        </View>

        <View style={styles.mainKpiContainer}>
          <StatCard icon="cash-multiple" label="Mis comisiones" value={formatCurrency(stats.comisiones)} color={Colors.info} isFullWidth />
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="pin" label="Pines Mes" value={String(stats.pinesMes)} color={Colors.success} width={cardWidth} />
          <StatCard icon="point-of-sale" label="Ventas Mes" value={String(stats.ventasMes)} color={Colors.primary} width={cardWidth} />
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="clipboard-list-outline" label="Pedidos Pend." value={String(stats.pedidosPend)} color={Colors.warning} width={cardWidth} />
          <View style={{ width: cardWidth }} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MIS ACCIONES</Text>
        <View style={styles.actionGrid}>
          <QuickActionCard icon="plus-circle" label="Nueva Venta" onPress={() => router.push('/ventas/create')} color={Colors.primary} width={cardWidth} />
          <QuickActionCard icon="account-group" label="Mis Clientes" onPress={() => router.push('/clientes')} color={Colors.success} width={cardWidth} />
          <QuickActionCard icon="clipboard-list" label="Mis Pedidos" onPress={() => router.push('/pedidos')} color={Colors.warning} width={cardWidth} />
        </View>
      </View>

      <View style={[styles.section, { paddingBottom: 100 }]}>
        <View style={styles.predSectionShadow}>
          <View style={styles.predSection}>
            <Text style={styles.predTitle}>MI TENDENCIA PERSONAL</Text>
            <PredictionChart data={historicalData} predictedValue={0} predictedLabel="" />
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
