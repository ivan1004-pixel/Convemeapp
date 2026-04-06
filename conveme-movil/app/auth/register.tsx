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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Toast, useToast } from '../../src/components/Toast';
import { Meme } from '../../src/components/Meme';
import { createUserService } from '../../src/services/user.service';
import { LinearGradient } from 'expo-linear-gradient';
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
      await createUserService(username.trim(), password, Number(selectedRole));
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
      <View style={[styles.fullScreen, { backgroundColor: Colors.pink }]}>
        <SafeAreaView style={styles.centered}>
          <Meme source={require('../../assets/images/gato.gif')} size={200} />
          <Text style={[styles.successTitle, { color: Colors.dark }]}>¡LISTO!</Text>
          <View style={styles.successCard}>
            <Text style={styles.successMsg}>
              El usuario <Text style={{ fontWeight: '900', color: Colors.primary }}>{username}</Text> fue creado exitosamente.
            </Text>
          </View>
          <TouchableOpacity style={styles.backBtnSuccess} onPress={() => router.push('/(app)/mas')}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textLight} />
            <Text style={styles.backBtnText}>VOLVER AL MENÚ</Text>
          </TouchableOpacity>
        </SafeAreaView>
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
              <View style={styles.backIconCircle}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.gifContainer}>
              <Image 
                source={require('../../assets/images/gato.gif')} 
                style={styles.headerGif}
                contentFit="contain"
              />
            </View>
            
            <Text style={styles.headerTitle}>CREAR USUARIO</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ACCESO RESTRINGIDO</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Input
              label="NOMBRE DE USUARIO"
              placeholder="Ej: ivan_pixel"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              leftIcon={
                <MaterialCommunityIcons name="account-plus" size={20} color={Colors.primary} />
              }
              containerStyle={styles.inputContainer}
            />

            <Input
              label="CONTRASEÑA"
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
              containerStyle={styles.inputContainer}
            />

            {/* Role Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ROL DE ACCESO</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowRoleMenu(!showRoleMenu)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="shield-account" size={20} color={Colors.primary} />
                <Text style={styles.dropdownText}>{selectedRoleLabel.toUpperCase()}</Text>
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
                        color={selectedRole === role.value ? Colors.primary : Colors.dark}
                      />
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedRole === role.value && styles.dropdownItemTextActive,
                        ]}
                      >
                        {role.label.toUpperCase()}
                      </Text>
                      {selectedRole === role.value && (
                        <MaterialCommunityIcons name="check-bold" size={18} color={Colors.primary} />
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
              <MaterialCommunityIcons name="information" size={20} color={Colors.dark} />
              <Text style={styles.noteText}>
                EL NUEVO USUARIO DEBERÁ INICIAR SESIÓN PARA ACCEDER AL SISTEMA.
              </Text>
            </View>
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
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.beige,
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
    backgroundColor: Colors.light,
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
  gifContainer: {
    width: 120,
    height: 120,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.pink,
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    borderColor: Colors.dark,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  headerGif: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontFamily: 'Galada',
    fontSize: 38,
    color: Colors.dark,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  adminBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.dark,
    marginTop: Spacing.xs,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 1,
  },
  card: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    backgroundColor: Colors.light,
    borderRadius: BorderRadius.xxl,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    ...Typography.label,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: Spacing.xs,
    fontSize: 14,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light,
    gap: Spacing.sm,
  },
  dropdownText: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.dark,
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 2,
    borderColor: Colors.dark,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.light,
    overflow: 'hidden',
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItemActive: {
    backgroundColor: `${Colors.pink}44`,
  },
  dropdownItemText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.dark,
    flex: 1,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: '900',
  },
  createButton: {
    marginTop: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.dark,
    height: 60,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    backgroundColor: `${Colors.info}15`,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    borderStyle: 'dashed',
  },
  noteText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark,
    flex: 1,
    lineHeight: 16,
  },
  fullScreen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  successCard: {
    backgroundColor: Colors.light,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    borderColor: Colors.dark,
    width: '100%',
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  successTitle: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  successMsg: {
    ...Typography.h4,
    color: Colors.dark,
    textAlign: 'center',
    fontWeight: '700',
  },
  backBtnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.light,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backBtnText: {
    ...Typography.button,
    color: Colors.textLight,
    fontWeight: '900',
  },
});
