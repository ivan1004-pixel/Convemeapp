import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Calendar from 'expo-calendar';

import { useAuth } from '../../src/hooks/useAuth';
import { PredictionChart } from '../../src/components/PredictionChart';
import { Toast, useToast } from '../../src/components/Toast';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../src/theme/colors';

import { Image } from 'expo-image';
import { getVentas } from '../../src/services/venta.service';
import { getEmpleados } from '../../src/services/empleado.service';
import { getVendedores } from '../../src/services/vendedor.service';
import { getPedidos } from '../../src/services/pedido.service';
import { getCortes } from '../../src/services/corte.service';
import { formatCurrency } from '../../src/utils';

import { getEventos } from '../../src/services/evento.service';
import type { Evento } from '../../src/types';
import { SearchBar } from '../../src/components/ui/SearchBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 6;
const GRID_PADDING = 20;
const BUTTON_WIDTH = (SCREEN_WIDTH - (GRID_PADDING * 2) - (CARD_MARGIN * 6)) / 3;

// --- Helper de Regresión Lineal ---
function getLinearRegression(data: {label: string, value: number}[]) {
    const n = data.length;
    if (n < 2) return { predict: (x: number) => (data[0]?.value || 0) };
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    data.forEach((point, i) => {
      sumX += i; sumY += point.value; sumXY += i * point.value; sumXX += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { predict: (x: number) => (isNaN(slope) ? data[0].value : slope * x + intercept) };
}

const DashboardPattern = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="dotPattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <Rect x="0" y="0" width="4" height="4" fill={Colors.dark} opacity="0.12" />
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
      style={[styles.actionCard, { borderTopColor: color ?? Colors.primary }]}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: (color ?? Colors.primary) + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color ?? Colors.primary} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, color }: { icon: IconName; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statWatermark}>
          <MaterialCommunityIcons name={icon} size={60} color={color + '08'} />
      </View>
      <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function EventBadge({ evento }: { evento: Evento }) {
  const { show: showToast } = useToast();
  const start = evento.fecha_inicio ? new Date(evento.fecha_inicio) : new Date();
  const end = evento.fecha_fin ? new Date(evento.fecha_fin) : start;
  const day = start.getDate();
  const month = start.toLocaleString('es-MX', { month: 'short' }).toUpperCase();

  const handleRegisterCalendar = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede registrar sin permisos del calendario.');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(c => c.isPrimary) || calendars[0];

      if (!defaultCalendar) {
        showToast('No se encontró un calendario disponible', 'error');
        return;
      }

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: evento.nombre,
        startDate: start,
        endDate: end,
        location: evento.escuela?.nombre || '',
        notes: evento.descripcion || '',
        timeZone: 'GMT-6',
      });

      showToast('¡LISTO! EL EVENTO SE GUARDÓ EN TU CALENDARIO', 'success');
    } catch (err) {
      showToast('UPS, NO PUDIMOS GUARDAR EL EVENTO', 'error');
      console.error(err);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.eventCard} 
      onPress={() => router.push({ pathname: '/(app)/eventos/create', params: { id: evento.id_evento }})}
    >
      <View style={styles.eventDateBadge}>
        <View style={styles.eventMonthStrip}><Text style={styles.eventMonth}>{month}</Text></View>
        <Text style={styles.eventDay}>{day}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={1}>{evento.nombre.toUpperCase()}</Text>
        <View style={styles.eventLocationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color="rgba(0,0,0,0.4)" />
            <Text style={styles.eventEscuela} numberOfLines={1}>{evento.escuela?.nombre?.toUpperCase() || 'SIN ESCUELA'}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={handleRegisterCalendar} style={styles.calendarAddBtn}>
          <MaterialCommunityIcons name="calendar-plus" size={20} color={Colors.primary} />
      </TouchableOpacity>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.dark} />
    </TouchableOpacity>
  );
}

