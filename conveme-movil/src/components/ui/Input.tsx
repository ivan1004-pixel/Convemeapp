import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, TextInputProps } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  containerStyle?: object;
}

export const Input: React.FC<InputProps> = ({
  label, error, hint, leftIcon, rightIcon, disabled, containerStyle,
  secureTextEntry, ...rest
}) => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError, disabled && styles.inputDisabled]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeft : undefined,
            (rightIcon || isPassword) ? styles.inputWithRight : undefined,
          ]}
          placeholderTextColor={Colors.textSecondary}
          editable={!disabled}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...rest}
        />
        {isPassword && (
          <Pressable onPress={() => setPasswordVisible(!isPasswordVisible)} style={styles.rightIcon}>
            <Text style={styles.eyeIcon}>{isPasswordVisible ? '👁' : '👁‍🗨'}</Text>
          </Pressable>
        )}
        {rightIcon && !isPassword && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { ...Typography.label, color: Colors.text, marginBottom: Spacing.xs },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    backgroundColor: Colors.surface, overflow: 'hidden',
  },
  input: {
    flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    ...Typography.body, color: Colors.text,
  },
  inputWithLeft: { paddingLeft: Spacing.xs },
  inputWithRight: { paddingRight: Spacing.xs },
  leftIcon: { paddingLeft: Spacing.md, paddingRight: Spacing.xs },
  rightIcon: { paddingRight: Spacing.md, paddingLeft: Spacing.xs },
  eyeIcon: { fontSize: 18 },
  inputError: { borderColor: Colors.danger },
  inputDisabled: { opacity: 0.6, backgroundColor: Colors.border },
  errorText: { ...Typography.caption, color: Colors.danger, marginTop: 4 },
  hintText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
});
