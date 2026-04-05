import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useAuth, ROLE_ADMIN } from '../../src/hooks/useAuth';
import { PredictionChart, PredictionStatCard } from '../../src/components/PredictionChart';
import { Toast, useToast } from '../../src/components/Toast';
import { getPrediccionVentasService, PrediccionVentas } from '../../src/services/prediccionesERP.service';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing, BorderRadius } from '../../src/theme/spacing';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// ---------- SHARED ----------
function QuickActionCard({
  icon,
  label,
  onPress,
  color,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.actionCard, { borderTopWidth: 4, borderTopColor: color ?? Colors.primary }]}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: (color ?? Colors.primary) + '15' }]}>
        <MaterialCommunityIcons name={icon} size={32} color={color ?? Colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, color }: { icon: IconName; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: color }]}>
      <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={[styles.statValue, { color: '#1A1A1A' }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

import { Image } from 'expo-image';

import { getVentas } from '../../src/services/venta.service';
import { getEmpleados } from '../../src/services/empleado.service';
import { getVendedores } from '../../src/services/vendedor.service';
import { getPedidos } from '../../src/services/pedido.service';
import { formatCurrency } from '../../src/utils';

// ---------- ADMIN DASHBOARD ----------
function AdminDashboard() {
  const { usuario, logout } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [stats, setStats] = useState({
    ventasMes: 0,
    pedidosPend: 0,
    empleados: 0,
    vendedores: 0,
    crecimientoReal: 0,
  });
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [prediccion, setPrediccion] = useState<PrediccionVentas | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPred, setLoadingPred] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [ventas, pedidos, empleados, vendedores] = await Promise.all([
        getVentas(),
        getPedidos(),
        getEmpleados(),
        getVendedores(),
      ]);

      const now = new Date();
      const esteMes = ventas.filter((v: any) => {
        const fecha = new Date(v.fecha_venta);
        return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
      });
      
      const mesPasado = ventas.filter((v: any) => {
        const fecha = new Date(v.fecha_venta);
        const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return fecha.getMonth() === m && fecha.getFullYear() === y;
      });

      const totalMes = esteMes.reduce((sum: number, v: any) => sum + v.monto_total, 0);
      const totalMesPasado = mesPasado.reduce((sum: number, v: any) => sum + v.monto_total, 0);
      
      let crecimiento = 0;
      if (totalMesPasado > 0) {
          crecimiento = ((totalMes - totalMesPasado) / totalMesPasado) * 100;
      }

      const pendientes = pedidos.filter((p: any) => p.estado === 'Pendiente').length;

      setStats({
        ventasMes: totalMes,
        pedidosPend: pendientes,
        empleados: empleados.length,
        vendedores: vendedores.length,
        crecimientoReal: crecimiento,
      });

      // Agrupar ventas por mes para la gráfica
      const salesByMonth: Record<string, number> = {};
      ventas.forEach((v: any) => {
        const d = new Date(v.fecha_venta);
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        salesByMonth[mKey] = (salesByMonth[mKey] || 0) + v.monto_total;
      });

      const chartData = Object.keys(salesByMonth)
        .sort()
        .slice(-5) 
        .map(key => ({
          label: key.split('-')[1],
          value: salesByMonth[key]
        }));
      
      setHistoricalData(chartData);

    } catch (err) {
      console.error('Error cargando stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPrediccion = useCallback(async () => {
    setLoadingPred(true);
    try {
      const data = await getPrediccionVentasService();
      setPrediccion(data);
    } catch {
      showToast('No se pudo cargar la predicción.', 'warning');
    } finally {
      setLoadingPred(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadPrediccion();
  }, [loadStats, loadPrediccion]);

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={loading} 
          onRefresh={() => { loadStats(); loadPrediccion(); }} 
          tintColor={Colors.primary} 
        />
      }
    >
      {/* Header */}
      <View style={styles.dashHeader}>
        <View style={styles.dashHeaderRow}>
          <View>
            <Image
              source={require('../../assets/images/logon.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
            <Text style={styles.greeting}>{getGreeting()}, {usuario?.username ?? 'Admin'}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.75}>
            <MaterialCommunityIcons name="logout" size={18} color={Colors.primary} />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { marginTop: Spacing.sm }]}>
          <StatCard icon="cash-multiple" label="Ventas del mes" value={formatCurrency(stats.ventasMes)} color={Colors.success} />
          <StatCard icon="package-variant" label="Pedidos pend." value={String(stats.pedidosPend)} color={Colors.warning} />
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="account-group" label="Empleados" value={String(stats.empleados)} color={Colors.info} />
          <StatCard icon="account-tie" label="Vendedores" value={String(stats.vendedores)} color={Colors.primary} />
        </View>
      </View>

      {/* Ventas y Análisis */}
      <Text style={styles.sectionTitle}>Ventas y Análisis</Text>
      <View style={styles.actionsGrid}>
        <QuickActionCard icon="cash-register" label="Punto de Venta" onPress={() => router.push('/(app)/ventas')} color={Colors.success} />
        <QuickActionCard icon="chart-areaspline" label="Detalle Mensual" onPress={() => router.push('/(app)/ventas/detalle-mes')} color={Colors.info} />
        <QuickActionCard icon="bank" label="Cortes" onPress={() => router.push('/(app)/cortes')} color={Colors.warning} />
      </View>

      {/* Gestión */}
      <Text style={styles.sectionTitle}>Gestión</Text>
      <View style={styles.actionsGrid}>
        <QuickActionCard icon="warehouse" label="Inventario" onPress={() => router.push('/(app)/productos')} color={Colors.primary} />
        <QuickActionCard icon="account-group" label="Clientes" onPress={() => router.push('/(app)/clientes')} color={Colors.info} />
        <QuickActionCard icon="factory" label="Producción" onPress={() => router.push('/(app)/produccion')} color={Colors.warning} />
      </View>

      {/* Gráfica al Final */}
      <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.xl }}>
        <View style={styles.predSection}>
            <View style={styles.predHeader}>
                <MaterialCommunityIcons name="chart-line" size={20} color={Colors.primary} />
                <Text style={styles.predTitle}>Proyección de Ventas</Text>
                <TouchableOpacity onPress={loadPrediccion} style={styles.refreshBtn} disabled={loadingPred}>
                <MaterialCommunityIcons name="refresh" size={18} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {loadingPred ? (
                <ActivityIndicator color={Colors.primary} size="small" style={{ marginVertical: Spacing.lg }} />
            ) : prediccion ? (
                <>
                <Text style={styles.predMonth}>{prediccion.mes_predicho}</Text>
                <PredictionChart
                    data={historicalData.length > 0 ? historicalData : [
                        { label: 'Ene', value: 1000 },
                        { label: 'Feb', value: 1500 },
                        { label: 'Mar', value: 1200 }
                    ]}
                    predictedValue={prediccion.ventas_esperadas}
                    predictedLabel={prediccion.mes_predicho}
                />
                <View style={styles.predCards}>
                    <PredictionStatCard
                    label="Meta Esperada"
                    value={formatCurrency(prediccion.ventas_esperadas)}
                    color={Colors.primary}
                    />
                    <PredictionStatCard
                    label="Crecimiento Real"
                    value={`${stats.crecimientoReal >= 0 ? '+' : ''}${stats.crecimientoReal.toFixed(1)}%`}
                    color={stats.crecimientoReal >= 0 ? Colors.success : Colors.error}
                    />
                </View>
                </>
            ) : (
                <Text style={styles.noPredText}>Sin datos de proyección</Text>
            )}
        </View>
      </View>

      {/* Perfil */}
      <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(app)/perfil')} activeOpacity={0.8}>
        <MaterialCommunityIcons name="account-circle" size={20} color={Colors.primary} />
        <Text style={styles.profileBtnText}>Mi Perfil</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </ScrollView>
    <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </>
  );
}

