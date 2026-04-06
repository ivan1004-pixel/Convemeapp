import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { formatCurrency, formatDate } from '../../utils';
import type { Venta } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Ajustamos el ancho para que siempre sobre margen lateral
const TICKET_WIDTH = SCREEN_WIDTH * 0.82;

interface SalesTicketProps {
  venta: Venta;
}

export function SalesTicket({ venta }: SalesTicketProps) {
  const total = venta.monto_total;

  return (
    <View style={styles.container}>
      {/* Header con Rosa y Amarillo */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <Image
            source={require('../../../assets/images/mascota.png')}
            style={styles.mascota}
            resizeMode="contain"
            />
            <View style={styles.headerRight}>
                <Text style={styles.ticketType}>COMPROBANTE DE VENTA</Text>
                <Image
                  source={require('../../../assets/images/logon.png')}
                  style={styles.logoMarca}
                  resizeMode="contain"
                />
            </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Info principal con fondo amarillo sutil */}
        <View style={styles.yellowSection}>
            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>TICKET #</Text>
                    <Text style={styles.infoValue}>{venta.id_venta}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>FECHA</Text>
                    <Text style={styles.infoValue}>{formatDate(venta.fecha_venta)}</Text>
                </View>
            </View>

            {venta.vendedor && (
                <View style={styles.metaSection}>
                    <Text style={styles.metaLabel}>ATENDIDO POR:</Text>
                    <Text style={styles.metaValue}>{venta.vendedor.nombre_completo?.toUpperCase()}</Text>
                </View>
            )}
        </View>

        <View style={styles.divider} />

        {/* Productos */}
        <Text style={styles.sectionTitle}>DETALLE DE PRODUCTOS</Text>
        {venta.detalles && venta.detalles.length > 0 ? (
          venta.detalles.map((det, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>{det.producto?.nombre?.toUpperCase()}</Text>
                <Text style={styles.itemQty}>{det.cantidad} x {formatCurrency(det.precio_unitario)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(det.cantidad * det.precio_unitario)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>Sin productos</Text>
        )}

        <View style={styles.divider} />

        {/* Total con Amarillo Neobrutalista */}
        <View style={styles.totalContainer}>
            <View style={styles.totalBadge}>
                <Text style={styles.totalFinalLabel}>MÉTODO: {venta.metodo_pago?.toUpperCase() || 'EFECTIVO'}</Text>
                <Text style={styles.totalFinalValue}>{formatCurrency(total)}</Text>
            </View>
        </View>

        <View style={styles.footer}>
            <Text style={styles.footerText}>¡GRACIAS POR TU COMPRA!</Text>
            <Text style={styles.footerTagline}>WWW.CONVEME.COM</Text>
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
  yellowSection: {
    backgroundColor: Colors.warning + '30', // AMARILLO SUTIL
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warning,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark,
  },
  metaSection: {
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.4)',
  },
  metaValue: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark,
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
    backgroundColor: '#F9FAFB',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  itemName: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dark,
  },
  itemQty: {
    fontSize: 8,
    color: 'rgba(0,0,0,0.5)',
  },
  itemTotal: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
  },
  noData: {
    fontSize: 9,
    textAlign: 'center',
    color: 'rgba(0,0,0,0.3)',
    padding: 10,
  },
  totalContainer: {
    marginTop: 5,
  },
  totalBadge: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: Colors.dark,
    backgroundColor: Colors.warning, // AMARILLO
    alignItems: 'center',
  },
  totalFinalLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.6)',
  },
  totalFinalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark,
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.dark,
  },
  footerTagline: {
    fontSize: 7,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.4)',
    marginTop: 2,
  },
});
