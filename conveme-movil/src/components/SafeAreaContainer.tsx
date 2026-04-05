import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export interface SafeAreaContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  /** Whether to apply edges individually */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  style,
  backgroundColor = colors.light.background,
  edges = ['top', 'bottom', 'left', 'right'],
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }, style]} edges={edges}>
      <View style={[styles.container, { backgroundColor }]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
