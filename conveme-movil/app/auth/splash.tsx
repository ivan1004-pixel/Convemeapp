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
      {/* Carrusel de fondo */}
      <Carousel items={CARRUSEL_ITEMS} height={SCREEN_WIDTH * 1.0} autoPlay interval={4000} />

      {/* Contenido con fondo beige neobrutalista */}
      <View style={styles.contentContainer}>
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
              <Text style={styles.tagline}>Bienvenido Nomancherito</Text>
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

            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>ConveMe v1.0 • Sistema de Gestión de Ventas</Text>
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
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.beige,
    borderTopWidth: 4,
    borderColor: Colors.dark,
    marginTop: -20,
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
    ...Typography.caption,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -5,
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
    marginTop: Spacing.md,
  },
  footerNoteText: {
    ...Typography.caption,
    color: 'rgba(26,26,26,0.5)',
    fontWeight: '600',
  },
});