// ---------- VENDEDOR DASHBOARD ----------
function VendedorDashboard() {
  const { usuario, logout } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();
  
  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.dashHeader}>
          <View style={styles.dashHeaderRow}>
            <View>
              <Image
                source={require('../../assets/images/logon.png')}
                style={styles.logoImage}
                contentFit="contain"
              />
              <Text style={styles.greeting}>{getGreeting()}, {usuario?.username ?? 'Vendedor'}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.75}>
              <MaterialCommunityIcons name="logout" size={18} color={Colors.primary} />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ventas */}
        <Text style={styles.sectionTitle}>Ventas</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard icon="cash-register" label="Punto de Venta" onPress={() => router.push('/(app)/ventas')} color={Colors.success} />
          <QuickActionCard icon="account-group" label="Mis Clientes" onPress={() => router.push('/(app)/clientes')} color={Colors.info} />
          <QuickActionCard icon="receipt" label="Historial" onPress={() => router.push('/(app)/ventas')} color={Colors.primary} />
        </View>

        {/* Pedidos */}
        <Text style={styles.sectionTitle}>Pedidos</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard icon="package-variant-plus" label="Solicitar" onPress={() => router.push('/(app)/pedidos/create')} color={Colors.warning} />
          <QuickActionCard icon="clipboard-list" label="Estatus" onPress={() => router.push('/(app)/pedidos')} color={Colors.primary} />
        </View>

        {/* Cuentas */}
        <Text style={styles.sectionTitle}>Cuentas y Pagos</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard icon="bank" label="Cortes" onPress={() => router.push('/(app)/cortes')} color={Colors.warning} />
          <QuickActionCard icon="file-document" label="Comprobantes" onPress={() => router.push('/(app)/comprobantes')} color={Colors.info} />
        </View>

        {/* Perfil */}
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(app)/perfil')} activeOpacity={0.8}>
          <MaterialCommunityIcons name="account-circle" size={20} color={Colors.primary} />
          <Text style={styles.profileBtnText}>Mi Perfil</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </>
  );
}

