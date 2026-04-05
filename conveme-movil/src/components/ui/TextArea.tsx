import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface TextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
  containerStyle?: ViewStyle;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  rows = 4,
  containerStyle,
  style,
  ...textInputProps
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : isFocused
    ? Colors.primary
    : theme.border;

  const lineHeight = (Typography.body.lineHeight ?? 24);
  const verticalPadding = (Spacing.sm + 2) * 2;
  const minHeight = rows * lineHeight + verticalPadding;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            borderColor,
            backgroundColor: theme.surface,
            color: theme.text,
            minHeight,
          },
          isFocused && styles.focused,
          style as TextStyle,
        ]}
        placeholderTextColor={theme.muted}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
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
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  focused: {
    borderWidth: 2,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
