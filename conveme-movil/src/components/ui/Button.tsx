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
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; indicator: string } => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: Colors.primaryLight },
          text: { color: Colors.dark },
          indicator: Colors.dark,
        };
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.dark },
          text: { color: Colors.primary },
          indicator: Colors.primary,
        };
      case 'danger':
        return {
          container: { backgroundColor: Colors.error },
          text: { color: '#ffffff' },
          indicator: '#ffffff',
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: Colors.primary },
          indicator: Colors.primary,
        };
      case 'primary':
      default:
        return {
          container: { backgroundColor: Colors.primary },
          text: { color: '#ffffff' },
          indicator: '#ffffff',
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 16 },
          text: { ...Typography.buttonSmall },
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 32 },
          text: { ...Typography.button, fontSize: 16 },
        };
      case 'md':
      default:
        return {
          container: { paddingVertical: 12, paddingHorizontal: 24 },
          text: { ...Typography.button },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  return (
    <View style={[styles.shadowContainer, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.base,
          variantStyles.container,
          sizeStyles.container,
          { borderColor: Colors.dark, borderWidth: variant === 'outline' ? 2 : 2 },
          isDisabled && styles.disabled,
          pressed && !isDisabled ? styles.pressed : styles.unpressed,
        ]}
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
          <Text style={[styles.baseText, variantStyles.text, sizeStyles.text]}>
            {title.toUpperCase()}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    backgroundColor: Colors.dark,
    borderRadius: 12,
  },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  unpressed: {
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  pressed: {
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    textAlign: 'center',
    fontWeight: '900',
  },
  leftIcon: {
    marginRight: 8,
  },
  indicator: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
});
