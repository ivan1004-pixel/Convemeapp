import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  style,
  onPress,
  noPadding = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const cardContent = (
    <>
      {(title || subtitle) && (
        <View style={noPadding ? styles.headerWithPadding : styles.header}>
          {title && (
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
          )}
        </View>
      )}
      <View style={noPadding ? undefined : styles.body}>{children}</View>
    </>
  );

  const cardStyle = [
    styles.card,
    { backgroundColor: theme.card, borderColor: theme.border },
    Shadows.md,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
      >
        {cardContent}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerWithPadding: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  body: {
    padding: Spacing.md,
  },
  title: {
    ...Typography.h4,
    marginBottom: Spacing.xs / 2,
  },
  subtitle: {
    ...Typography.bodySmall,
  },
  pressed: {
    opacity: 0.85,
  },
});
