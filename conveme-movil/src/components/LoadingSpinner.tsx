import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, spacing, textStyles } from '../theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  label?: string;
  overlay?: boolean;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = colors.brand.blue,
  label,
  overlay = false,
  style,
}) => {
  if (overlay) {
    return (
      <View style={[styles.overlay, style]}>
        <View style={styles.overlayContent}>
          <ActivityIndicator size={size} color={color} />
          {label && <Text style={styles.label}>{label}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  label: {
    ...textStyles.caption,
    color: colors.gray[500],
    marginTop: spacing[2],
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlayContent: {
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[6],
    borderRadius: 16,
  },
});
