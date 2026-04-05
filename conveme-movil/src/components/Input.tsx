import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing, textStyles } from '../theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'filled';
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  containerStyle,
  variant = 'default',
  ...textInputProps
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.brand.blue
      : colors.gray[300];

  const backgroundColor =
    variant === 'filled'
      ? focused
        ? colors.light.background
        : colors.gray[100]
      : colors.light.background;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          { borderColor, backgroundColor },
          disabled && styles.disabled,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...textInputProps}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.iconRight}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {!error && hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    ...textStyles.label,
    color: colors.gray[700],
    marginBottom: spacing[1.5],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    minHeight: 48,
  },
  input: {
    flex: 1,
    ...textStyles.body,
    color: colors.gray[900],
    paddingVertical: spacing[2.5],
  },
  inputDisabled: {
    color: colors.gray[400],
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: colors.gray[100],
  },
  error: {
    ...textStyles.caption,
    color: colors.error,
    marginTop: spacing[1],
  },
  hint: {
    ...textStyles.caption,
    color: colors.gray[500],
    marginTop: spacing[1],
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
});
