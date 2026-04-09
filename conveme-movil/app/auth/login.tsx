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
import { useAuth } from '../../src/hooks/useAuth';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing, BorderRadius } from '../../src/theme/spacing';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const handleLogin = async () => {
    setError(null);
    if (!username.trim() || !password.trim()) {
      showToast('Por favor ingresa usuario y contraseña.', 'warning');
      return;
    }
    try {
      await login(username.trim(), password);
      showToast('¡Bienvenido de nuevo!', 'success');
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('timeout') ||
        msg.toLowerCase().includes('connection')
      ) {
        setError('Error de conexión. Verifica tu internet.');
      } else {
        setError('Usuario o contraseña incorrectos.');
      }
    }
  };

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
          <TouchableOpacity style={styles.backIcon} onPress={() => router.back()} accessibilityLabel="Volver">
            <View style={styles.backIconCircle}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </View>
          </TouchableOpacity>

          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.mascotaWrapper}>
              <Image
                source={require('../../assets/images/masconve.png')}
                style={styles.mascota}
                contentFit="contain"
                accessibilityLabel="Logo de ConVeMe"
              />
            </View>
            <Text style={styles.appName}>ConVeMe</Text>
            <Text style={styles.appSubtitle}>Panel de Gestión</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Inicia Sesión</Text>
            
            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="USUARIO"
              placeholder="Tu nombre de usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={
                <MaterialCommunityIcons name="account" size={22} color={Colors.dark} />
              }
            />

            <Input
              label="CONTRASEÑA"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleLogin}
              leftIcon={
                <MaterialCommunityIcons name="lock" size={22} color={Colors.dark} />
              }
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} accessibilityLabel="Mostrar contraseña">
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color={Colors.dark}
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
              onPress={() => showToast('Contacta a soporte técnico.', 'info')}
            >
              <Text style={styles.helpLinkText}>¿Olvidaste tu contraseña?</Text>
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
  fullScreen: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
  },
  backIcon: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.xl,
    zIndex: 10,
  },
  backIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    marginBottom: Spacing.xl,
  },
  mascotaWrapper: {
    width: 120,
    height: 120,
    backgroundColor: Colors.primaryLight,
    borderWidth: 3,
    borderColor: Colors.dark,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  mascota: { width: 150, height: 150 },
  appName: {
    ...Typography.h1,
    color: Colors.dark,
    textAlign: 'center',
  },
  appSubtitle: {
    ...Typography.bodySmall,
    color: Colors.dark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  cardTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.error,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontWeight: '700',
    flex: 1,
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  helpLink: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
  },
  helpLinkText: {
    ...Typography.caption,
    fontWeight: '800',
    textDecorationLine: 'underline',
    color: Colors.dark,
  },
});
