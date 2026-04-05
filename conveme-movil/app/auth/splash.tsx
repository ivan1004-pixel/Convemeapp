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
  const handleCrearUsuario = () => {
    Alert.alert(
      'Acceso Restringido',
      'Solo el administrador puede crear usuarios. Contacta a tu administrador.',
      [{ text: 'Entendido', style: 'default' }],
    );
  };

  return (
    <View style={styles.root}>
      {/* Carrusel de fondo */}
      <Carousel items={CARRUSEL_ITEMS} height={SCREEN_WIDTH * 0.65} autoPlay interval={3500} />

      {/* Gradient overlay + content */}
      <LinearGradient
        colors={['transparent', Colors.gradientStart, Colors.gradientEnd]}
        locations={[0, 0.35, 1]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          {/* Logo + Mascota */}
          <View style={styles.brandRow}>
            <View style={styles.mascotaWrap}>
              <Image
                source={require('../../assets/images/mascota.jpg')}
                style={styles.mascota}
                contentFit="cover"
              />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.appName}>ConVeMe</Text>
              <Text style={styles.tagline}>Gestión NoManches Mx</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="login" size={22} color={Colors.textLight} />
              <Text style={styles.btnPrimaryText}>INICIAR SESIÓN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={handleCrearUsuario}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="account-plus" size={22} color={Colors.primary} />
              <Text style={styles.btnSecondaryText}>CREAR USUARIO</Text>
            </TouchableOpacity>

            <View style={styles.adminNote}>
              <MaterialCommunityIcons name="shield-lock" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.adminNoteText}>Registro solo para administradores</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.gradientEnd,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  safeArea: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  mascotaWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  mascota: {
    width: 72,
    height: 72,
  },
  brandText: {
    flex: 1,
  },
  appName: {
    fontFamily: 'Galada',
    fontSize: 42,
    color: Colors.textLight,
    lineHeight: 46,
  },
  tagline: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttons: {
    gap: Spacing.sm,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPrimaryText: {
    ...Typography.button,
    color: Colors.textLight,
    letterSpacing: 1.5,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  btnSecondaryText: {
    ...Typography.button,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  adminNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  adminNoteText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
  },
});
