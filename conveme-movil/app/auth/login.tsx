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
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.fullScreen}
      >
        <SafeAreaView style={styles.centered}>
          <Meme source={require('../../assets/images/memeerror.png')} size={180} />
          <Text style={styles.errorTitle}>Sin conexión</Text>
          <Text style={styles.errorMsg}>
            Error de conexión. Verifica tu internet.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => setScreenState('form')}
          >
            <MaterialCommunityIcons name="refresh" size={20} color={Colors.textLight} />
            <Text style={styles.retryText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (screenState === 'success') {
    return (
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={styles.fullScreen}
      >
        <SafeAreaView style={styles.centered}>
          <Meme source={require('../../assets/images/memeok.png')} size={180} />
          <Text style={styles.successTitle}>Sesión Iniciada</Text>
          <Text style={styles.successMsg}>Bienvenido a ConVeMe</Text>
        </SafeAreaView>
        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Gradient Header */}
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="storefront" size={48} color="rgba(255,255,255,0.9)" />
            <Text style={styles.logo}>ConVeMe</Text>
            <Text style={styles.subtitle}>Sistema de Gestión</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>
            <Text style={styles.cardSubtitle}>
              Ingresa tus credenciales para continuar
            </Text>

            <Input
              label="Usuario"
              placeholder="Ingresa tu usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              leftIcon={
                <MaterialCommunityIcons name="account" size={20} color={Colors.primary} />
              }
            />

            <Input
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              leftIcon={
                <MaterialCommunityIcons name="lock" size={20} color={Colors.primary} />
              }
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              }
            />

            <Button
              title="INICIAR SESIÓN"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />

            <TouchableOpacity
              style={styles.helpLink}
              onPress={() => showToast('Contacta a tu administrador para recuperar acceso.', 'info')}
            >
              <Text style={styles.helpLinkText}>Problemas para acceder</Text>
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
    backgroundColor: Colors.light,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  logo: {
    fontFamily: 'Galada',
    fontSize: 52,
    color: Colors.textLight,
    letterSpacing: 1,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    marginTop: -BorderRadius.xxl,
    padding: Spacing.xl,
    paddingTop: Spacing.xl + Spacing.sm,
    backgroundColor: Colors.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    color: '#6B7280',
    marginBottom: Spacing.lg,
  },
  loginButton: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  helpLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  helpLinkText: {
    ...Typography.bodySmall,
    color: Colors.primary,
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
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },
  errorMsg: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  retryText: {
    ...Typography.button,
    color: Colors.textLight,
  },
  successTitle: {
    ...Typography.h3,
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },
  successMsg: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});
