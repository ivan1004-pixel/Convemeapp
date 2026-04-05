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

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; indicator: string } => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: Colors.primaryLight, borderWidth: 0 },
          text: { color: Colors.primary },
          indicator: Colors.primary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: Colors.primary,
          },
          text: { color: Colors.primary },
          indicator: Colors.primary,
        };
      case 'danger':
        return {
          container: { backgroundColor: Colors.error, borderWidth: 0 },
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
          container: { backgroundColor: Colors.primary, borderWidth: 0 },
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
          },
          text: { ...Typography.button },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
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
    </Pressable>
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
  pressed: {
    opacity: 0.8,
  },
});
