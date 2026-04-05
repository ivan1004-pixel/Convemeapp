import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAuthStore } from '../../../src/store/authStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { getInitials } from '../../../src/utils/formatters';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';

export default function PerfilScreen() {
  const { logout } = useAuth();
  const { usuario } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const username = usuario?.username ?? 'Usuario';
  const rolId = usuario?.rol_id ?? 0;
  const rolLabel = rolId === 1 ? 'Administrador' : rolId === 2 ? 'Vendedor' : `Rol ${rolId}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Mi Perfil</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(username)}</Text>
          </View>
          <Text style={[styles.username, { color: theme.text }]}>{username}</Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolBadgeText}>{rolLabel}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Información de Cuenta</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>ID Usuario</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>#{usuario?.id_usuario ?? '-'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Username</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{username}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Rol</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{rolLabel}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Estado</Text>
            <Text style={[styles.infoValueGreen]}>Activo ✓</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: { marginBottom: Spacing.lg },
  screenTitle: { ...Typography.h3, fontWeight: '700' },
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
  username: { ...Typography.h3, fontFamily: 'Galada', fontWeight: '700', marginBottom: Spacing.xs },
  rolBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  rolBadgeText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cardTitle: { ...Typography.h4, fontWeight: '700', marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  infoLabel: { ...Typography.body },
  infoValue: { ...Typography.body, fontWeight: '600' },
  infoValueGreen: { ...Typography.body, fontWeight: '600', color: Colors.success },
  divider: { height: 1, marginVertical: 0 },
  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  logoutText: { ...Typography.button, color: '#fff' },
});
