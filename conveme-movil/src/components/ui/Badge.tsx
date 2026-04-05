import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'small' | 'medium';
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.primaryLight, text: Colors.primary },
  success: { bg: '#E8F5E9', text: Colors.success },
  warning: { bg: '#FFF3E0', text: Colors.warning },
  danger: { bg: '#FFEBEE', text: Colors.danger },
  info: { bg: '#E3F2FD', text: Colors.info },
  secondary: { bg: Colors.surface, text: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', size = 'medium' }) => {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, size === 'small' && styles.small]}>
      <Text style={[styles.text, { color: colors.text }, size === 'small' && styles.smallText]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { ...Typography.caption, fontWeight: '600' },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
  smallText: { fontSize: 10 },
});
