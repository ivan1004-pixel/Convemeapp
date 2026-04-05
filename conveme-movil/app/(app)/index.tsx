import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Spacing, BorderRadius } from '../../src/theme/spacing';
import { Shadows } from '../../src/theme/shadows';
import { useColorScheme } from '../../src/hooks/use-color-scheme';

function StatCard({ emoji, label, value, color }: {
  emoji: string;
  label: string;
  value: string;
  color: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <View style={[styles.statCard, { backgroundColor: theme.card }, Shadows.md]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

function ActionButton({ emoji, label, onPress }: {
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.sm]}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardScreen() {
  const { usuario, logout } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const greeting = getGreeting();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.logoText}>ConVeMe</Text>
            <Text style={[styles.greeting, { color: theme.muted }]}>
              {greeting}, {usuario?.username ?? 'Usuario'} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={logout}
            style={[styles.logoutBtn, { backgroundColor: Colors.primaryLight }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.logoutText, { color: Colors.primary }]}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Resumen</Text>
        <View style={styles.statsGrid}>
          <StatCard emoji="💰" label="Ventas" value="—" color={Colors.success} />
          <StatCard emoji="📦" label="Pedidos" value="—" color={Colors.warning} />
          <StatCard emoji="🛍️" label="Productos" value="—" color={Colors.primary} />
          <StatCard emoji="👥" label="Clientes" value="—" color={Colors.secondary} />
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Acciones rápidas</Text>
        <View style={styles.actionsGrid}>
          <ActionButton
            emoji="💰"
            label="Nueva venta"
            onPress={() => router.push('/(app)/ventas')}
          />
          <ActionButton
            emoji="📦"
            label="Ver pedidos"
            onPress={() => router.push('/(app)/pedidos')}
          />
          <ActionButton
            emoji="🛍️"
            label="Productos"
            onPress={() => router.push('/(app)/productos')}
          />
          <ActionButton
            emoji="👥"
            label="Clientes"
            onPress={() => router.push('/(app)/clientes')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  logoText: {
    fontFamily: 'Galada',
    fontSize: 36,
    color: Colors.primary,
  },
  greeting: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  logoutText: {
    ...Typography.label,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.h3,
  },
  statLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '44%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    ...Typography.label,
    textAlign: 'center',
  },
});