const AnimatedStatCard = ({ icon, label, value, color, index }: { icon: IconName; label: string; value: string; color: string, index: number }) => (
    <Animated.View entering={FadeInUp.duration(500).delay(100 * index)} style={{flex: 1}}>
        <StatCard icon={icon} label={label} value={value} color={color} />
    </Animated.View>
);

const AnimatedQuickActionCard = ({ icon, label, onPress, color, index }: { icon: IconName; label: string; onPress: () => void; color?: string, index: number }) => (
    <Animated.View entering={FadeInUp.duration(500).delay(100 * index)} style={styles.animatedCardContainer}>
        <QuickActionCard icon={icon} label={label} onPress={onPress} color={color} />
    </Animated.View>
);

function AdminDashboard() {
  const { usuario, logout } = useAuth();
  const [stats, setStats] = useState({ ingresosMes: 0, pedidosPend: 0, empleados: 0, vendedores: 0 });
  const [historicalData, setHistoricalData] = useState<{label: string, value: number}[]>([]);
  const [prediction, setPrediction] = useState({ value: 0, label: '' });
  const [proximosEventos, setProximosEventos] = useState<Evento[]>([]);
  const [eventSearch, setEventSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [ventas, cortes, pedidos, empleados, vendedores, eventos] = await Promise.all([
        getVentas(), getCortes(), getPedidos(), getEmpleados(), getVendedores(), getEventos()
      ]);
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      const ingresosMes = ventas.filter((v:any) => new Date(v.fecha_venta).getMonth() === m && new Date(v.fecha_venta).getFullYear() === y).reduce((s:number, v:any) => s + v.monto_total, 0) +
                          cortes.filter((c:any) => new Date(c.fecha_corte).getMonth() === m && new Date(c.fecha_corte).getFullYear() === y).reduce((s:number, c:any) => s + (c.dinero_total_entregado || 0), 0);
      setStats({ ingresosMes, pedidosPend: pedidos.filter((p:any) => p.estado === 'Pendiente').length, empleados: empleados.length, vendedores: vendedores.length });
      const futureEvents = eventos
        .filter((e: any) => new Date(e.fecha_inicio) >= now || (new Date(e.fecha_inicio) <= now && new Date(e.fecha_fin) >= now))
        .sort((a: any, b: any) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
      setProximosEventos(futureEvents);
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
        const lastMonthLabel = Object.keys(revenueByMonth).sort().slice(-1)[0];
        const lastMonthDate = new Date(lastMonthLabel + '-02T12:00:00Z');
        const nextMonthDate = new Date(lastMonthDate.setMonth(lastMonthDate.getMonth() + 1));
        const nextMonthLabel = (nextMonthDate.getMonth() + 1).toString().padStart(2, '0');
        setPrediction({ value: regression.predict(historical.length) > 0 ? regression.predict(historical.length) : 0, label: nextMonthLabel });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const filteredEventos = useMemo(() => {
    return proximosEventos.filter(e => 
      e.nombre.toLowerCase().includes(eventSearch.toLowerCase()) || 
      e.escuela?.nombre?.toLowerCase().includes(eventSearch.toLowerCase())
    ).slice(0, 3);
  }, [proximosEventos, eventSearch]);

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
          <TouchableOpacity style={{flex: 1}} onPress={() => router.push('/(app)/empleados')} activeOpacity={0.8}><StatCard icon="account-group" label="Empleados" value={String(stats.empleados)} color={Colors.info} /></TouchableOpacity>
          <TouchableOpacity style={{flex: 1}} onPress={() => router.push('/(app)/vendedores')} activeOpacity={0.8}><StatCard icon="account-tie" label="Vendedores" value={String(stats.vendedores)} color={Colors.primary} /></TouchableOpacity>
        </View>
      </View>

      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={{paddingHorizontal: 20}}>
        <Text style={styles.sectionTitleList}>Calendario de Eventos</Text>
        <SearchBar value={eventSearch} onChangeText={setEventSearch} placeholder="Buscar eventos..." style={styles.eventSearch} />
        <View style={styles.eventsList}>
          {filteredEventos.length > 0 ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled snapToInterval={SCREEN_WIDTH - 64} decelerationRate="fast" contentContainerStyle={styles.eventsCarousel}>
                {filteredEventos.map((evento) => (<View key={evento.id_evento} style={styles.carouselItem}><EventBadge evento={evento} /></View>))}
              </ScrollView>
              <TouchableOpacity onPress={() => router.push('/(app)/eventos')} style={styles.viewAllEvents}><Text style={styles.viewAllText}>VER TODOS LOS EVENTOS</Text><MaterialCommunityIcons name="arrow-right" size={14} color={Colors.primary} /></TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyEvents}><MaterialCommunityIcons name="calendar-blank" size={32} color="rgba(0,0,0,0.1)" /><Text style={styles.emptyEventsText}>No hay eventos próximos</Text><TouchableOpacity onPress={() => router.push('/(app)/eventos/create')}><Text style={styles.createEventText}>Crear un evento</Text></TouchableOpacity></View>
          )}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(400)}>
        <Text style={styles.sectionTitle}>Acciones de Negocio</Text>
        <View style={styles.actionsGrid}>
            <AnimatedQuickActionCard index={1} icon="cash-register" label="Ventas" onPress={() => router.push('/(app)/ventas')} color={Colors.success} />
            <AnimatedQuickActionCard index={2} icon="chart-areaspline" label="Resumen" onPress={() => router.push('/(app)/resumen-mensual')} color={Colors.info} />
            <AnimatedQuickActionCard index={3} icon="bank" label="Cortes" onPress={() => router.push('/(app)/cortes')} color={Colors.warning} />
        </View>
      </Animated.View>
      
      <Animated.View entering={FadeInUp.duration(500).delay(500)}>
        <Text style={styles.sectionTitle}>Administración</Text>
        <View style={styles.actionsGrid}>
            <AnimatedQuickActionCard index={1} icon="warehouse" label="Inventario" onPress={() => router.push('/(app)/productos')} color={Colors.primary} />
            <AnimatedQuickActionCard index={2} icon="account-star-outline" label="Clientes" onPress={() => router.push('/(app)/clientes')} color={Colors.success} />
            <AnimatedQuickActionCard index={3} icon="calendar-star" label="Eventos" onPress={() => router.push('/(app)/eventos')} color={Colors.pink} />
            <AnimatedQuickActionCard index={4} icon="clipboard-account-outline" label="Asignar" onPress={() => router.push('/(app)/asignaciones')} color={Colors.primary} />
            <AnimatedQuickActionCard index={5} icon="receipt" label="Tickets" onPress={() => router.push('/(app)/comprobantes')} color={Colors.warning} />
            <AnimatedQuickActionCard index={6} icon="account-plus" label="Usuario" onPress={() => router.push('/(app)/empleados/create')} color={Colors.info} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(600)} style={{paddingHorizontal: 20, marginTop: 30, paddingBottom: 100}}>
          <View style={styles.predSection}><Text style={styles.predTitle}>Tendencia de Ingresos</Text><PredictionChart data={historicalData} predictedValue={prediction.value} predictedLabel={prediction.label} /></View>
      </Animated.View>
    </ScrollView>
  );
}

