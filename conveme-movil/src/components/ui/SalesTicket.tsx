import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { formatCurrency, formatDate } from '../../utils';
import type { Venta } from '../../types';

const { width } = Dimensions.get('window');
const TICKET_WIDTH = Math.min(width * 0.9, 350);

interface SalesTicketProps {
  venta: Venta;
}

export function SalesTicket({ venta }: SalesTicketProps) {
  const subtotal = venta.monto_total;
  const total = venta.monto_total;

  return (
    <View style={styles.container}>
      {/* Header con mascota y logo */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/images/mascota.png')}
          style={styles.mascota}
          resizeMode="contain"
        />
        <View style={styles.headerText}>
          <Image
            source={require('../../../assets/images/logob.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>¡Convénceme!</Text>
        </View>
      </View>

      {/* Separador decorativo */}
      <View style={styles.separator}>
        <View style={styles.zigzag} />
      </View>

      {/* Info del ticket */}
      <View style={styles.ticketInfo}>
        <View style={styles.ticketRow}>
          <Text style={styles.ticketLabel}>TICKET #</Text>
          <Text style={styles.ticketValue}>{venta.id_venta}</Text>
        </View>
        <View style={styles.ticketRow}>
          <Text style={styles.ticketLabel}>FECHA</Text>
          <Text style={styles.ticketValue}>{formatDate(venta.fecha_venta)}</Text>
        </View>
      </View>

      {/* Vendedor */}
      {venta.vendedor && (
        <View style={styles.vendedorBox}>
          <Text style={styles.vendedorLabel}>VENDEDOR</Text>
          <Text style={styles.vendedorName}>{venta.vendedor.nombre_completo}</Text>
        </View>
      )}

      {/* Cliente */}
      {venta.cliente && (
        <View style={styles.clienteBox}>
          <Text style={styles.clienteLabel}>CLIENTE</Text>
          <Text style={styles.clienteName}>{venta.cliente.nombre_completo}</Text>
        </View>
      )}

      {/* Separador */}
      <View style={styles.dashedLine} />

      {/* Productos */}
      <View style={styles.productos}>
        <Text style={styles.productosTitle}>PRODUCTOS</Text>
        {venta.detalles && venta.detalles.length > 0 ? (
          venta.detalles.map((det, index) => (
            <View key={index} style={styles.productoRow}>
              <View style={styles.productoInfo}>
                <Text style={styles.productoNombre}>
                  {det.producto?.nombre || 'Producto'}
                </Text>
                <Text style={styles.productoSku}>
                  SKU: {det.producto?.sku || '-'}
                </Text>
              </View>
              <View style={styles.productoCalc}>
                <Text style={styles.productoCantidad}>
                  {det.cantidad} × {formatCurrency(det.precio_unitario)}
                </Text>
                <Text style={styles.productoSubtotal}>
                  {formatCurrency(det.cantidad * det.precio_unitario)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noProducts}>Sin productos</Text>
        )}
      </View>

      {/* Separador */}
      <View style={styles.dashedLine} />

      {/* Totales */}
      <View style={styles.totales}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>SUBTOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={[styles.totalRow, styles.totalFinal]}>
          <Text style={styles.totalLabelFinal}>TOTAL</Text>
          <Text style={styles.totalValueFinal}>{formatCurrency(total)}</Text>
        </View>
      </View>

      {/* Método de pago */}
      {venta.metodo_pago && (
        <View style={styles.pagoBox}>
          <Text style={styles.pagoLabel}>MÉTODO DE PAGO</Text>
          <Text style={styles.pagoValue}>{venta.metodo_pago.toUpperCase()}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>¡GRACIAS POR TU COMPRA!</Text>
        <Text style={styles.footerSubtext}>ConveMe - Sistema de Ventas</Text>
      </View>

      {/* Separador decorativo inferior */}
      <View style={styles.separator}>
        <View style={styles.zigzag} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TICKET_WIDTH,
    backgroundColor: Colors.light,
    borderRadius: BorderRadius.xl,
    borderWidth: 4,
    borderColor: Colors.dark,
    overflow: 'hidden',
    // Neobrutalist shadow
    shadowColor: Colors.dark,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  header: {
    backgroundColor: Colors.pink,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 4,
    borderBottomColor: Colors.dark,
  },
  mascota: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: Colors.dark,
    backgroundColor: Colors.light,
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.md,
    alignItems: 'flex-end',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.caption,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
  },
  separator: {
    height: 20,
    backgroundColor: Colors.beige,
    overflow: 'hidden',
  },
  zigzag: {
    width: '100%',
    height: 20,
    backgroundColor: Colors.pink,
    borderBottomWidth: 4,
    borderBottomColor: Colors.dark,
  },
  ticketInfo: {
    backgroundColor: Colors.beige,
    padding: Spacing.md,
    borderBottomWidth: 4,
    borderBottomColor: Colors.dark,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  ticketLabel: {
    ...Typography.caption,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
  },
  ticketValue: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.blue,
  },
  vendedorBox: {
    backgroundColor: Colors.blue,
    padding: Spacing.md,
    borderBottomWidth: 4,
    borderBottomColor: Colors.dark,
  },
  vendedorLabel: {
    ...Typography.caption,
    fontWeight: '900',
    color: Colors.light,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  vendedorName: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.light,
  },
  clienteBox: {
    backgroundColor: Colors.pink,
    padding: Spacing.md,
    borderBottomWidth: 4,
    borderBottomColor: Colors.dark,
  },
  clienteLabel: {
    ...Typography.caption,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  clienteName: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.dark,
  },
  dashedLine: {
    height: 2,
    backgroundColor: Colors.dark,
    marginVertical: Spacing.sm,
  },
  productos: {
    padding: Spacing.md,
    backgroundColor: Colors.light,
  },
  productosTitle: {
    ...Typography.bodySmall,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  productoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.beige,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  productoInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productoNombre: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.dark,
  },
  productoSku: {
    ...Typography.caption,
    color: Colors.textDark,
    opacity: 0.7,
  },
  productoCalc: {
    alignItems: 'flex-end',
  },
  productoCantidad: {
    ...Typography.caption,
    color: Colors.textDark,
  },
  productoSubtotal: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.blue,
  },
  noProducts: {
    ...Typography.body,
    color: Colors.textDark,
    textAlign: 'center',
    padding: Spacing.md,
  },
  totales: {
    padding: Spacing.md,
    backgroundColor: Colors.light,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  totalLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textDark,
  },
  totalValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textDark,
  },
  totalFinal: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.pink,
    borderRadius: BorderRadius.md,
    borderWidth: 3,
    borderColor: Colors.dark,
  },
  totalLabelFinal: {
    ...Typography.h4,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
  },
  totalValueFinal: {
    ...Typography.h4,
    fontWeight: '900',
    color: Colors.blue,
  },
  pagoBox: {
    backgroundColor: Colors.beige,
    padding: Spacing.md,
    borderTopWidth: 4,
    borderTopColor: Colors.dark,
    alignItems: 'center',
  },
  pagoLabel: {
    ...Typography.caption,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  pagoValue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.blue,
  },
  footer: {
    backgroundColor: Colors.blue,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.body,
    fontWeight: '900',
    color: Colors.light,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  footerSubtext: {
    ...Typography.caption,
    color: Colors.light,
    opacity: 0.8,
  },
});
