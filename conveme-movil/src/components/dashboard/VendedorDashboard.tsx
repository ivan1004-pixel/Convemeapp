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
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { getVentas } from '../../services/venta.service';
import { getPedidos } from '../../services/pedido.service';
import { getCortes } from '../../services/corte.service';
import { formatCurrency } from '../../utils';
import { Colors } from '../../theme/colors';
import { PredictionChart } from '../PredictionChart';
import { API_URL } from '../../api/convemeApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const DashboardPattern = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="dotPattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <Rect x="0" y="0" width="4" height="4" fill={Colors.dark} opacity="0.1" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dotPattern)" />
    </Svg>
  </View>
);

function StatCard({ icon, label, value, color, index }: { 
  icon: IconName; label: string; value: string; color: string, index: number 
}) {
  return (
    <Animated.View entering={FadeInUp.duration(600).delay(100 * index)} style={styles.statCardWrapper}>
      <View style={[styles.statCard, { borderLeftColor: color }]}>
        <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function ActionItem({ icon, label, onPress, color, index }: { 
  icon: IconName; label: string; onPress: () => void; color: string, index: number 
}) {
  return (
    <Animated.View entering={FadeIn.delay(200 * index)} style={styles.actionItemWrapper}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.actionItem}>
        <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={24} color="#FFF" />
        </View>
        <Text style={styles.actionText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

import { calcularPrediccionLaplace } from '../../services/laplace.service';

export function VendedorDashboard() {
  const { usuario, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ ventasMes: 0, comisiones: 0, pedidosPend: 0, pinesMes: 0 });
  const [historicalData, setHistoricalData] = useState<{ label: string, value: number }[]>([]);
  const [prediction, setPrediction] = useState({ value: 0, label: '' });

  const loadStats = useCallback(async () => {
    const { token } = useAuthStore.getState();
    if (!token || !usuario) return;

    setLoading(true);
    try {
      const [ventasData, pedidosData, cortesData] = await Promise.all([
        getVentas(0, 50), 
        getPedidos(0, 50),
        getCortes('', 0, 50)
      ]).catch(err => {
        console.error('[Dashboard] Error en alguna petición:', err);
        return [[], [], []];
      });
      
      const miID = Number(usuario?.id_vendedor);
      
      const misVentas = (ventasData || []).filter((v: any) => Number(v.vendedor?.id_vendedor || v.vendedor_id) === miID);
      const misPedidos = (pedidosData || []).filter((p: any) => Number(p.vendedor?.id_vendedor || p.vendedor_id) === miID);
      const misCortes = (cortesData || []).filter((c: any) => Number(c.vendedor?.id_vendedor || c.vendedor_id) === miID);

      const totalPinesVentas = misVentas.reduce((acc: number, v: any) => 
        acc + (v.detalles || []).reduce((sum: number, d: any) => sum + (Number(d.cantidad) || 0), 0), 0
      );

      const totalPinesCortes = misCortes.reduce((acc: number, c: any) => 
        acc + (c.detalles || []).reduce((sum: number, d: any) => sum + (Number(d.cantidad_vendida) || 0), 0), 0
      );

      const totalPines = totalPinesVentas + totalPinesCortes;
      const totalComisiones = totalPines * 6.5;

      setStats({
        ventasMes: misVentas.length,
        comisiones: totalComisiones,
        pedidosPend: misPedidos.filter((p: any) => p.estado === 'Pendiente').length,
        pinesMes: totalPines
      });

      const revenueByMonth: Record<string, number> = {};
      misVentas.forEach((v: any) => {
        const d = new Date(v.fecha_venta);
        if (isNaN(d.getTime())) return;
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        revenueByMonth[mKey] = (revenueByMonth[mKey] || 0) + (Number(v.monto_total) || 0);
      });

      const sortedKeys = Object.keys(revenueByMonth).sort();
      const historical = sortedKeys.slice(-5).map(key => ({ label: key.split('-')[1], value: revenueByMonth[key] }));
      setHistoricalData(historical);

      if (historical.length >= 2) {
        const valores = historical.map(h => h.value);
        const { prediccion } = calcularPrediccionLaplace(valores, 0.15);
        const lastKey = sortedKeys.slice(-1)[0];
        const lastMonth = parseInt(lastKey.split('-')[1]);
        setPrediction({ value: prediccion, label: ((lastMonth % 12) + 1).toString().padStart(2, '0') });
      }
    } catch (err) {
      console.error('[Dashboard] Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const profileImg = usuario?.foto_perfil?.startsWith('/uploads') 
    ? `${API_URL.replace('/graphql', '')}${usuario.foto_perfil}`
    : usuario?.foto_perfil;

  return (
    <View style={styles.container}>
      <DashboardPattern />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Hola,</Text>
              <Text style={styles.nameText}>{usuario?.username || 'Vendedor'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/perfil')}>
              <Image source={profileImg ? { uri: profileImg } : require('../../../assets/images/logon.png')} style={styles.profilePic} />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInUp.duration(800)} style={styles.mainBalanceCard}>
             <Text style={styles.balanceLabel}>COMISIONES ACUMULADAS</Text>
             <Text style={styles.balanceValue}>{formatCurrency(stats.comisiones)}</Text>
             <View style={styles.balanceFooter}>
                <MaterialCommunityIcons name="trending-up" size={16} color="#FFF" />
                <Text style={styles.balanceTrend}>Tu progreso actual</Text>
             </View>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>RESUMEN DE ACTIVIDAD</Text>
          <View style={styles.statsGrid}>
            <StatCard index={1} icon="pin" label="Pines Mes" value={String(stats.pinesMes)} color={Colors.success} />
            <StatCard index={2} icon="package-variant" label="Pedidos Pend." value={String(stats.pedidosPend)} color={Colors.warning} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard index={3} icon="cash-check" label="Ventas Mes" value={String(stats.ventasMes)} color={Colors.primary} />
            <StatCard index={4} icon="chart-line" label="Proyección" value={formatCurrency(prediction.value)} color={Colors.info} />
          </View>

          <Text style={styles.sectionTitle}>ACCIONES RÁPIDAS</Text>
          <View style={styles.actionsContainer}>
            <ActionItem index={1} icon="plus" label="Nueva Venta" onPress={() => router.push('/ventas/create')} color={Colors.primary} />
            <ActionItem index={2} icon="account-group" label="Clientes" onPress={() => router.push('/clientes')} color={Colors.success} />
            <ActionItem index={3} icon="clipboard-list" label="Pedidos" onPress={() => router.push('/pedidos')} color={Colors.warning} />
            <ActionItem index={4} icon="logout" label="Salir" onPress={logout} color={Colors.pink} />
          </View>

          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>TENDENCIA PERSONAL</Text>
            <PredictionChart data={historicalData} predictedValue={prediction.value} predictedLabel={prediction.label} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.beige },
  scrollContent: { paddingBottom: 100 },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 30, 
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderWidth: 2,
    borderColor: Colors.dark,
    borderTopWidth: 0,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700' },
  nameText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  profilePic: { width: 50, height: 50, borderRadius: 12, borderWidth: 3, borderColor: '#FFF' },
  mainBalanceCard: { 
    backgroundColor: Colors.pink, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  balanceValue: { color: '#FFF', fontSize: 28, fontWeight: '900', marginVertical: 4 },
  balanceFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceTrend: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  
  content: { paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: Colors.dark, marginTop: 25, marginBottom: 15, letterSpacing: 1, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCardWrapper: { flex: 1 },
  statCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 12, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statInfo: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  statLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' },

  actionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionItemWrapper: { width: (SCREEN_WIDTH - 52) / 2 },
  actionItem: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
  },
  actionIconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  actionText: { fontSize: 12, fontWeight: '900', color: Colors.dark },

  chartSection: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 20, 
    marginTop: 30,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
  },
  chartTitle: { fontSize: 14, fontWeight: '900', marginBottom: 15, color: Colors.dark }
});
