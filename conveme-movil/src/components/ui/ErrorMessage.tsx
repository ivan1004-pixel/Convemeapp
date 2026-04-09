import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { CircularMascot } from './CircularMascot';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#450a0a' : '#FEE2E2', borderColor: isDark ? '#991B1B' : '#FECACA' },
        style,
      ]}
    >
      <CircularMascot isError size={60} style={styles.mascot} />
      <Text style={[styles.message, { color: isDark ? '#fecaca' : '#991B1B' }]}>{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  mascot: {
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.lg,
  },
  pressed: {
    opacity: 0.8,
  },
  retryText: {
    ...Typography.buttonSmall,
    color: '#ffffff',
  },
});
