import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAuthStore } from '../../../src/store/authStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { getInitials } from '../../../src/utils/formatters';

export default function PerfilScreen() {
  const { logout } = useAuth();
  const { usuario } = useAuthStore();

  const username = usuario?.username ?? 'Usuario';
  const rolId = usuario?.rol_id ?? 0;
  const rolLabel = rolId === 1 ? 'Administrador' : rolId === 2 ? 'Vendedor' : `Rol ${rolId}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Mi Perfil</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(username)}</Text>
          </View>
          <Text style={styles.username}>{username}</Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolBadgeText}>{rolLabel}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de Cuenta</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Usuario</Text>
            <Text style={styles.infoValue}>#{usuario?.id_usuario ?? '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{username}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={styles.infoValue}>{rolLabel}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado</Text>
            <View style={styles.activeRow}>
              <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.infoValueGreen}>Activo</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.beige 
  },
  scroll: { 
    padding: Spacing.lg, 
    paddingBottom: Spacing.xxl 
  },
  header: { 
    marginBottom: Spacing.xl,
    alignItems: 'center'
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { 
    ...Typography.h3, 
    fontWeight: '900', 
    color: Colors.dark,
    letterSpacing: 1
  },
  avatarSection: { 
    alignItems: 'center', 
    marginBottom: Spacing.xl 
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 4,
    borderColor: Colors.dark,
    // Shadow neobrutalista
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  avatarText: { 
    ...Typography.h2, 
    color: '#fff', 
    fontWeight: '900'
  },
  username: { 
    ...Typography.h3, 
    fontWeight: '900', 
    color: Colors.dark, 
    marginBottom: Spacing.xs,
    letterSpacing: 0.5
  },
  rolBadge: {
    backgroundColor: Colors.pink,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  rolBadgeText: { 
    ...Typography.caption, 
    color: Colors.dark, 
    fontWeight: '900',
    letterSpacing: 1
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    borderColor: Colors.dark,
    backgroundColor: '#F9F4EE',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    // Shadow neobrutalista
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  cardTitle: { 
    ...Typography.h4, 
    fontWeight: '900', 
    color: Colors.dark, 
    marginBottom: Spacing.lg,
    letterSpacing: 1
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: Spacing.md 
  },
  infoLabel: { 
    ...Typography.body, 
    color: Colors.dark,
    opacity: 0.6,
    fontWeight: '700'
  },
  infoValue: { 
    ...Typography.body, 
    fontWeight: '900', 
    color: Colors.dark 
  },
  infoValueGreen: { 
    ...Typography.body, 
    fontWeight: '900', 
    color: Colors.success 
  },
  activeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  divider: { 
    height: 2, 
    backgroundColor: Colors.dark,
    opacity: 0.1
  },
  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 3,
    borderColor: Colors.dark,
    // Shadow neobrutalista
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  logoutText: { 
    ...Typography.button, 
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 1
  },
});
