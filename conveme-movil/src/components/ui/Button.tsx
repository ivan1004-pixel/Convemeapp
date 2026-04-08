import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
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
import { useColorScheme } from '../../hooks/use-color-scheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const pressed = useSharedValue(0);

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; indicator: string } => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: Colors.primaryLight, borderWidth: 3, borderColor: Colors.dark },
          text: { color: Colors.dark },
          indicator: Colors.dark,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 3,
            borderColor: Colors.dark,
          },
          text: { color: Colors.dark },
          indicator: Colors.dark,
        };
      case 'danger':
        return {
          container: { backgroundColor: Colors.error, borderWidth: 3, borderColor: Colors.dark },
          text: { color: '#ffffff' },
          indicator: '#ffffff',
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 0 },
          text: { color: Colors.primary },
          indicator: Colors.primary,
        };
      case 'primary':
      default:
        return {
          container: { backgroundColor: Colors.primary, borderWidth: 3, borderColor: Colors.dark },
          text: { color: '#ffffff' },
          indicator: '#ffffff',
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: Spacing.xs,
            paddingHorizontal: Spacing.md,
            borderRadius: BorderRadius.md,
          },
          text: { ...Typography.buttonSmall },
        };
      case 'lg':
        return {
          container: {
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.xl,
            borderRadius: BorderRadius.lg,
            minHeight: 56, // Accessible touch target
          },
          text: { ...Typography.button, fontSize: 18 },
        };
      case 'md':
      default:
        return {
          container: {
            paddingVertical: Spacing.sm + 2,
            paddingHorizontal: Spacing.lg,
            borderRadius: BorderRadius.lg,
            minHeight: 48, // Minimum touch target
          },
          text: { ...Typography.button },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withSpring(pressed.value * 2) },
        { translateY: withSpring(pressed.value * 2) },
      ],
      shadowOffset: {
        width: withSpring(interpolate(pressed.value, [0, 1], [4, 0])),
        height: withSpring(interpolate(pressed.value, [0, 1], [4, 0])),
      },
    };
  });

  const shadowStyle: ViewStyle = variant !== 'ghost' ? {
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  } : {};

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (pressed.value = 1)}
      onPressOut={() => (pressed.value = 0)}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        shadowStyle,
        animatedStyle,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variantStyles.indicator}
            style={styles.indicator}
          />
        ) : (
          leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>
        )}
        <Text style={[styles.baseText, variantStyles.text, sizeStyles.text]}>{title}</Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    textAlign: 'center',
    fontWeight: '900', // Bold neobrutalist text
  },
  leftIcon: {
    marginRight: Spacing.xs,
  },
  indicator: {
    marginRight: Spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
