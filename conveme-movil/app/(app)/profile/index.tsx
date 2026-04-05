import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/hooks/useAuth';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Divider } from '@/src/components/ui/Divider';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';

export default function ProfileScreen() {
  const { usuario, logout } = useAuth();
  const { isAdmin, role } = usePermissions();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Mi Perfil</Text>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(usuario?.nombre_completo ?? usuario?.username ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{usuario?.nombre_completo ?? usuario?.username}</Text>
          <View style={[styles.roleBadge, isAdmin && styles.adminBadge]}>
            <Text style={styles.roleText}>{isAdmin ? '👑 ADMIN' : '🧑‍💼 VENDEDOR'}</Text>
          </View>
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Usuario</Text>
            <Text style={styles.infoValue}>{usuario?.username}</Text>
          </View>
          <Divider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={styles.infoValue}>{role}</Text>
          </View>
          {usuario?.email && (
            <>
              <Divider />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{usuario.email}</Text>
              </View>
            </>
          )}
        </Card>

        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: Spacing.screenPadding, paddingBottom: 40 },
  pageTitle: { ...Typography.h1, color: Colors.text, marginBottom: Spacing.lg },
  avatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { ...Typography.h1, color: Colors.white, fontSize: 36 },
  userName: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.sm },
  roleBadge: {
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  adminBadge: { backgroundColor: '#FFF3E0' },
  roleText: { ...Typography.caption, fontWeight: '700', color: Colors.primary },
  section: { marginBottom: Spacing.md },
  sectionTitle: {
    ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.md,
    textTransform: 'uppercase', fontSize: 11,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { ...Typography.body, color: Colors.textSecondary },
  infoValue: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  logoutBtn: { marginTop: Spacing.md },
});
