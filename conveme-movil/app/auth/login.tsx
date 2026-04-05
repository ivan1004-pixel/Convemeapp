import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/hooks/useAuth';
import { useForm } from '@/src/hooks/useForm';
import { validators } from '@/src/utils/validators';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const { values, errors, setValue, setFieldTouched, validate } = useForm(
    { username: '', password_raw: '' },
    {
      username: validators.username,
      password_raw: validators.password,
    }
  );

  const handleLogin = async () => {
    setServerError(null);
    if (!validate()) return;
    try {
      await login(values.username, values.password_raw);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>ConVeMe</Text>
            <Text style={styles.subtitle}>Sistema de Ventas Profesional</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>

            {serverError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>⚠️ {serverError}</Text>
              </View>
            )}

            <Input
              label="Usuario"
              value={values.username}
              onChangeText={(v) => setValue('username', v)}
              onBlur={() => setFieldTouched('username')}
              error={errors.username}
              placeholder="Tu nombre de usuario"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
            />

            <Input
              label="Contraseña"
              value={values.password_raw}
              onChangeText={(v) => setValue('password_raw', v)}
              onBlur={() => setFieldTouched('password_raw')}
              error={errors.password_raw}
              placeholder="Tu contraseña"
              secureTextEntry
              autoComplete="password"
            />

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginBtn}
            />
          </View>

          <Text style={styles.footer}>ConVeMe © 2025</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.screenPadding },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logo: {
    ...Typography.display,
    color: Colors.primary,
    fontSize: 52,
  },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  form: {
    backgroundColor: Colors.background, borderRadius: 16,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  formTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.lg },
  errorBox: {
    backgroundColor: '#FFEBEE', borderRadius: 8, padding: Spacing.md,
    marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.danger,
  },
  errorBoxText: { ...Typography.body, color: Colors.danger },
  loginBtn: { marginTop: Spacing.md },
  footer: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
});
