import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { formatCurrency, formatDate } from '../../utils';
import type { Corte } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TICKET_WIDTH = SCREEN_WIDTH * 0.82;

interface CorteTicketProps {
  corte: Corte;
}

export function CorteTicket({ corte }: CorteTicketProps) {
  const diff = corte.diferencia_corte || 0;
  const isOk = Math.abs(diff) < 0.01;

  return (
    <View style={styles.container}>
      {/* Header Neobrutalista Rosa */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <Image
            source={require('../../../assets/images/mascota.png')}
            style={styles.mascota}
            resizeMode="contain"
            />
            <View style={styles.headerRight}>
                <Text style={styles.ticketType}>REPORTE DE LIQUIDACIÓN</Text>
                <Text style={styles.brandName}>CONVEME</Text>
            </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Info principal con toque amarillo */}
        <View style={styles.infoSection}>
            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>FOLIO CORTE</Text>
                    <Text style={styles.infoValue}>#{corte.id_corte}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>FECHA</Text>
                    <Text style={styles.infoValue}>{formatDate(corte.fecha_corte)}</Text>
                </View>
            </View>

            <View style={styles.vendedorSection}>
                <Text style={styles.vendedorLabel}>VENDEDOR:</Text>
                <Text style={styles.vendedorName}>{corte.vendedor?.nombre_completo?.toUpperCase() || 'N/A'}</Text>
            </View>
        </View>

        <View style={styles.divider} />

        {/* Productos */}
        <Text style={styles.sectionTitle}>RESUMEN DE INVENTARIO</Text>
        {corte.detalles && corte.detalles.length > 0 ? (
          corte.detalles.map((det, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{det.producto?.nombre?.toUpperCase()}</Text>
              <View style={styles.itemStats}>
                <Text style={styles.statItem}>V:{det.cantidad_vendida}</Text>
                <Text style={styles.statItem}>D:{det.cantidad_devuelta || 0}</Text>
                <Text style={styles.statItem}>M:{det.merma_reportada || 0}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>Sin detalles de productos</Text>
        )}

        <View style={styles.divider} />

        {/* Liquidación con Amarillo resaltado */}
        <View style={styles.moneyContainer}>
            <View style={styles.moneyRow}>
                <Text style={styles.moneyLabel}>NETO ESPERADO</Text>
                <Text style={styles.moneyValue}>{formatCurrency(corte.dinero_esperado || 0)}</Text>
            </View>
            <View style={styles.moneyRow}>
                <Text style={styles.moneyLabel}>EFECTIVO RECIBIDO</Text>
                <Text style={styles.moneyValue}>{formatCurrency(corte.dinero_total_entregado || 0)}</Text>
            </View>
            
            <View style={[
                styles.diffBadge, 
                { backgroundColor: isOk ? Colors.success : (diff > 0 ? Colors.warning : Colors.error) }
            ]}>
                <Text style={styles.diffLabel}>DIFERENCIA FINAL</Text>
                <Text style={styles.diffValue}>
                    {diff > 0.01 ? '+' : ''}{formatCurrency(diff)}
                </Text>
            </View>
        </View>

        <View style={styles.footer}>
            <Text style={styles.footerText}>ID ASIGNACIÓN: #{corte.asignacion?.id_asignacion || 'N/A'}</Text>
            <Text style={styles.footerTagline}>SISTEMA DE GESTIÓN CONVEME</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TICKET_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    borderColor: Colors.dark,
    overflow: 'hidden',
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  header: {
    backgroundColor: Colors.pink, // ROSA
    padding: Spacing.md,
    borderBottomWidth: 3,
    borderColor: Colors.dark,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mascota: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.dark,
    backgroundColor: '#FFF',
  },
  headerRight: {
    flex: 1,
    marginLeft: 10,
  },
  ticketType: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
  },
  body: {
    padding: Spacing.md,
    backgroundColor: Colors.light,
  },
  infoSection: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.4)',
  },
  infoValue: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark,
  },
  vendedorSection: {
    marginTop: 2,
  },
  vendedorLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.4)',
  },
  vendedorName: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
  },
  divider: {
    height: 2,
    backgroundColor: Colors.dark,
    marginVertical: 10,
    borderStyle: 'dashed',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  itemName: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dark,
    flex: 1,
  },
  itemStats: {
    flexDirection: 'row',
    gap: 5,
  },
  statItem: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.primary,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  noData: {
    fontSize: 9,
    textAlign: 'center',
    color: 'rgba(0,0,0,0.3)',
    padding: 10,
  },
  moneyContainer: {
    marginTop: 5,
  },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  moneyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
  },
  moneyValue: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark,
  },
  diffBadge: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: Colors.dark,
    backgroundColor: Colors.warning, // AMARILLO POR DEFECTO
    alignItems: 'center',
  },
  diffLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.6)',
  },
  diffValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  footer: {
    marginTop: 15,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.4)',
  },
  footerTagline: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.dark,
    marginTop: 2,
  },
});
