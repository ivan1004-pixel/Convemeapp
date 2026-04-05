import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type: ToastType;
  message: string;
  duration?: number;
  onHide: () => void;
}

const TOAST_CONFIG: Record<ToastType, { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string }> = {
  success: { icon: 'check-circle', color: Colors.success },
  error: { icon: 'alert-circle', color: Colors.error },
  warning: { icon: 'alert', color: Colors.warning },
  info: { icon: 'information', color: Colors.info },
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  type,
  message,
  duration = 3000,
  onHide,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.8, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const config = TOAST_CONFIG[type];

  return (
    <Modal transparent animationType="none" visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.toast, { opacity, transform: [{ scale }] }]}>
          <MaterialCommunityIcons name={config.icon} size={32} color={config.color} />
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  toast: {
    backgroundColor: '#1A1A2E',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    maxWidth: 280,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  message: {
    ...Typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
});

// ----- Hook -----
interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
}

export const useToast = () => {
  const [toast, setToast] = React.useState<ToastState>({
    visible: false,
    type: 'info',
    message: '',
  });

  const show = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, type, message });
  };

  const hide = () => setToast((prev) => ({ ...prev, visible: false }));

  return { toast, show, hide };
};
