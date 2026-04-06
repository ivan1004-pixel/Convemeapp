import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Carousel } from '../../src/components/Carousel';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing, BorderRadius } from '../../src/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARRUSEL_ITEMS = [
  { id: '1', source: require('../../assets/images/carrusel/foto1.jpg') },
  { id: '2', source: require('../../assets/images/carrusel/foto2.png') },
  { id: '3', source: require('../../assets/images/carrusel/foto3.jpg') },
  { id: '4', source: require('../../assets/images/carrusel/foto4.jpg') },
  { id: '5', source: require('../../assets/images/carrusel/foto5.jpg') },
];

export default function SplashScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        {/* Header con título */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderDot} />
          <Text style={styles.topHeaderText}>SISTEMA DE GESTIÓN</Text>
          <View style={styles.topHeaderDot} />
        </View>
      </SafeAreaView>

      {/* Carrusel de fondo */}
      <View style={styles.carouselContainer}>
        <Carousel items={CARRUSEL_ITEMS} height={280} autoPlay interval={4000} />
      </View>

      {/* Contenido con fondo beige neobrutalista */}
      <View style={styles.contentContainer}>
        <LinearGradient 
          colors={[Colors.beige, Colors.beigeDark]} 
          start={{x:0,y:0}} end={{x:0,y:1}} 
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl }]} 
        />
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          {/* Logo + Mascota */}
          <View style={styles.brandRow}>
            <View style={styles.mascotaWrap}>
              <Image
                source={require('../../assets/images/mascota.png')}
                style={styles.mascota}
                contentFit="cover"
              />
            </View>
            <View style={styles.brandText}>
              <Image
                source={require('../../assets/images/logon.png')}
                style={{ width: 180, height: 60 }}
                contentFit="contain"
              />
              <Text style={styles.tagline}>Bienvenido a ConVeMe</Text>
              <Text style={styles.subTagline}>Nomancherito</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="login" size={24} color={Colors.light} />
              <Text style={styles.btnPrimaryText}>INICIAR SESIÓN</Text>
            </TouchableOpacity>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <MaterialCommunityIcons name="shield-check" size={18} color={Colors.success} />
                </View>
                <Text style={styles.featureText}>Seguro</Text>
              </View>
              <View style={styles.featureDivider} />
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <MaterialCommunityIcons name="lightning-bolt" size={18} color={Colors.warning} />
                </View>
                <Text style={styles.featureText}>Rápido</Text>
              </View>
              <View style={styles.featureDivider} />
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.featureText}>Confiable</Text>
              </View>
            </View>

            <View style={styles.footerNote}>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v1.0</Text>
              </View>
              <Text style={styles.footerNoteText}>ConveMe - Sistema de Gestión de Ventas</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  safeTop: {
    backgroundColor: Colors.beige,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  topHeaderText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 2,
  },
  topHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.dark,
  },
  carouselContainer: {
    paddingBottom: Spacing.md,
  },
  contentContainer: {
    flex: 1,
    borderTopWidth: 4,
    borderColor: Colors.dark,
    marginTop: Spacing.md,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingTop: Spacing.xl,
  },
  safeArea: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  mascotaWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.dark,
    backgroundColor: Colors.pink,
  },
  mascota: {
    width: 80,
    height: 80,
  },
  brandText: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -5,
  },
  subTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(26,26,26,0.6)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  buttons: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  btnPrimary: {
    backgroundColor: Colors.blue,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 3,
    borderColor: Colors.dark,
    // Neobrutalist shadow
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  btnPrimaryText: {
    ...Typography.button,
    color: Colors.light,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footerNote: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  versionBadge: {
    backgroundColor: Colors.pink,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
  },
  footerNoteText: {
    ...Typography.caption,
    color: 'rgba(26,26,26,0.5)',
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 3,
    borderColor: Colors.dark,
    marginTop: Spacing.lg,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  featureItem: {
    alignItems: 'center',
    gap: 4,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.beige,
    borderWidth: 2,
    borderColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark,
  },
  featureDivider: {
    width: 2,
    height: 30,
    backgroundColor: 'rgba(26,26,26,0.1)',
  },
});
