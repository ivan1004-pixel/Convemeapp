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
import { LinearGradient } from 'expo-linear-gradient';
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
      activeOpacity={0.75}
      style={styles.actionCard}
    >
      <MaterialCommunityIcons name={icon} size={28} color={color ?? Colors.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, color }: { icon: IconName; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <View style={styles.statInfo}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
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

// ---------- ADMIN DASHBOARD ----------
function AdminDashboard() {
  const { usuario, logout } = useAuth();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.dashHeader}>
        <View style={styles.dashHeaderRow}>
          <View>
            <Text style={styles.logoText}>ConVeMe</Text>
            <Text style={styles.greeting}>{getGreeting()}, {usuario?.username ?? 'Admin'}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.75}>
            <MaterialCommunityIcons name="logout" size={18} color={Colors.textLight} />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="cash-multiple" label="Ventas del mes" value="—" color={Colors.success} />
          <StatCard icon="package-variant" label="Pedidos pend." value="—" color={Colors.warning} />
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="account-group" label="Empleados activos" value="—" color={Colors.info} />
          <StatCard icon="account-tie" label="Vendedores" value="—" color={Colors.primary} />
        </View>
      </LinearGradient>

      {/* Ventas */}
      <Text style={styles.sectionTitle}>Ventas</Text>
      <View style={styles.actionsGrid}>
        <QuickActionCard icon="cash-register" label="Punto de Venta" onPress={() => router.push('/(app)/ventas')} color={Colors.success} />
        <QuickActionCard icon="account-group" label="Mis Clientes" onPress={() => router.push('/(app)/clientes')} color={Colors.info} />
      </View>

      {/* Logística */}
      <Text style={styles.sectionTitle}>Logística</Text>
      <View style={styles.actionsGrid}>
        <QuickActionCard icon="warehouse" label="Inventario" onPress={() => router.push('/(app)/productos')} color={Colors.warning} />
        <QuickActionCard icon="factory" label="Producción" onPress={() => router.push('/(app)/produccion')} color={Colors.primary} />
      </View>

      {/* Admin */}
      <Text style={styles.sectionTitle}>Administración</Text>
      <View style={styles.actionsGrid}>
        <QuickActionCard icon="account-plus" label="Crear Usuario" onPress={() => router.push('/auth/register')} color={Colors.primary} />
        <QuickActionCard icon="account-tie" label="Mis Vendedores" onPress={() => router.push('/(app)/vendedores')} color={Colors.info} />
        <QuickActionCard icon="account-hard-hat" label="Empleados" onPress={() => router.push('/(app)/empleados')} color={Colors.warning} />
        <QuickActionCard icon="school" label="Escuelas" onPress={() => router.push('/(app)/escuelas')} color={Colors.success} />
      </View>

      {/* Perfil */}
      <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(app)/perfil')} activeOpacity={0.8}>
        <MaterialCommunityIcons name="account-circle" size={20} color={Colors.primary} />
        <Text style={styles.profileBtnText}>Mi Perfil</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------- VENDEDOR DASHBOARD ----------
