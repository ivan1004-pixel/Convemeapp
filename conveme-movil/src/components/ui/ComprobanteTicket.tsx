import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { formatCurrency, formatDate } from '../../utils';
import type { Comprobante } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TICKET_WIDTH = SCREEN_WIDTH * 0.85;

interface ComprobanteTicketProps {
  comprobante: Comprobante;
}

export function ComprobanteTicket({ comprobante }: ComprobanteTicketProps) {
  const isPendiente = (comprobante.saldo_pendiente ?? 0) > 0.01;

  return (
    <View style={styles.container}>
      {/* Header con Logo y Mascota */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <Image
                source={require('../../../assets/images/mascota.png')}
                style={styles.mascota}
                resizeMode="contain"
            />
            <View style={styles.headerRight}>
                <Text style={styles.ticketType}>COMPROBANTE DE LIQUIDACIÓN</Text>
                <Image
                  source={require('../../../assets/images/logon.png')}
                  style={styles.logoMarca}
                  resizeMode="contain"
                />
            </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.infoSection}>
            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>FOLIO</Text>
                    <Text style={styles.infoValue}>#{comprobante.id_comprobante}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>FECHA</Text>
                    <Text style={styles.infoValue}>{formatDate(comprobante.fecha_corte)}</Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>VENDEDOR:</Text>
                <Text style={styles.metaValue}>{comprobante.vendedor?.nombre_completo?.toUpperCase() || 'N/A'}</Text>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>ATENDIDO POR:</Text>
                <Text style={styles.metaValue}>{comprobante.admin?.username?.toUpperCase() || 'ADMIN'}</Text>
            </View>
        </View>

        <View style={styles.divider} />

        {/* Resumen Financiero */}
        <View style={styles.itemRow}>
            <Text style={styles.itemName}>TOTAL VENDIDO EN RUTA</Text>
            <Text style={styles.itemTotal}>{formatCurrency(comprobante.total_vendido ?? 0)}</Text>
        </View>
        <View style={styles.itemRow}>
            <Text style={styles.itemName}>COMISIÓN VENDEDOR ($6.5)</Text>
            <Text style={[styles.itemTotal, { color: Colors.success }]}>- {formatCurrency(comprobante.comision_vendedor ?? 0)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.moneyContainer}>
            <View style={styles.moneyRow}>
                <Text style={styles.moneyLabel}>EFECTIVO ENTREGADO</Text>
                <Text style={styles.moneyValue}>{formatCurrency(comprobante.monto_entregado ?? 0)}</Text>
            </View>
            
            <View style={[
                styles.saldoBadge, 
                { backgroundColor: Colors.warning }
            ]}>
                <Text style={styles.saldoLabel}>{isPendiente ? 'SALDO PENDIENTE' : 'CUENTA LIQUIDADA'}</Text>
                <Text style={styles.saldoValue}>
                    {formatCurrency(comprobante.saldo_pendiente ?? 0)}
                </Text>
            </View>
        </View>

        {comprobante.notas && (
            <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>NOTAS:</Text>
                <Text style={styles.notesText}>{comprobante.notas}</Text>
            </View>
        )}

        <View style={styles.footer}>
            <Text style={styles.footerTagline}>SISTEMA DE GESTIÓN CONVEME</Text>
            <Text style={styles.footerNote}>Este documento es un comprobante digital de la transacción realizada.</Text>
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
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  header: {
    backgroundColor: Colors.warning, // AMARILLO
    padding: Spacing.md,
    borderBottomWidth: 3,
    borderColor: Colors.dark,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mascota: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: Colors.dark,
    backgroundColor: '#FFF',
  },
  headerRight: {
    flex: 1,
    marginLeft: 12,
  },
  ticketType: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: 1,
  },
  logoMarca: {
    width: 90,
    height: 25,
    marginTop: 2,
  },
  body: {
    padding: Spacing.md,
    backgroundColor: '#FFF',
  },
  infoSection: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 2,
  },
  metaLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.4)',
  },
  metaValue: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.dark,
  },
  divider: {
    height: 2,
    backgroundColor: Colors.dark,
    marginVertical: 15,
    borderStyle: 'dashed',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.6)',
  },
  itemTotal: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.dark,
  },
  moneyContainer: {
    marginTop: 5,
  },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  moneyLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.dark,
  },
  moneyValue: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.dark,
  },
  saldoBadge: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.dark,
    alignItems: 'center',
  },
  saldoLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
    marginBottom: 4,
  },
  saldoValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
  },
  notesBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  notesTitle: {
    fontSize: 7,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.4)',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark,
    lineHeight: 14,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerTagline: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.dark,
  },
  footerNote: {
    fontSize: 6,
    color: 'rgba(0,0,0,0.3)',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});
