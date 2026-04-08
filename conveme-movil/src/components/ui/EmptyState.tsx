import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Button } from './Button';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: IconName;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Sin resultados',
  message,
  icon = 'tray-remove',
  iconColor,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <Animated.View 
      entering={FadeInUp.duration(600).springify()}
      style={[styles.container, style]}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={icon}
          size={60}
          color={iconColor ?? Colors.primary}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Button
            title={actionLabel}
            onPress={onAction}
            style={styles.button}
            variant="primary"
          />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: Spacing.lg,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.dark,
    borderStyle: 'dashed',
  },
  iconContainer: {
    marginBottom: Spacing.lg,
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  title: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.dark,
    fontWeight: '900',
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
  },
  button: {
    minWidth: 180,
  },
});