function VendedorDashboard() {
  const { usuario, logout } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [prediccion, setPrediccion] = useState<PrediccionVentas | null>(null);
  const [loadingPred, setLoadingPred] = useState(false);

  const loadPrediccion = useCallback(async () => {
    setLoadingPred(true);
    try {
      const data = await getPrediccionVentasService();
      setPrediccion(data);
    } catch {
      showToast('No se pudo cargar la predicción. Intenta más tarde.', 'warning');
    } finally {
      setLoadingPred(false);
    }
  }, []);

  useEffect(() => {
    loadPrediccion();
  }, [loadPrediccion]);

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loadingPred} onRefresh={loadPrediccion} tintColor={Colors.info} />}
      >
        {/* Header */}
        <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.dashHeader}>
          <View style={styles.dashHeaderRow}>
            <View>
              <Text style={styles.logoText}>ConVeMe</Text>
              <Text style={styles.greeting}>{getGreeting()}, {usuario?.username ?? 'Vendedor'}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.75}>
              <MaterialCommunityIcons name="logout" size={18} color={Colors.textLight} />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* PrediccionesERP */}
          <View style={styles.predSection}>
            <View style={styles.predHeader}>
              <MaterialCommunityIcons name="chart-line" size={20} color={Colors.info} />
              <Text style={styles.predTitle}>Predicción de Ventas</Text>
              <TouchableOpacity onPress={loadPrediccion} style={styles.refreshBtn} disabled={loadingPred}>
                <MaterialCommunityIcons name="refresh" size={18} color={Colors.info} />
              </TouchableOpacity>
            </View>

            {loadingPred ? (
              <ActivityIndicator color={Colors.info} size="small" style={{ marginVertical: Spacing.lg }} />
            ) : prediccion ? (
              <>
                <Text style={styles.predMonth}>{prediccion.mes_predicho}</Text>
                <PredictionChart
                  data={[]}
                  predictedValue={prediccion.ventas_esperadas}
                  predictedLabel={prediccion.mes_predicho}
                />
                <View style={styles.predCards}>
                  <PredictionStatCard
                    label="Ventas Esperadas"
                    value={`$${prediccion.ventas_esperadas.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
                    color={Colors.info}
                  />
                  <PredictionStatCard
                    label="Crecimiento"
                    value={`+${prediccion.crecimiento_pct.toFixed(1)}%`}
                    color={Colors.success}
                  />
                  <PredictionStatCard
                    label="Confianza"
                    value={`${prediccion.confianza_pct.toFixed(1)}%`}
                    color={Colors.warning}
                  />
                </View>

                {/* Confidence bar */}
                <View style={styles.confidenceBar}>
                  <Text style={styles.confidenceLabel}>Nivel de Confianza</Text>
                  <View style={styles.confidenceTrack}>
                    <View
                      style={[
                        styles.confidenceFill,
                        { width: `${Math.min(prediccion.confianza_pct, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.confidencePct}>{prediccion.confianza_pct.toFixed(1)}%</Text>
                </View>
              </>
            ) : (
              <Text style={styles.noPredText}>Sin datos de predicción</Text>
            )}
          </View>
        </LinearGradient>

        {/* Ventas */}
        <Text style={styles.sectionTitle}>Ventas</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard icon="cash-register" label="Punto de Venta" onPress={() => router.push('/(app)/ventas')} color={Colors.success} />
          <QuickActionCard icon="account-group" label="Mis Clientes" onPress={() => router.push('/(app)/clientes')} color={Colors.info} />
        </View>

        {/* Pedidos */}
        <Text style={styles.sectionTitle}>Pedidos</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard icon="package-variant-plus" label="Solicitar Mercancía" onPress={() => router.push('/(app)/pedidos/create')} color={Colors.warning} />
          <QuickActionCard icon="clipboard-list" label="Ver Estatus" onPress={() => router.push('/(app)/pedidos')} color={Colors.primary} />
        </View>

        {/* Cuentas */}
        <Text style={styles.sectionTitle}>Cuentas</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard icon="receipt" label="Historial Ventas" onPress={() => router.push('/(app)/ventas')} color={Colors.success} />
          <QuickActionCard icon="bank" label="Pagos Recibidos" onPress={() => router.push('/(app)/cortes')} color={Colors.warning} />
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
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  dashHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  dashHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontFamily: 'Galada',
    fontSize: 32,
    color: Colors.textLight,
  },
  greeting: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  logoutText: {
    ...Typography.label,
    color: Colors.textLight,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    gap: Spacing.sm,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    ...Typography.h4,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textLight,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionLabel: {
    ...Typography.label,
    color: Colors.textLight,
    textAlign: 'center',
    fontSize: 12,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileBtnText: {
    ...Typography.body,
    color: Colors.textLight,
    flex: 1,
  },
  // Prediction
  predSection: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  predHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  predTitle: {
    ...Typography.h4,
    color: Colors.textLight,
    flex: 1,
  },
  refreshBtn: {
    padding: Spacing.xs,
  },
  predMonth: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.sm,
  },
  predCards: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  confidenceBar: {
    marginTop: Spacing.md,
    gap: 4,
  },
  confidenceLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  confidenceTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 3,
  },
  confidencePct: {
    ...Typography.caption,
    color: Colors.warning,
    textAlign: 'right',
  },
  noPredText: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
