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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useAuthStore } from '../../src/store/authStore';
import { useAuth, ROLE_ADMIN } from '../../src/hooks/useAuth';
import { PredictionChart } from '../../src/components/PredictionChart';
import { Toast, useToast } from '../../src/components/Toast';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing } from '../../src/theme/spacing';

import { Image } from 'expo-image';
import { getVentas } from '../../src/services/venta.service';
import { getEmpleados } from '../../src/services/empleado.service';
import { getVendedores } from '../../src/services/vendedor.service';
import { getPedidos } from '../../src/services/pedido.service';
import { getCortes } from '../../src/services/corte.service';
import { formatCurrency } from '../../src/utils';

// --- Helper de Regresión Lineal ---
function getLinearRegression(data: {label: string, value: number}[]) {
    const n = data.length;
    // Necesitamos al menos dos puntos para una línea
    if (n < 2) {
      return { predict: (x: number) => (data[0]?.value || 0) };
    }
  
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    data.forEach((point, i) => {
      sumX += i;
      sumY += point.value;
      sumXY += i * point.value;
      sumXX += i * i;
    });
  
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
  
    // Si la pendiente no es un número (división por cero), devolvemos un valor plano
    if (isNaN(slope)) {
        return { predict: (x: number) => data[0].value };
    }

    return { predict: (x: number) => slope * x + intercept };
}


// Patrón de fondo de partículas
const DashboardPattern = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <Rect x="0" y="0" width="3" height="3" fill={Colors.dark} opacity="0.05" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dotPattern)" />
    </Svg>
  </View>
);

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// --- Componentes Reutilizables ---

function QuickActionCard({ icon, label, onPress, color }: { icon: IconName; label: string; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.actionCard, { borderTopColor: color ?? Colors.primary }]}
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
    <View style={[styles.statCard, { borderLeftColor: color }]}>
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

// --- Componentes Animados ---

const AnimatedStatCard = ({ icon, label, value, color, index }: { icon: IconName; label: string; value: string; color: string, index: number }) => (
    <Animated.View entering={FadeInUp.duration(500).delay(100 * index)} style={{flex: 1}}>
        <StatCard icon={icon} label={label} value={value} color={color} />
    </Animated.View>
);

const AnimatedQuickActionCard = ({ icon, label, onPress, color, index }: { icon: IconName; label: string; onPress: () => void; color?: string, index: number }) => (
    <Animated.View entering={FadeInUp.duration(500).delay(100 * index)} style={{flex: 1, minWidth: '28%'}}>
        <QuickActionCard icon={icon} label={label} onPress={onPress} color={color} />
    </Animated.View>
);


// --- Dashboards por Rol ---

