import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

type BadgeColor = 'primary' | 'success' | 'warning' | 'error' | 'secondary';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  text: string;
  color?: BadgeColor;
  size?: BadgeSize;
  style?: ViewStyle;
}

const colorMap: Record<BadgeColor, { background: string; text: string }> = {
  primary: { background: Colors.primaryLight, text: Colors.primary },
  success: { background: '#D1FAE5', text: '#065F46' },
  warning: { background: '#FEF3C7', text: '#92400E' },
  error: { background: '#FEE2E2', text: '#991B1B' },
  secondary: { background: '#F3F4F6', text: Colors.secondary },
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  color = 'primary',
  size = 'md',
  style,
}) => {
  const { background, text: textColor } = colorMap[color];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: background },
        size === 'sm' ? styles.sm : styles.md,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: textColor },
          size === 'sm' ? styles.textSm : styles.textMd,
        ]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  md: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    ...Typography.caption,
    fontWeight: '600',
  },
  textMd: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
