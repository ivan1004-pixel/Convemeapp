import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  withTiming
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...textInputProps
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const [isFocused, setIsFocused] = useState(false);
  
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const borderColor = error
    ? Colors.error
    : isFocused
    ? Colors.primary
    : Colors.dark;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(focusAnim.value, [0, 1], [0, 2]) },
        { translateY: interpolate(focusAnim.value, [0, 1], [0, 2]) },
      ],
      shadowOffset: {
        width: interpolate(focusAnim.value, [0, 1], [4, 2]),
        height: interpolate(focusAnim.value, [0, 1], [4, 2]),
      },
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: Colors.dark }]}>{label}</Text>
      )}
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: theme.surface,
            borderWidth: 3,
            shadowColor: Colors.dark,
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 4,
          },
          animatedStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            { color: theme.text },
            leftIcon ? styles.inputWithLeft : null,
            rightIcon ? styles.inputWithRight : null,
            style as TextStyle,
          ]}
          placeholderTextColor={theme.muted}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          {...textInputProps}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.muted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    fontWeight: '900', // Neobrutalist bold
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  inputWithLeft: {
    paddingLeft: Spacing.xs,
  },
  inputWithRight: {
    paddingRight: Spacing.xs,
  },
  leftIcon: {
    paddingLeft: Spacing.md,
    justifyContent: 'center',
  },
  rightIcon: {
    paddingRight: Spacing.md,
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontWeight: '700',
  },
  helperText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
