import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

export default function DetalleMesScreen() {
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<any[]>([]);
  const [cortes, setCortes] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vData, cData] = await Promise.all([
        getVentas(),
        getCortes()
      ]);

      const now = new Date();
      const esteMesVentas = vData.filter((v: any) => {
        const d = new Date(v.fecha_venta);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const esteMesCortes = cData.filter((c: any) => {
        const d = new Date(c.fecha_corte);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      setVentas(esteMesVentas);
      setCortes(esteMesCortes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalVentas = ventas.reduce((acc, v) => acc + v.monto_total, 0);
  const totalCortes = cortes.reduce((acc, c) => acc + c.dinero_total_entregado, 0);

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
          <Text style={styles.title} numberOfLines={1}>Resumen Mensual</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Resumen - Usamos un layout más responsivo */}
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { flex: 1, marginRight: Spacing.sm }]}>
              <Text style={styles.summaryLabel}>VENTAS</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(totalVentas)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { flex: 1, marginLeft: Spacing.sm }]}>
              <Text style={styles.summaryLabel}>CORTES</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(totalCortes)}
              </Text>
            </View>
          </View>

          {/* Listado Ventas */}
          <Text style={styles.sectionTitle}>Ventas del mes</Text>
          {ventas.length === 0 ? (
            <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No hay ventas este mes</Text>
            </View>
          ) : (
            ventas.slice(0, 10).map((v, i) => (
              <View key={i} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{v.vendedor?.nombre_completo || 'Vendedor'}</Text>
                  <Text style={styles.itemDate}>{formatDate(v.fecha_venta)}</Text>
                </View>
                <Text style={styles.itemAmount}>{formatCurrency(v.monto_total)}</Text>
              </View>
            ))
          )}

          {/* Listado Cortes */}
          <Text style={styles.sectionTitle}>Cortes del mes</Text>
          {cortes.length === 0 ? (
            <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No hay cortes este mes</Text>
            </View>
          ) : (
            cortes.slice(0, 10).map((c, i) => (
              <View key={i} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{c.vendedor?.nombre_completo || 'Vendedor'}</Text>
                  <Text style={styles.itemDate}>{formatDate(c.fecha_corte)}</Text>
                </View>
                <Text style={[styles.itemAmount, { color: Colors.primary }]}>{formatCurrency(c.dinero_total_entregado)}</Text>
              </View>
            ))
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  title: { ...Typography.h4, fontWeight: '900', flex: 1, textAlign: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg },
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.4)', letterSpacing: 1, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '900' },
  sectionTitle: { ...Typography.label, fontWeight: '900', marginBottom: Spacing.md, marginTop: Spacing.md, textTransform: 'uppercase', color: 'rgba(0,0,0,0.6)' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    marginBottom: Spacing.sm,
  },
  itemTitle: { fontSize: 13, fontWeight: '800' },
  itemDate: { fontSize: 10, color: 'rgba(0,0,0,0.5)', marginTop: 2 },
  itemAmount: { fontSize: 14, fontWeight: '900', color: Colors.success },
  emptyCard: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: { color: 'rgba(0,0,0,0.3)', fontWeight: '700', fontSize: 12 },
});
