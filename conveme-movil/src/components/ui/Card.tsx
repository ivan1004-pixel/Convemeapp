import React from 'react';
import { View, StyleSheet, Pressable, ViewProps } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Spacing } from '@/src/theme/spacing';
import { Shadows } from '@/src/theme/shadows';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  style?: object;
}

export const Card: React.FC<CardProps> = ({ children, onPress, padding, style, ...rest }) => {
  const content = (
    <View style={[styles.card, padding !== undefined && { padding }, style]} {...rest}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }
  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.cardPadding,
    ...(Shadows.medium ?? {}),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: { opacity: 0.9 },
});
