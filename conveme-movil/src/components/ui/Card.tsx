import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from 'react-native-reanimated';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  
  const pressed = useSharedValue(0);

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

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withSpring(pressed.value * 2) },
        { translateY: withSpring(pressed.value * 2) },
      ],
      shadowOffset: {
        width: withSpring(interpolate(pressed.value, [0, 1], [6, 0])),
        height: withSpring(interpolate(pressed.value, [0, 1], [6, 0])),
      },
    };
  });

  const cardStyle = [
    styles.card,
    { backgroundColor: theme.card, borderColor: theme.border },
    {
      shadowColor: Colors.dark,
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 6,
    },
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => (pressed.value = 1)}
        onPressOut={() => (pressed.value = 0)}
        style={[
          ...cardStyle,
          animatedStyle,
        ]}
        accessibilityRole="button"
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 3, // Robust neobrutalist border
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
    fontWeight: '900', // Ultra bold
    marginBottom: Spacing.xs / 2,
  },
  subtitle: {
    ...Typography.bodySmall,
  },
});
