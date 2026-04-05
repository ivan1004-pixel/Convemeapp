import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { Shadows } from '@/src/theme/shadows';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: object;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'medium',
  disabled, loading, icon, fullWidth, style,
}) => {
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    ...(Shadows.small ? [Shadows.small] : []),
    style,
  ];

  const textColor = variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [...containerStyle, pressed && !disabled && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[Typography.button, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { marginRight: 8 },
  // Variants
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.secondary },
  outline: { backgroundColor: Colors.transparent, borderWidth: 1.5, borderColor: Colors.primary },
  danger: { backgroundColor: Colors.danger },
  ghost: { backgroundColor: Colors.transparent },
  // Sizes
  small: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 6 },
  medium: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2 },
  large: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  // States
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  fullWidth: { width: '100%' },
});
