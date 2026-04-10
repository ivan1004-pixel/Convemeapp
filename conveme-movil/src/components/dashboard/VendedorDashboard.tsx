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
import { getCortesPorVendedor } from '../../services/corte.service';
import { formatCurrency, formatImageUri, formatDate } from '../../utils';
import { Colors } from '../../theme/colors';
import { PredictionChart } from '../PredictionChart';
import { calcularPrediccionLaplace } from '../../services/laplace.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const DashboardPattern = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern
          id="dotPattern"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <Rect
            x="0"
            y="0"
            width="4"
            height="4"
            fill={Colors.dark}
            opacity="0.1"
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dotPattern)" />
    </Svg>
  </View>
);

function StatCard({
  icon,
  label,
  value,
  color,
  index,
}: {
  icon: IconName;
  label: string;
  value: string;
  color: string;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(600).delay(100 * index)}
      style={styles.statCardWrapper}
    >
      <View style={[styles.statCard, { borderLeftColor: color }]}>
        <View
          style={[
            styles.statIconBox,
            { backgroundColor: color + '15' },
          ]}
        >
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

function ActionItem({
  icon,
  label,
  onPress,
  color,
  index,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color: string;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(200 * index)}
      style={styles.actionItemWrapper}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.actionItem}
      >
        <View
          style={[
            styles.actionIconContainer,
            { backgroundColor: color },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={24} color="#FFF" />
        </View>
        <Text style={styles.actionText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ListSection({ title, data, type, emptyMessage }: { 
    title: string; 
    data: any[]; 
    type: 'venta' | 'pedido';
    emptyMessage: string;
}) {
    return (
        <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {data.length === 0 ? (
                <Text style={styles.emptyText}>{emptyMessage}</Text>
            ) : (
                data.map((item, idx) => (
                    <TouchableOpacity 
                        key={idx} 
                        style={styles.listItem}
                        onPress={() => router.push(`/(app)/${type === 'venta' ? 'ventas' : 'pedidos'}/${type === 'venta' ? item.id_venta : item.id_pedido}`)}
                    >
                        <View style={styles.listItemIcon}>
                            <MaterialCommunityIcons 
                                name={type === 'venta' ? 'cash' : 'package-variant'} 
                                size={18} 
                                color={type === 'venta' ? Colors.success : Colors.warning} 
                            />
                        </View>
                        <View style={styles.listItemContent}>
                            <Text style={styles.listItemTitle}>
                                {type === 'venta' ? `VENTA #${item.id_venta}` : `PEDIDO #${item.id_pedido}`}
                            </Text>
                            <Text style={styles.listItemSub}>
                                {formatDate(type === 'venta' ? item.fecha_venta : item.fecha_pedido)}
                            </Text>
                        </View>
                        <Text style={styles.listItemValue}>
                            {formatCurrency(item.monto_total)}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="rgba(0,0,0,0.3)" />
                    </TouchableOpacity>
                ))
            )}
        </View>
    );
}

export function VendedorDashboard() {
  const { usuario, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    comisiones: 0,
    pinesTotales: 0,
  });

  // Gráfica 1: monto por mes
  const [historicalData, setHistoricalData] = useState<
    { label: string; value: number }[]
  >([]);
  const [prediction, setPrediction] = useState({ value: 0, label: '' });

  // Gráfica 2: pines por mes
  const [pinesPorMes, setPinesPorMes] = useState<
    { label: string; value: number }[]
  >([]);

  // Listas para el dashboard
  const [ultimasVentas, setUltimasVentas] = useState<any[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<any[]>([]);

  const loadStats = useCallback(async () => {
    const { token } = useAuthStore.getState();
    if (!token || !usuario) {
      return;
    }

    const miID = Number(usuario.id_vendedor);
    if (!miID || Number.isNaN(miID)) {
      return;
    }

    setLoading(true);
    try {
      const { getPedidos } = await import('../../services/pedido.service');
      const [ventasData, cortesData, pedidosData] = await Promise.all([
        getVentas(0, 50),
        getCortesPorVendedor(miID),
        getPedidos(0, 50),
      ]);

      const misVentas = ventasData || [];
      const misCortes = cortesData || [];
      const misPedidos = pedidosData || [];

      setUltimasVentas(misVentas.slice(0, 5));
      setPedidosPendientes(misPedidos.filter((p: any) => p.estado === 'Pendiente').slice(0, 5));

      // Pines provenientes de ventas
      const totalPinesVentas = misVentas.reduce(
        (acc: number, v: any) =>
          acc +
          (v.detalles || []).reduce(
            (sum: number, d: any) => sum + (Number(d.cantidad) || 0),
            0,
          ),
        0,
      );

      // Pines provenientes de cortes
      const totalPinesCortes = misCortes.reduce(
        (acc: number, c: any) =>
          acc +
          (c.detalles || []).reduce(
            (sum: number, d: any) =>
              sum + (Number(d.cantidad_vendida) || 0),
            0,
          ),
        0,
      );

      const totalPines = totalPinesVentas + totalPinesCortes;
      const totalComisiones = totalPines * 6.5;

      setStats({
        comisiones: totalComisiones,
        pinesTotales: totalPines,
      });

      // --- Gráfica 1: INGRESOS POR MES (historial + predicción) ---
      const revenueByMonth: Record<string, number> = {};
      misVentas.forEach((v: any) => {
        const d = new Date(v.fecha_venta);
        if (Number.isNaN(d.getTime())) return;
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        revenueByMonth[mKey] =
          (revenueByMonth[mKey] || 0) + (Number(v.monto_total) || 0);
      });

      const sortedRevKeys = Object.keys(revenueByMonth).sort();
      const historical = sortedRevKeys.slice(-5).map((key) => ({
        label: key.split('-')[1], // "01", "02", etc.
        value: revenueByMonth[key],
      }));

      setHistoricalData(historical);

      if (historical.length >= 2) {
        const valores = historical.map((h) => h.value);
        const { prediccion } = calcularPrediccionLaplace(
          valores,
          0.15,
        );
        const lastKey = sortedRevKeys[sortedRevKeys.length - 1];
        const lastMonth = parseInt(lastKey.split('-')[1], 10);
        const nextMonth = ((lastMonth % 12) + 1)
          .toString()
          .padStart(2, '0');
        setPrediction({ value: prediccion, label: nextMonth });
      } else {
        setPrediction({ value: 0, label: '' });
      }

      // --- Gráfica 2: PINES POR MES ---
      const pinesByMonth: Record<string, number> = {};
      misVentas.forEach((v: any) => {
        const d = new Date(v.fecha_venta);
        if (Number.isNaN(d.getTime())) return;
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;

        const pinesVenta = (v.detalles || []).reduce(
          (sum: number, d: any) => sum + (Number(d.cantidad) || 0),
          0,
        );
        pinesByMonth[mKey] = (pinesByMonth[mKey] || 0) + pinesVenta;
      });

      misCortes.forEach((c: any) => {
        const d = new Date(c.fecha_corte);
        if (Number.isNaN(d.getTime())) return;
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;

        const pinesCorte = (c.detalles || []).reduce(
          (sum: number, d: any) =>
            sum + (Number(d.cantidad_vendida) || 0),
          0,
        );
        pinesByMonth[mKey] = (pinesByMonth[mKey] || 0) + pinesCorte;
      });

      const sortedPinesKeys = Object.keys(pinesByMonth).sort();
      const pinesSeries = sortedPinesKeys.slice(-5).map((key) => ({
        label: key.split('-')[1],
        value: pinesByMonth[key],
      }));

      setPinesPorMes(pinesSeries);
    } catch (err) {
      // Error silencioso
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const profileImg = formatImageUri(usuario?.foto_perfil);

  return (
    <View style={styles.container}>
      <DashboardPattern />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadStats}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Hola,</Text>
              <Text style={styles.nameText}>
                {usuario?.username ||
                  usuario?.nombre_completo ||
                  'Vendedor'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/perfil')}
            >
              <Image
                source={
                  profileImg
                    ? { uri: profileImg }
                    : require('../../../assets/images/logon.png')
                }
                style={styles.profilePic}
              />
            </TouchableOpacity>
          </View>

          <Animated.View
            entering={FadeInUp.duration(800)}
            style={styles.mainBalanceCard}
          >
            <Text style={styles.balanceLabel}>
              COMISIONES ACUMULADAS
            </Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(stats.comisiones)}
            </Text>
            <View style={styles.balanceFooter}>
              <MaterialCommunityIcons
                name="trending-up"
                size={16}
                color="#FFF"
              />
              <Text style={styles.balanceTrend}>
                Tu progreso actual
              </Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>RESUMEN DE ACTIVIDAD</Text>
          <View style={styles.statsGrid}>
            <StatCard
              index={1}
              icon="pin"
              label="Pines Totales"
              value={String(stats.pinesTotales)}
              color={Colors.success}
            />
            <StatCard
              index={2}
              icon="chart-line"
              label="Proyección"
              value={formatCurrency(prediction.value)}
              color={Colors.info}
            />
          </View>

          <Text style={styles.sectionTitle}>ACCIONES RÁPIDAS</Text>
          <View style={styles.actionsContainer}>
            <ActionItem
              index={1}
              icon="plus"
              label="Nueva Venta"
              onPress={() => router.push('/ventas/create')}
              color={Colors.primary}
            />
            <ActionItem
              index={2}
              icon="account-group"
              label="Clientes"
              onPress={() => router.push('/clientes')}
              color={Colors.success}
            />
            <ActionItem
              index={3}
              icon="clipboard-list"
              label="Pedidos"
              onPress={() => router.push('/pedidos')}
              color={Colors.warning}
            />
            <ActionItem
              index={4}
              icon="logout"
              label="Salir"
              onPress={logout}
              color={Colors.pink}
            />
          </View>

          <ListSection 
            title="ÚLTIMAS VENTAS" 
            data={ultimasVentas} 
            type="venta" 
            emptyMessage="No hay ventas registradas." 
          />

          <ListSection 
            title="PEDIDOS PENDIENTES" 
            data={pedidosPendientes} 
            type="pedido" 
            emptyMessage="No tienes pedidos pendientes." 
          />

          {/* Gráfica 1: ingresos por mes */}
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>TENDENCIA PERSONAL</Text>
            <PredictionChart
              data={historicalData}
              predictedValue={prediction.value}
              predictedLabel={prediction.label}
            />
          </View>

          {/* Gráfica 2: pines por mes */}
          <View style={[styles.chartSection, { marginTop: 24, marginBottom: 50 }]}>
            <Text style={styles.chartTitle}>PINES POR MES</Text>
            <PredictionChart
              data={pinesPorMes}
            />
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
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: Colors.pink,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderWidth: 2,
    borderColor: Colors.dark,
    borderTopWidth: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
  },
  nameText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  mainBalanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  balanceLabel: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  balanceValue: {
    color: Colors.dark,
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  balanceFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceTrend: { color: Colors.pink, fontSize: 10, fontWeight: '800' },

  content: { paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.dark,
    marginTop: 25,
    marginBottom: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
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
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.4)',
    textTransform: 'uppercase',
  },

  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
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
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  actionText: { fontSize: 12, fontWeight: '900', color: Colors.dark },

  listSection: {
    marginTop: 10,
  },
  listItem: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
  },
  listItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.dark,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.dark,
  },
  listItemSub: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.4)',
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.3)',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
  },

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
  chartTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 15,
    color: Colors.dark,
  },
});
