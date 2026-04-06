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
import { router } from 'expo-router';
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
      <View style={styles.fullScreen}>
        <LinearGradient colors={[Colors.beige, Colors.beigeDark]} start={{x:0,y:0}} end={{x:0,y:1}} style={StyleSheet.absoluteFill} />
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
      <View style={styles.fullScreen}>
        <LinearGradient colors={[Colors.beige, Colors.beigeDark]} start={{x:0,y:0}} end={{x:0,y:1}} style={StyleSheet.absoluteFill} />
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
    <View style={styles.fullScreen}>
      <LinearGradient colors={[Colors.beige, Colors.beigeDark]} start={{x:0,y:0}} end={{x:0,y:1}} style={StyleSheet.absoluteFill} />
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
          {/* Back Button */}
          <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
            <View style={styles.backIconCircle}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </View>
          </TouchableOpacity>

          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.mascotaWrapper}>
              <View style={styles.mascotaGlow} />
              <Image
                source={require('../../assets/images/masconve.png')}
                style={styles.mascota}
                contentFit="cover"
              />
            </View>
            <Text style={styles.appName}>Inicia Sesión</Text>
            <Text style={styles.appSubtitle}>ConVeMe</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-circle" size={32} color={Colors.primary} />
              <Text style={styles.cardSubtitle}>Ingresa tus credenciales</Text>
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
              title="ENTRAR"
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
              <MaterialCommunityIcons name="help-circle-outline" size={16} color="rgba(26,26,26,0.5)" />
              <Text style={styles.helpLinkText}>¿Problemas para acceder?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backIcon: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.lg,
    zIndex: 10,
  },
  backIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  brandHeader: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: 4,
  },
  mascotaWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  mascotaGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },
  mascota: {
    width: 115,
    height: 115,
    borderRadius: 57.5,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.dark,
    textAlign: 'center',
    letterSpacing: 0,
    marginTop: Spacing.xs,
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(26,26,26,0.4)',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    marginTop: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.dark,
  },
  cardHeader: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(26,26,26,0.5)',
    fontWeight: '600',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  inputField: {
    marginBottom: Spacing.sm,
  },
  loginButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: Colors.dark,
  },
  helpLink: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  helpLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(26,26,26,0.5)',
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
