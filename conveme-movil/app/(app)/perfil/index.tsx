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
  container: { flex: 1, backgroundColor: Colors.dark },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: { marginBottom: Spacing.lg },
  screenTitle: { ...Typography.h3, fontWeight: '700', color: Colors.textLight },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.lg },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { ...Typography.h2, color: '#fff', fontFamily: 'Galada' },
  username: { ...Typography.h3, fontFamily: 'Galada', fontWeight: '700', color: Colors.textLight, marginBottom: Spacing.xs },
  rolBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  rolBadgeText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cardTitle: { ...Typography.h4, fontWeight: '700', color: Colors.textLight, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  infoLabel: { ...Typography.body, color: 'rgba(255,255,255,0.5)' },
  infoValue: { ...Typography.body, fontWeight: '600', color: Colors.textLight },
  infoValueGreen: { ...Typography.body, fontWeight: '600', color: Colors.success },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  logoutText: { ...Typography.button, color: '#fff' },
});