function VendedorDashboard() {
    const { usuario, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ ventasMes: 0, comisiones: 0 });
    const [historicalData, setHistoricalData] = useState<{label: string, value: number}[]>([]);
    const [prediction, setPrediction] = useState({ value: 0, label: '' });

    const loadStats = useCallback(async () => {
      setLoading(true);
      try {
        const ventas = await getVentas();
        const misVentas = ventas.filter((v: any) => v.id_vendedor === usuario?.id_vendedor || v.vendedor?.username === usuario?.username);
        
        const now = new Date();
        const m = now.getMonth();
        const y = now.getFullYear();
        
        const mesActual = misVentas.filter((v: any) => {
          const d = new Date(v.fecha_venta);
          return d.getMonth() === m && d.getFullYear() === y;
        });

        const totalVentasMes = mesActual.length;
        const totalComisiones = mesActual.reduce((acc: number, v: any) => acc + (v.monto_total * 0.10), 0); // Asumiendo 10% de comisión

        setStats({ ventasMes: totalVentasMes, comisiones: totalComisiones });

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
                  <Image source={require('../../assets/images/logon.png')} style={styles.logoImage} contentFit="contain" />
                  <Text style={styles.greeting}>Bienvenido, {usuario?.username ?? 'Vendedor'}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                  <Text style={styles.logoutText}>SALIR</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
            <View style={styles.statsRow}>
              <AnimatedStatCard index={1} icon="point-of-sale" label="Ventas del Mes" value={String(stats.ventasMes)} color={Colors.success} />
              <AnimatedStatCard index={2} icon="cash-multiple" label="Mis Comisiones" value={formatCurrency(stats.comisiones)} color={Colors.info} />
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

        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={{paddingHorizontal: 20, marginTop: 30, paddingBottom: 100}}>
          <View style={styles.predSection}>
            <Text style={styles.predTitle}>Mis Ingresos Proyectados</Text>
            <PredictionChart data={historicalData} predictedValue={prediction.value} predictedLabel={prediction.label} />
          </View>
        </Animated.View>
      </ScrollView>
    );
}

export default function DashboardScreen() {
  const { isAdmin } = useAuth();
  const { toast, hide: hideToast } = useToast();
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <LinearGradient colors={[Colors.beige, Colors.beigeDark]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
       <DashboardPattern />
      <SafeAreaView style={styles.safeArea} edges={['top']}>{isAdmin ? <AdminDashboard /> : <VendedorDashboard />}</SafeAreaView>
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
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 0, overflow: 'hidden' },
  statWatermark: { position: 'absolute', right: -15, bottom: -15 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statInfo: { gap: 2 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#1A1A1A', marginTop: 25, marginBottom: 12, paddingHorizontal: 20, textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitleList: { fontSize: 14, fontWeight: '900', color: '#1A1A1A', marginTop: 15, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: GRID_PADDING - CARD_MARGIN, justifyContent: 'flex-start' },
  animatedCardContainer: { width: BUTTON_WIDTH, margin: CARD_MARGIN },
  actionCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center', borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, borderTopWidth: 4, height: 95, justifyContent: 'center' },
  actionIconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 8.5, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', width: '100%', textTransform: 'uppercase' },
  eventSearch: { marginBottom: 12 },
  eventsList: { backgroundColor: 'rgba(255,255,255,0.4)', padding: 12, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)', minHeight: 80 },
  eventsCarousel: { paddingRight: 20 },
  carouselItem: { width: SCREEN_WIDTH - 64, marginRight: 12 },
  emptyEvents: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyEventsText: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.3)', marginTop: 8 },
  createEventText: { fontSize: 11, fontWeight: '900', color: Colors.primary, marginTop: 4, textDecorationLine: 'underline' },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1 },
  eventDateBadge: { width: 45, height: 50, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', overflow: 'hidden', marginRight: 12 },
  eventMonthStrip: { width: '100%', backgroundColor: Colors.primary, paddingVertical: 2, alignItems: 'center' },
  eventMonth: { fontSize: 8, fontWeight: '900', color: '#FFF' },
  eventDay: { fontSize: 18, fontWeight: '900', color: Colors.dark, marginTop: 2 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 13, fontWeight: '900', color: Colors.dark },
  eventLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  eventEscuela: { fontSize: 10, fontWeight: '700', color: 'rgba(0,0,0,0.4)' },
  calendarAddBtn: { padding: 8, marginRight: 4, backgroundColor: Colors.primary + '10', borderRadius: 8 },
  viewAllEvents: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 4 },
  viewAllText: { fontSize: 10, fontWeight: '900', color: Colors.primary },
  predSection: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  predTitle: { fontSize: 16, fontWeight: '900', marginBottom: 15 },
});