// ---------- MAIN ----------
export default function DashboardScreen() {
  const { usuario } = useAuthStore();
  const isAdmin = usuario?.rol_id === ROLE_ADMIN;

  return (
    <SafeAreaView style={styles.safeArea}>
      {isAdmin ? <AdminDashboard /> : <VendedorDashboard />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.beige },
  scroll: { flex: 1, backgroundColor: Colors.beige },
  scrollContent: { paddingBottom: Spacing.xxxl },
  dashHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  dashHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  logoImage: { width: 140, height: 40, marginBottom: -5 },
  greeting: { ...Typography.bodySmall, color: 'rgba(26,26,26,0.7)', marginTop: 2, marginLeft: 5, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: '#FFFFFF', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  logoutText: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.md, gap: Spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statIconBox: { padding: Spacing.xs, borderRadius: BorderRadius.md },
  statInfo: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(26,26,26,0.5)', textTransform: 'uppercase' },
  sectionTitle: { ...Typography.h4, color: '#1A1A1A', marginTop: Spacing.lg, marginBottom: Spacing.sm, paddingHorizontal: Spacing.lg, fontWeight: '900' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  actionCard: { flex: 1, minWidth: '30%', backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', gap: Spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  actionIconContainer: { width: 56, height: 56, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  actionLabel: { ...Typography.label, color: '#1A1A1A', textAlign: 'center', fontSize: 11, fontWeight: '800' },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: '#FFFFFF', marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: BorderRadius.xl, padding: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  profileBtnText: { ...Typography.body, color: '#1A1A1A', flex: 1, fontWeight: '700' },
  predSection: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xxl, padding: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 6 },
  predHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  predTitle: { ...Typography.h4, color: '#1A1A1A', flex: 1, fontWeight: '900' },
  refreshBtn: { padding: Spacing.xs },
  predMonth: { ...Typography.bodySmall, color: 'rgba(26,26,26,0.6)', marginBottom: Spacing.sm, fontWeight: '700' },
  predCards: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  noPredText: { ...Typography.bodySmall, color: 'rgba(26,26,26,0.5)', textAlign: 'center', paddingVertical: Spacing.lg },
});
