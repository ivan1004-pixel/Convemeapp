import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>💥</Text>
            <Text style={styles.title}>Algo salió mal</Text>
            <Text style={styles.message}>{this.state.error?.message ?? 'Error inesperado'}</Text>
            <Pressable style={styles.button} onPress={() => this.setState({ hasError: false })}>
              <Text style={styles.buttonText}>Intentar de nuevo</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.sm },
  message: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  button: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2, borderRadius: 8,
  },
  buttonText: { ...Typography.button, color: Colors.white },
});
