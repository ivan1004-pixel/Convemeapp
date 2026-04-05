import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { useUIStore } from '@/src/store/uiStore';

const toastColors: Record<string, string> = {
  success: Colors.success,
  error: Colors.danger,
  warning: Colors.warning,
  info: Colors.primary,
};

export const Toast: React.FC = () => {
  const { toast, hideToast } = useUIStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.spring(translateY, { toValue: -100, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => hideToast());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast, translateY, opacity, hideToast]);

  if (!toast) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: toastColors[toast.type] ?? Colors.primary },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <View>
        <Text style={styles.text}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 50, left: Spacing.md, right: Spacing.md,
    borderRadius: 10, padding: Spacing.md,
    zIndex: 9999, elevation: 20,
  },
  text: { ...Typography.body, color: Colors.white, textAlign: 'center' },
});
