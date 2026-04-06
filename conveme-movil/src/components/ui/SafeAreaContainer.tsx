import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

interface SafeAreaContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
}

export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  style,
  padding = false,
}) => {
  return (
    <View style={styles.safe}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[Colors.beige, Colors.beigeDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View
          style={[
            styles.container,
            padding && styles.withPadding,
            style,
          ]}
        >
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  withPadding: {
    padding: Spacing.md,
  },
});
