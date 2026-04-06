import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getVentas } from '../../../src/services/venta.service';
import { getCortes } from '../../../src/services/corte.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { formatCurrency, formatDate } from '../../../src/utils';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

const { width, height } = Dimensions.get('window');

export default function DetalleMesScreen() {
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<any[]>([]);
  const [cortes, setCortes] = useState<any[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vData, cData] = await Promise.all([getVentas(), getCortes()]);
      const now = new Date();
      
      const esteMesV = vData.filter((v: any) => {
        const d = new Date(v.fecha_venta);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const esteMesC = cData.filter((c: any) => {
        const d = new Date(c.fecha_corte);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      setVentas(esteMesV);
      setCortes(esteMesC);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groupedByDay = useMemo(() => {
    const days: Record<string, { ventas: number, cortes: number, total: number, date: string }> = {};
    ventas.forEach(v => {
        const dStr = new Date(v.fecha_venta).toISOString().split('T')[0];
        if (!days[dStr]) days[dStr] = { ventas: 0, cortes: 0, total: 0, date: dStr };
        days[dStr].ventas += v.monto_total;
        days[dStr].total += v.monto_total;
    });
    cortes.forEach(c => {
        const dStr = new Date(c.fecha_corte).toISOString().split('T')[0];
        if (!days[dStr]) days[dStr] = { ventas: 0, cortes: 0, total: 0, date: dStr };
        days[dStr].cortes += (c.dinero_total_entregado || 0);
        days[dStr].total += (c.dinero_total_entregado || 0);
    });
    return Object.values(days).sort((a, b) => b.date.localeCompare(a.date));
  }, [ventas, cortes]);

  const vendorBreakdown = useMemo(() => {
    const vendors: Record<string, number> = {};
    ventas.forEach(v => {
        const name = v.vendedor?.nombre_completo || 'Sin nombre';
        vendors[name] = (vendors[name] || 0) + v.monto_total;
    });
    cortes.forEach(c => {
        const name = c.vendedor?.nombre_completo || 'Sin nombre';
        vendors[name] = (vendors[name] || 0) + (c.dinero_total_entregado || 0);
    });
    return Object.entries(vendors).map(([name, amount]) => ({ name, amount })).sort((a,b) => b.amount - a.amount);
  }, [ventas, cortes]);

  const bestVendor = vendorBreakdown.length > 0 ? vendorBreakdown[0] : null;
  const totalMensual = groupedByDay.reduce((acc, d) => acc + d.total, 0);

  if (loading) {
    return (
      <NeobrutalistBackground>
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
        </SafeAreaView>
      </NeobrutalistBackground>
    );
  }

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Auditoría Mensual</Text>
          <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
            <MaterialCommunityIcons name="refresh" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Resumen por Día</Text>
          {groupedByDay.map((day, i) => (
              <View key={i} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                      <Text style={styles.dayDate}>{formatDate(day.date).toUpperCase()}</Text>
                      <Text style={styles.dayTotal}>{formatCurrency(day.total)}</Text>
                  </View>
                  <View style={styles.dayDetails}>
                      <View style={styles.miniStat}>
                          <Text style={styles.miniLabel}>VENTAS</Text>
                          <Text style={[styles.miniValue, {color: Colors.success}]}>{formatCurrency(day.ventas)}</Text>
                      </View>
                      <View style={styles.dayDivider} />
                      <View style={styles.miniStat}>
                          <Text style={styles.miniLabel}>CORTES</Text>
                          <Text style={[styles.miniValue, {color: Colors.blue}]}>{formatCurrency(day.cortes)}</Text>
                      </View>
                  </View>
              </View>
          ))}

          {/* TICKET DE REPORTE FINAL MULTICOLOR */}
          <View style={styles.ticketContainer}>
              <View style={styles.ticketHeader}>
                  <View style={styles.pinkHeader}>
                      <Image source={require('../../../assets/images/mascota.png')} style={styles.ticketMascota} />
                      <View>
                          <Text style={styles.ticketTitle}>CIERRE DE MES</Text>
                          <Text style={styles.ticketSub}>{new Date().toLocaleString('es-MX', { month: 'long' }).toUpperCase()}</Text>
                      </View>
                  </View>
              </View>
              
              <View style={styles.ticketBody}>
                  <View style={styles.ticketSection}>
                      <Text style={styles.ticketLabel}>INGRESOS TOTALES</Text>
                      <Text style={styles.ticketBigAmount}>{formatCurrency(totalMensual)}</Text>
                  </View>

                  <View style={styles.dashedLine} />

                  <Text style={styles.ticketSectionTitle}>RENDIMIENTO POR VENDEDOR</Text>
                  {vendorBreakdown.map((v, i) => (
                      <View key={i} style={styles.vendorRow}>
                          <Text style={styles.vendorName} numberOfLines={1}>• {v.name.toUpperCase()}</Text>
                          <Text style={[styles.vendorAmount, {color: Colors.blue}]}>{formatCurrency(v.amount)}</Text>
                      </View>
                  ))}

                  <View style={styles.dashedLine} />
                  
                  {bestVendor && (
                      <TouchableOpacity 
                        style={styles.winnerBtn} 
                        onPress={() => setShowWinnerModal(true)}
                        activeOpacity={0.8}
                      >
                          <MaterialCommunityIcons name="trophy" size={24} color="#FFF" />
                          <Text style={styles.winnerBtnText}>VENDEDOR DEL MES</Text>
                      </TouchableOpacity>
                  )}

                  <View style={styles.ticketFooter}>
                      <Text style={styles.footerBrand}>CONVEME - AUDITORÍA INTERNA</Text>
                  </View>
              </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* MODAL CELEBRACIÓN VENDEDOR DEL MES */}
        <Modal visible={showWinnerModal} transparent animationType="slide">
            <View style={styles.winnerOverlay}>
                <Image source={require('../../../assets/images/gato.gif')} style={styles.winnerGif} />
                
                <View style={styles.winnerCard}>
                    <MaterialCommunityIcons name="star" size={40} color={Colors.warning} />
                    <Text style={styles.winnerLabel}>¡EL MEJOR DEL MES!</Text>
                    <Text style={styles.winnerName}>{bestVendor?.name.toUpperCase()}</Text>
                    <View style={styles.winnerAmountBadge}>
                        <Text style={styles.winnerAmount}>{formatCurrency(bestVendor?.amount || 0)}</Text>
                    </View>
                    <Text style={styles.winnerQuote}>"¡Gracias por tu gran esfuerzo este mes!"</Text>
                    
                    <TouchableOpacity 
                        style={styles.closeWinner} 
                        onPress={() => setShowWinnerModal(false)}
                    >
                        <Text style={styles.closeWinnerText}>CERRAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.h4, fontWeight: '900', color: Colors.dark },
  scrollContent: { paddingHorizontal: Spacing.lg },
  sectionTitle: { ...Typography.label, fontWeight: '900', marginBottom: 15, textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', letterSpacing: 1 },
  
  dayCard: { backgroundColor: '#FFF', borderRadius: BorderRadius.xl, borderWidth: 3, borderColor: Colors.dark, marginBottom: Spacing.md, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, overflow: 'hidden' },
  dayHeader: { padding: Spacing.md, backgroundColor: Colors.dark, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayDate: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  dayTotal: { color: Colors.warning, fontWeight: '900', fontSize: 16 },
  dayDetails: { flexDirection: 'row', padding: Spacing.md, alignItems: 'center' },
  miniStat: { flex: 1, alignItems: 'center' },
  miniLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 4 },
  miniValue: { fontSize: 13, fontWeight: '800' },
  dayDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.05)' },

  // TICKET MULTICOLOR
  ticketContainer: { backgroundColor: '#FFF', borderRadius: BorderRadius.xl, borderWidth: 4, borderColor: Colors.dark, marginTop: Spacing.xl, overflow: 'hidden', shadowColor: Colors.dark, shadowOffset: { width: 8, height: 8 }, shadowOpacity: 1 },
  pinkHeader: { backgroundColor: Colors.pink, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 4, borderColor: Colors.dark },
  ticketMascota: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: Colors.dark, backgroundColor: '#FFF' },
  ticketTitle: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  ticketSub: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.4)' },
  ticketBody: { padding: Spacing.lg, backgroundColor: Colors.beige },
  ticketSection: { alignItems: 'center' },
  ticketLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.5)', marginBottom: 5 },
  ticketBigAmount: { fontSize: 34, fontWeight: '900', color: Colors.blue },
  dashedLine: { height: 2, backgroundColor: Colors.dark, marginVertical: 15, borderStyle: 'dashed' },
  ticketSectionTitle: { fontSize: 11, fontWeight: '900', color: Colors.dark, marginBottom: 15, textAlign: 'center' },
  vendorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, backgroundColor: '#FFF', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  vendorName: { fontSize: 11, fontWeight: '800', flex: 1 },
  vendorAmount: { fontSize: 11, fontWeight: '900' },
  
  winnerBtn: { backgroundColor: Colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, borderWidth: 3, borderColor: Colors.dark, gap: 10, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1 },
  winnerBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  ticketFooter: { marginTop: 20, alignItems: 'center' },
  footerBrand: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.3)' },

  // WINNER MODAL
  winnerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  winnerGif: { position: 'absolute', width: '100%', height: '100%', opacity: 0.4 },
  winnerCard: { width: '85%', backgroundColor: Colors.beige, borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 5, borderColor: Colors.dark, shadowColor: Colors.warning, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 20 },
  winnerLabel: { fontSize: 14, fontWeight: '900', color: Colors.primary, letterSpacing: 2, marginTop: 10 },
  winnerName: { fontSize: 28, fontWeight: '900', color: Colors.dark, textAlign: 'center', marginVertical: 15 },
  winnerAmountBadge: { backgroundColor: Colors.warning, paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 3, borderColor: Colors.dark },
  winnerAmount: { fontSize: 24, fontWeight: '900', color: Colors.dark },
  winnerQuote: { fontSize: 14, fontStyle: 'italic', fontWeight: '700', color: 'rgba(0,0,0,0.5)', marginTop: 20, textAlign: 'center' },
  closeWinner: { marginTop: 30, paddingVertical: 12, paddingHorizontal: 40, backgroundColor: Colors.dark, borderRadius: BorderRadius.full },
  closeWinnerText: { color: '#FFF', fontWeight: '900', fontSize: 14 }
});