function AdminDashboard() {
  const { usuario, logout } = useAuth();
  const [stats, setStats] = useState({ ingresosMes: 0, pedidosPend: 0, empleados: 0, vendedores: 0 });
  const [historicalData, setHistoricalData] = useState<{label: string, value: number}[]>([]);
  const [prediction, setPrediction] = useState({ value: 0, label: '' });
  const [growth, setGrowth] = useState(0);
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
      
      const ingresosMes = ventas.filter((v:any) => new Date(v.fecha_venta).getMonth() === m && new Date(v.fecha_venta).getFullYear() === y).reduce((s:number, v:any) => s + v.monto_total, 0) +
                          cortes.filter((c:any) => new Date(c.fecha_corte).getMonth() === m && new Date(c.fecha_corte).getFullYear() === y).reduce((s:number, c:any) => s + (c.dinero_total_entregado || 0), 0);

      setStats({ ingresosMes, pedidosPend: pedidos.filter((p:any) => p.estado === 'Pendiente').length, empleados: empleados.length, vendedores: vendedores.length });
      
      const revenueByMonth: Record<string, number> = {};
      [...ventas, ...cortes].forEach((item: any) => {
        const d = new Date(item.fecha_venta || item.fecha_corte);
        if (isNaN(d.getTime())) return;
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        revenueByMonth[mKey] = (revenueByMonth[mKey] || 0) + (item.monto_total || item.dinero_total_entregado || 0);
      });

      const historical = Object.keys(revenueByMonth).sort().slice(-5).map(key => ({ label: key.split('-')[1], value: revenueByMonth[key] }));
      setHistoricalData(historical);

      if (historical.length > 1) {
        const regression = getLinearRegression(historical);
        const nextX = historical.length;
        const predictedValue = regression.predict(nextX);
        
        const lastMonthLabel = Object.keys(revenueByMonth).sort().slice(-1)[0];
        const lastMonthDate = new Date(lastMonthLabel + '-02T12:00:00Z');
        const nextMonthDate = new Date(lastMonthDate.setMonth(lastMonthDate.getMonth() + 1));
        const nextMonthLabel = (nextMonthDate.getMonth() + 1).toString().padStart(2, '0');
        
        const currentMonthRevenue = ingresosMes > 0 ? ingresosMes : historical[historical.length - 1].value;
        const growthPercentage = currentMonthRevenue > 0 
            ? ((predictedValue - currentMonthRevenue) / currentMonthRevenue) * 100
            : 0;
        
        setGrowth(growthPercentage);
        setPrediction({ value: predictedValue > 0 ? predictedValue : 0, label: nextMonthLabel });
      } else {
        setPrediction({ value: 0, label: '' });
        setGrowth(0);
      }

    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={Colors.primary} />}>
      <View style={styles.dashHeader}>
        <Animated.View entering={FadeInUp.duration(500)}>
            <View style={styles.dashHeaderRow}>
                <View>
                <Image source={require('../../assets/images/logon.png')} style={styles.logoImage} contentFit="contain" />
                <Text style={styles.greeting}>Bienvenido, {usuario?.username ?? 'Admin'}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}><Text style={styles.logoutText}>SALIR</Text></TouchableOpacity>
            </View>
        </Animated.View>
        <View style={styles.statsRow}>
          <AnimatedStatCard index={1} icon="cash-multiple" label="Ingresos mes" value={formatCurrency(stats.ingresosMes)} color={Colors.success} />
          <AnimatedStatCard index={2} icon="package-variant" label="Pedidos pend." value={String(stats.pedidosPend)} color={Colors.warning} />
        </View>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={{flex: 1}} 
            onPress={() => router.push('/(app)/empleados')}
            activeOpacity={0.8}
          >
            <StatCard icon="account-group" label="Empleados" value={String(stats.empleados)} color={Colors.info} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={{flex: 1}} 
            onPress={() => router.push('/(app)/vendedores')}
            activeOpacity={0.8}
          >
            <StatCard icon="account-tie" label="Vendedores" value={String(stats.vendedores)} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
            <AnimatedStatCard index={5} icon="trending-up" label="Crecimiento Estimado" value={`${growth.toFixed(1)}%`} color={Colors.pink} />
        </View>
      </View>

      <Animated.View entering={FadeInUp.duration(500).delay(400)}>
        <Text style={styles.sectionTitle}>Acciones de Negocio</Text>
        <View style={styles.actionsGrid}>
            <AnimatedQuickActionCard index={1} icon="cash-register" label="Punto de Venta" onPress={() => router.push('/(app)/ventas')} color={Colors.success} />
            <AnimatedQuickActionCard index={2} icon="chart-areaspline" label="Resumen Mes" onPress={() => router.push('/(app)/resumen-mensual')} color={Colors.info} />
            <AnimatedQuickActionCard index={3} icon="bank" label="Cortes Caja" onPress={() => router.push('/(app)/cortes')} color={Colors.warning} />
        </View>
      </Animated.View>
      
      <Animated.View entering={FadeInUp.duration(500).delay(500)}>
        <Text style={styles.sectionTitle}>Administración</Text>
        <View style={styles.actionsGrid}>
            <AnimatedQuickActionCard index={1} icon="warehouse" label="Inventario" onPress={() => router.push('/(app)/productos')} color={Colors.primary} />
            <AnimatedQuickActionCard index={2} icon="account-hard-hat" label="Empleados" onPress={() => router.push('/(app)/empleados')} color={Colors.warning} />
            <AnimatedQuickActionCard index={3} icon="receipt" label="Comprobantes" onPress={() => router.push('/(app)/comprobantes')} color={Colors.success} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(550)}>
        <View style={styles.actionsGrid} style={{marginTop: 12}}>
            <AnimatedQuickActionCard index={1} icon="clipboard-account-outline" label="Asignaciones" onPress={() => router.push('/(app)/asignaciones')} color={Colors.info} />
            <AnimatedQuickActionCard index={2} icon="account-tie" label="Vendedores" onPress={() => router.push('/(app)/vendedores')} color={Colors.primary} />
            <View style={{flex: 1}} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(600)} style={{paddingHorizontal: 20, marginTop: 30, paddingBottom: 100}}>
          <View style={styles.predSection}>
              <Text style={styles.predTitle}>Tendencia de Ingresos</Text>
              <PredictionChart data={historicalData} predictedValue={prediction.value} predictedLabel={prediction.label} />
          </View>
      </Animated.View>
    </ScrollView>
  );
}

