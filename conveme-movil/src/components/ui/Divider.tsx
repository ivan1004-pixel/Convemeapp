import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';

interface DividerProps {
  label?: string;
  style?: object;
}

export const Divider: React.FC<DividerProps> = ({ label, style }) => {
  if (label) {
    return (
      <View style={[styles.labelContainer, style]}>
        <View style={styles.line} />
        <Text style={styles.label}>{label}</Text>
        <View style={styles.line} />
      </View>
    );
  }
  return <View style={[styles.divider, style]} />;
};

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  label: { ...Typography.caption, color: Colors.textSecondary, marginHorizontal: 12 },
});
