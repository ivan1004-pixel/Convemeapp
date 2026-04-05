import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 4,
}) => {
  return (
    <View
      style={[
        styles.base,
        variant === 'default' && styles.default,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'filled' && styles.filled,
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },
  default: {
    backgroundColor: colors.white,
    ...shadows.base,
  },
  elevated: {
    backgroundColor: colors.white,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filled: {
    backgroundColor: colors.gray[50],
  },
});