function VendedorDashboard() {
    const { usuario, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    // NOTE: Hardcoded stats as per user request to not modify services
    const [stats, setStats] = useState({ ventasMes: 12, comisiones: 450.50 });
  
    const loadStats = useCallback(async () => {
      // This is a placeholder. According to the user's request,
      // we should not implement new service calls.
      setLoading(true);
      // Example: const sales = await getSalesByVendor(usuario.id);
      // setStats({ ventasMes: sales.count, comisiones: sales.totalCommission });
      setTimeout(() => setLoading(false), 500); // Simulate loading
    }, []);
  
    useEffect(() => { loadStats(); }, [loadStats]);
  
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={Colors.primary} />}>
        <View style={styles.dashHeader}>
            <Animated.View entering={FadeInUp.duration(500)}>
                <View style={styles.dashHeaderRow}>
                    <View>
                    <Image source={require('../../assets/images/logon.png')} style={styles.logoImage} contentFit="contain" />
                    <Text style={styles.greeting}>Bienvenido, {usuario?.username ?? 'Vendedor'}</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}><Text style={styles.logoutText}>SALIR</Text></TouchableOpacity>
                </View>
            </Animated.View>
            <View style={styles.statsRow}>
                <AnimatedStatCard index={1} icon="point-of-sale" label="Ventas del Mes" value={String(stats.ventasMes)} color={Colors.success} />
                <AnimatedStatCard index={2} icon="cash-usd-outline" label="Comisiones" value={formatCurrency(stats.comisiones)} color={Colors.info} />
            </View>
        </View>
  
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
            <Text style={styles.sectionTitle}>Mis Acciones</Text>
            <View style={styles.actionsGrid}>
                <AnimatedQuickActionCard index={1} icon="plus-circle" label="Nueva Venta" onPress={() => router.push('/(app)/ventas')} color={Colors.primary} />
                <AnimatedQuickActionCard index={2} icon="account-group" label="Mis Clientes" onPress={() => router.push('/(app)/clientes')} color={Colors.success} />
                <AnimatedQuickActionCard index={3} icon="clipboard-list" label="Mis Pedidos" onPress={() => router.push('/(app)/pedidos')} color={Colors.warning} />
            </View>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
            <Text style={styles.sectionTitle}>Catálogos</Text>
            <View style={styles.actionsGrid}>
                <AnimatedQuickActionCard index={1} icon="food-apple" label="Productos" onPress={() => router.push('/(app)/productos')} color={Colors.info} />
                <AnimatedQuickActionCard index={2} icon="tag" label="Promociones" onPress={() => router.push('/(app)/promociones')} color={Colors.pink} />
            </View>
        </Animated.View>
      </ScrollView>
    );
  }

// --- Pantalla Principal ---

export default function DashboardScreen() {
  const { isAdmin } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <LinearGradient 
        colors={[Colors.beige, Colors.beigeDark]} 
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill} 
      />
       <DashboardPattern />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {isAdmin ? <AdminDashboard /> : <VendedorDashboard />}
      </SafeAreaView>
      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
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
  actionsGrid: { flexDirection: 'row', flexWrap: 'nowrap', paddingHorizontal: 20, gap: 12 },
  actionCard: { flex: 1, minWidth: 100, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, borderTopWidth: 5 },
  actionIconContainer: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 10, fontWeight: '900', color: '#1A1A1A', textAlign: 'center' },
  predSection: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  predTitle: { fontSize: 16, fontWeight: '900', marginBottom: 15 },
});
