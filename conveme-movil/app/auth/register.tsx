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
import { router } from 'expo-router';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Toast, useToast } from '../../src/components/Toast';
import { Meme } from '../../src/components/Meme';
import { createUserService } from '../../src/services/user.service';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing, BorderRadius } from '../../src/theme/spacing';

const ROLES = [
  { label: 'Administrador', value: 1 },
  { label: 'Vendedor', value: 2 },
];

type ScreenState = 'form' | 'success';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number>(2);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('form');
  const { toast, show: showToast, hide: hideToast } = useToast();

  const selectedRoleLabel = ROLES.find((r) => r.value === selectedRole)?.label ?? 'Vendedor';

  const handleCreate = async () => {
    if (!username.trim()) {
      showToast('El nombre de usuario es requerido.', 'warning');
      return;
    }
    if (!password.trim() || password.length < 4) {
      showToast('La contraseña debe tener al menos 4 caracteres.', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      await createUserService(username.trim(), password, selectedRole);
      setScreenState('success');
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.toLowerCase().includes('ya existe') || msg.toLowerCase().includes('duplicate')) {
        showToast('Ese nombre de usuario ya existe. Elige otro.', 'error');
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('connection')) {
        showToast('Error de conexión. Verifica tu internet.', 'error');
      } else {
        showToast('No se pudo crear el usuario. Intenta de nuevo.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (screenState === 'success') {
    return (
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.fullScreen}>
        <SafeAreaView style={styles.centered}>
          <Meme source={require('../../assets/images/memeok.png')} size={180} />
          <Text style={styles.successTitle}>Usuario Creado</Text>
          <Text style={styles.successMsg}>
            El usuario fue creado exitosamente.{'\n'}Debe iniciar sesión para acceder.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.textLight} />
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>
        </SafeAreaView>
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
          {/* Header */}
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.header}
          >
            <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textLight} />
            </TouchableOpacity>
            <MaterialCommunityIcons name="account-plus" size={44} color="rgba(255,255,255,0.9)" />
            <Text style={styles.headerTitle}>Crear Usuario</Text>
            <Text style={styles.headerSubtitle}>Solo administradores</Text>
          </LinearGradient>

          {/* Form */}
          <View style={styles.card}>
            <Input
              label="Nombre de Usuario"
              placeholder="Ej: vendedor01"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              leftIcon={
                <MaterialCommunityIcons name="account-plus" size={20} color={Colors.primary} />
              }
            />

            <Input
              label="Contraseña"
              placeholder="Mínimo 4 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
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

            {/* Role Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Rol de Acceso</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowRoleMenu(!showRoleMenu)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="shield-account" size={20} color={Colors.primary} />
                <Text style={styles.dropdownText}>{selectedRoleLabel}</Text>
                <MaterialCommunityIcons
                  name={showRoleMenu ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              {showRoleMenu && (
                <View style={styles.dropdownMenu}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      style={[
                        styles.dropdownItem,
                        selectedRole === role.value && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedRole(role.value);
                        setShowRoleMenu(false);
                      }}
                    >
                      <MaterialCommunityIcons
                        name={role.value === 1 ? 'crown' : 'account-tie'}
                        size={18}
                        color={selectedRole === role.value ? Colors.primary : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedRole === role.value && styles.dropdownItemTextActive,
                        ]}
                      >
                        {role.label}
                      </Text>
                      {selectedRole === role.value && (
                        <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Button
              title="CREAR USUARIO"
              onPress={handleCreate}
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              style={styles.createButton}
            />

            <View style={styles.note}>
              <MaterialCommunityIcons name="information" size={16} color={Colors.info} />
              <Text style={styles.noteText}>
                El nuevo usuario deberá iniciar sesión para acceder al sistema.
              </Text>
            </View>
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
    position: 'relative',
  },
  backIcon: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.md,
    padding: Spacing.sm,
  },
  headerTitle: {
    fontFamily: 'Galada',
    fontSize: 36,
    color: Colors.textLight,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    backgroundColor: Colors.light,
    gap: Spacing.sm,
  },
  dropdownText: {
    ...Typography.body,
    color: Colors.textDark,
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xs,
    backgroundColor: Colors.light,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemText: {
    ...Typography.body,
    color: Colors.textDark,
    flex: 1,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  createButton: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(0,217,217,0.08)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  noteText: {
    ...Typography.bodySmall,
    color: Colors.info,
    flex: 1,
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  backBtnText: {
    ...Typography.button,
    color: Colors.textLight,
  },
});
