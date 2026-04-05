import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PermissionGuard } from '@/src/components/PermissionGuard';
import { Card } from '@/src/components/ui/Card';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';

export default function ReportesScreen() {
  return (
    <PermissionGuard permission="reportes:read" showFallback>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Reportes</Text>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>📊 Reporte Diario</Text>
            <Text style={styles.cardDesc}>Ventas y pedidos del día de hoy</Text>
          </Card>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>📅 Reporte Mensual</Text>
            <Text style={styles.cardDesc}>Resumen de ventas del mes actual</Text>
          </Card>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>👥 Reporte por Vendedor</Text>
            <Text style={styles.cardDesc}>Desempeño de cada vendedor</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </PermissionGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: Spacing.screenPadding, paddingBottom: 40 },
  title: { ...Typography.h1, color: Colors.text, marginBottom: Spacing.lg },
  card: { marginBottom: Spacing.md },
  cardTitle: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  cardDesc: { ...Typography.body, color: Colors.textSecondary },
});
