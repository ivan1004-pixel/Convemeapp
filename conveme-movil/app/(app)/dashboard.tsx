import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Card } from '@/src/components/ui/Card';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { analytics } from '@/src/utils/analytics';

interface StatCardProps {
  emoji: string;
  value: string;
  label: string;
  color?: string;
  href?: string;
}

const StatCard: React.FC<StatCardProps> = ({ emoji, value, label, color, href }) => {
  const content = (
    <Card style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
  if (href) {
    return (
      <Link href={href as any} asChild>
        <Pressable style={styles.statWrapper}>{content}</Pressable>
      </Link>
    );
  }
  return <View style={styles.statWrapper}>{content}</View>;
};

interface QuickLinkProps {
  emoji: string;
  title: string;
  href: string;
}

const QuickLink: React.FC<QuickLinkProps> = ({ emoji, title, href }) => (
  <Link href={href as any} asChild>
    <Pressable style={styles.quickLink}>
      <Text style={styles.quickLinkEmoji}>{emoji}</Text>
      <Text style={styles.quickLinkText}>{title}</Text>
    </Pressable>
  </Link>
);

export default function DashboardScreen() {
  const usuario = useAuthStore((s) => s.usuario);
  const { isAdmin } = usePermissions();

  useEffect(() => {
    analytics.logScreenView('Dashboard');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola,</Text>
            <Text style={styles.name}>
              {usuario?.nombre_completo ?? usuario?.username ?? 'Usuario'} 👋
            </Text>
          </View>
          <View style={[styles.roleBadge, isAdmin && styles.adminBadge]}>
            <Text style={styles.roleText}>{isAdmin ? '👑 ADMIN' : '🧑‍💼 VENDEDOR'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.statsGrid}>
          <StatCard emoji="💰" value="$0" label="Ventas hoy" color={Colors.success} href="/(app)/ventas" />
          <StatCard emoji="📦" value="0" label="Pedidos" href="/(app)/pedidos" />
          {isAdmin && <StatCard emoji="👥" value="0" label="Clientes" href="/(app)/clientes" />}
          {isAdmin && <StatCard emoji="🛍️" value="0" label="Productos" href="/(app)/productos" />}
        </View>

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.quickLinks}>
          <QuickLink emoji="➕" title="Nueva Venta" href="/(app)/ventas/create" />
          <QuickLink emoji="📋" title="Nuevo Pedido" href="/(app)/pedidos/create" />
          {isAdmin && <QuickLink emoji="👤" title="Nuevo Cliente" href="/(app)/clientes/create" />}
          {isAdmin && <QuickLink emoji="📊" title="Reportes" href="/(app)/reportes" />}
        </View>

        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        <Card>
          <Text style={styles.emptyActivity}>Sin actividad reciente</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: Spacing.screenPadding, paddingBottom: 32 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: { ...Typography.body, color: Colors.textSecondary },
  name: { ...Typography.h2, color: Colors.text },
  roleBadge: {
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  adminBadge: { backgroundColor: '#FFF3E0' },
  roleText: { ...Typography.caption, fontWeight: '700', color: Colors.primary },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statWrapper: { width: '47%' },
  statCard: { alignItems: 'center', padding: Spacing.md },
  statEmoji: { fontSize: 28, marginBottom: 4 },
  statValue: { ...Typography.stat, color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickLink: {
    width: '47%', backgroundColor: Colors.background, borderRadius: 12,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  quickLinkEmoji: { fontSize: 28, marginBottom: 6 },
  quickLinkText: { ...Typography.label, color: Colors.text, textAlign: 'center' },
  emptyActivity: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', padding: Spacing.md },
});
