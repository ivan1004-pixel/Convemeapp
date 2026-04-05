import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Toast, useToast } from '../../src/components/Toast';
import { Meme } from '../../src/components/Meme';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing, BorderRadius } from '../../src/theme/spacing';

type ScreenState = 'form' | 'network-error' | 'success';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('form');
  const { login, isLoading } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showToast('Por favor ingresa usuario y contraseña.', 'warning');
      return;
    }
    try {
      await login(username.trim(), password);
      setScreenState('success');
      showToast('Bienvenido a ConVeMe', 'success');
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('timeout') ||
        msg.toLowerCase().includes('econnrefused') ||
        msg.toLowerCase().includes('connection')
      ) {
        setScreenState('network-error');
      } else {
        showToast('Las credenciales no coinciden. Intenta de nuevo.', 'error');
      }
    }
  };

  if (screenState === 'network-error') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: Colors.beige }]}>
        <SafeAreaView style={styles.centered}>
          <Meme source={require('../../assets/images/memeerror.png')} size={180} />
          <Text style={[styles.errorTitle, { color: Colors.error }]}>Sin conexión</Text>
          <Text style={[styles.errorMsg, { color: '#6B7280' }]}>
            Error de conexión. Verifica tu internet.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: Colors.error }]}
            onPress={() => setScreenState('form')}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  if (screenState === 'success') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: Colors.beige }]}>
        <SafeAreaView style={styles.centered}>
          <Meme source={require('../../assets/images/memeok.png')} size={180} />
          <Text style={[styles.successTitle, { color: Colors.success }]}>Sesión Iniciada</Text>
          <Text style={[styles.successMsg, { color: '#6B7280' }]}>Bienvenido a ConVeMe</Text>
        </SafeAreaView>
        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.mascotaWrapper}>
              <Image
                source={require('../../assets/images/mascota.png')}
                style={styles.mascota}
                contentFit="contain"
              />
            </View>
            <Image
              source={require('../../assets/images/logon.png')}
              style={styles.logon}
              contentFit="contain"
            />
            <Text style={styles.appName}>ConVeMe</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Inicia Sesión</Text>
              <View style={styles.underline} />
            </View>

            <Input
              label="Usuario"
              placeholder="Ingresa tu usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.inputField}
              leftIcon={
                <MaterialCommunityIcons name="account-circle-outline" size={22} color={Colors.primary} />
              }
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleLogin}
              style={styles.inputField}
              leftIcon={
                <MaterialCommunityIcons name="lock-outline" size={22} color={Colors.primary} />
              }
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              }
            />

            <Button
              title="ENTRAR AL SISTEMA"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />

            <TouchableOpacity
              style={styles.helpLink}
              onPress={() => showToast('Contacta a tu administrador.', 'info')}
            >
              <Text style={styles.helpLinkText}>¿Problemas con tu acceso?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  brandHeader: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  mascotaWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden', // Asegura que la imagen no se salga de los bordes circulares
  },
  mascota: {
    width: 110,
    height: 110,
    borderRadius: 55, // Redondeamos también la imagen para evitar esquinas cuadradas
  },
  logon: {
    width: 160,
    height: 40,
    marginBottom: -10,
  },
  appName: {
    fontSize: 52, // Reducido de 62 a 52
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -1,
    textTransform: 'uppercase',
    // Sombras más pronunciadas para dar profundidad
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    marginTop: Spacing.sm,
  },
  cardHeader: {
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    ...Typography.h3,
    color: '#1A1A1A',
    fontWeight: '900',
    textAlign: 'center',
  },
  underline: {
    height: 4,
    width: 40,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 4,
  },
  inputField: {
    marginBottom: Spacing.md,
  },
  loginButton: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  helpLink: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  helpLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(26,26,26,0.4)',
    textDecorationLine: 'underline',
  },
  fullScreen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.h3,
    fontWeight: '900',
    marginTop: Spacing.sm,
  },
  errorMsg: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  retryText: {
    fontWeight: '800',
    color: '#FFFFFF',
    fontSize: 14,
  },
  successTitle: {
    ...Typography.h3,
    fontWeight: '900',
    marginTop: Spacing.sm,
  },
  successMsg: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
