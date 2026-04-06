import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useAuth, ROLE_ADMIN } from '../../src/hooks/useAuth';
import { PredictionChart, PredictionStatCard } from '../../src/components/PredictionChart';
import { Toast, useToast } from '../../src/components/Toast';
import { getPrediccionVentasService, PrediccionVentas } from '../../src/services/prediccionesERP.service';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing, BorderRadius } from '../../src/theme/spacing';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// Patrón de fondo Premium
const DashboardPattern = () => (
  <View style={StyleSheet.absoluteFill}>
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <Rect x="0" y="0" width="2" height="2" fill="rgba(0,0,0,0.05)" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dotPattern)" />
    </Svg>
  </View>
);

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function QuickActionCard({ icon, label, onPress, color }: { icon: IconName; label: string; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.actionCard, { borderTopWidth: 5, borderTopColor: color ?? Colors.primary }]}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: (color ?? Colors.primary) + '15' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color ?? Colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, color }: { icon: IconName; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftWidth: 5, borderLeftColor: color }]}>
      <View style={styles.statWatermark}>
          <MaterialCommunityIcons name={icon} size={70} color={color + '08'} />
      </View>
      <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

import { Image } from 'expo-image';
import { getVentas } from '../../src/services/venta.service';
import { getEmpleados } from '../../src/services/empleado.service';
import { getVendedores } from '../../src/services/vendedor.service';
import { getPedidos } from '../../src/services/pedido.service';
import { getCortes } from '../../src/services/corte.service';
import { formatCurrency } from '../../src/utils';

function AdminDashboard() {
  const { usuario, logout } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [stats, setStats] = useState({ ingresosMes: 0, pedidosPend: 0, empleados: 0, vendedores: 0, crecimientoReal: 0 });
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [prediccion, setPrediccion] = useState<PrediccionVentas | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [ventas, cortes, pedidos, empleados, vendedores] = await Promise.all([
        getVentas(), getCortes(), getPedidos(), getEmpleados(), getVendedores()
      ]);
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      
      const totalActual = ventas.filter((v:any) => new Date(v.fecha_venta).getMonth() === m && new Date(v.fecha_venta).getFullYear() === y).reduce((s:number, v:any) => s + v.monto_total, 0) +
                          cortes.filter((c:any) => new Date(c.fecha_corte).getMonth() === m && new Date(c.fecha_corte).getFullYear() === y).reduce((s:number, c:any) => s + (c.dinero_total_entregado || 0), 0);

      setStats(prev => ({ ...prev, ingresosMes: totalActual, pedidosPend: pedidos.filter((p:any) => p.estado === 'Pendiente').length, empleados: empleados.length, vendedores: vendedores.length }));
      
      const revenueByMonth: Record<string, number> = {};
      [...ventas, ...cortes].forEach((item: any) => {
        const d = new Date(item.fecha_venta || item.fecha_corte);
        if (isNaN(d.getTime())) return;
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        revenueByMonth[mKey] = (revenueByMonth[mKey] || 0) + (item.monto_total || item.dinero_total_entregado || 0);
      });
      setHistoricalData(Object.keys(revenueByMonth).sort().slice(-5).map(key => ({ label: key.split('-')[1], value: revenueByMonth[key] })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <View style={{flex: 1}}>
      <DashboardPattern />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={Colors.primary} />}>
        <View style={styles.dashHeader}>
          <View style={styles.dashHeaderRow}>
            <View>
              <Image source={require('../../assets/images/logon.png')} style={styles.logoImage} contentFit="contain" />
              <Text style={styles.greeting}>Bienvenido, {usuario?.username ?? 'Admin'}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}><Text style={styles.logoutText}>SALIR</Text></TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="cash-multiple" label="Ingresos mes" value={formatCurrency(stats.ingresosMes)} color={Colors.success} />
            <StatCard icon="package-variant" label="Pedidos pend." value={String(stats.pedidosPend)} color={Colors.warning} />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="account-group" label="Empleados" value={String(stats.empleados)} color={Colors.info} />
            <StatCard icon="account-tie" label="Vendedores" value={String(stats.vendedores)} color={Colors.primary} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Acciones de Negocio</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard icon="cash-register" label="Punto de Venta" onPress={() => router.push('/(app)/ventas')} color={Colors.success} />
          <QuickActionCard icon="chart-areaspline" label="Resumen Mes" onPress={() => router.push('/(app)/resumen-mensual')} color={Colors.info} />
          <QuickActionCard icon="bank" label="Cortes Caja" onPress={() => router.push('/(app)/cortes')} color={Colors.warning} />
        </View>

        <Text style={styles.sectionTitle}>Administración</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard icon="warehouse" label="Inventario" onPress={() => router.push('/(app)/productos')} color={Colors.primary} />
          <QuickActionCard icon="account-group" label="Clientes" onPress={() => router.push('/(app)/clientes')} color={Colors.info} />
          <QuickActionCard icon="school" label="Escuelas" onPress={() => router.push('/(app)/escuelas')} color={Colors.success} />
        </View>

        <View style={{paddingHorizontal: 20, marginTop: 30, paddingBottom: 100}}>
            <View style={styles.predSection}>
                <Text style={styles.predTitle}>Tendencia de Ingresos</Text>
                <PredictionChart data={historicalData} />
            </View>
        </View>
      </ScrollView>
      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </View>
  );
}

export default function DashboardScreen() {
  const { usuario } = useAuthStore();
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <LinearGradient 
        colors={[Colors.beige, Colors.beigeDark]} 
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill} 
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AdminDashboard />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  dashHeader: { paddingHorizontal: 20, paddingTop: 10 },
  dashHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  logoImage: { width: 130, height: 35 },
  greeting: { fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: '700', marginLeft: 2 },
  logoutBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 2, borderColor: Colors.dark },
  logoutText: { fontSize: 10, fontWeight: '900', color: Colors.primary },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 0, overflow: 'hidden' },
  statWatermark: { position: 'absolute', right: -15, bottom: -15 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statInfo: { gap: 2 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#1A1A1A', marginTop: 25, marginBottom: 12, paddingHorizontal: 20, textTransform: 'uppercase', letterSpacing: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
  actionCard: { flex: 1, minWidth: '28%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1 },
  actionIconContainer: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 10, fontWeight: '900', color: '#1A1A1A', textAlign: 'center' },
  predSection: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  predTitle: { fontSize: 16, fontWeight: '900', marginBottom: 15 },
});
