import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { useColorScheme } from '../../src/hooks/use-color-scheme';

export default function ProductosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🛍️</Text>
        <Text style={[styles.title, { color: theme.text }]}>Productos</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Próximamente</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { ...Typography.h3 },
  subtitle: { ...Typography.body },
});
