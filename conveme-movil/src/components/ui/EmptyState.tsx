import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭', title, message, actionText, onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionText && onAction && (
        <Button title={actionText} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  icon: { fontSize: 56, marginBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  message: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  action: { marginTop: Spacing.lg },
});
