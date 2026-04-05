import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing, BorderRadius } from '../../src/theme/spacing';
import { useColorScheme } from '../../src/hooks/use-color-scheme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const handleLogin = () => login(username, password);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
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
            colors={['#0a7ea4', '#0891b2']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logo}>ConVeMe</Text>
            <Text style={styles.subtitle}>Sistema de Gestión</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: theme.background }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Iniciar Sesión</Text>
            <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
              Ingresa tus credenciales para continuar
            </Text>

            {error && (
              <ErrorMessage
                message={error}
                style={styles.errorMessage}
              />
            )}

            <Input
              label="Usuario"
              placeholder="Ingresa tu usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              leftIcon={<Text style={styles.icon}>👤</Text>}
            />

            <Input
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              leftIcon={<Text style={styles.icon}>🔒</Text>}
            />

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  header: {
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: 'Galada',
    fontSize: 52,
    color: '#ffffff',
    letterSpacing: 1,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    marginTop: -BorderRadius.xxl,
    padding: Spacing.xl,
    paddingTop: Spacing.xl + Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.bodySmall,
    marginBottom: Spacing.lg,
  },
  errorMessage: {
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 18,
  },
  loginButton: {
    marginTop: Spacing.sm,
    width: '100%',
  },
});
