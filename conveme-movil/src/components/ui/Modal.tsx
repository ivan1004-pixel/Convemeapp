import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Shadows } from '../../theme/shadows';
import { useColorScheme } from '../../hooks/use-color-scheme';

type ModalSize = 'sm' | 'md' | 'lg' | 'full';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
}

const sizeMaxWidth: Record<ModalSize, number | string> = {
  sm: 320,
  md: 480,
  lg: 640,
  full: '100%',
};

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  const containerStyle: ViewStyle =
    size === 'full'
      ? {
          flex: 1,
          margin: 0,
          borderRadius: 0,
          maxWidth: '100%',
        }
      : {
          maxWidth: sizeMaxWidth[size] as number,
          width: '90%',
          borderRadius: BorderRadius.xl,
        };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.avoidingView}
        >
          <Pressable
            style={[
              styles.dialog,
              containerStyle,
              { backgroundColor: theme.surface },
              Shadows.lg,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {title && (
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                  accessibilityLabel="Cerrar"
                  accessibilityRole="button"
                >
                  <Text style={[styles.closeText, { color: theme.muted }]}>✕</Text>
                </Pressable>
              </View>
            )}
            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avoidingView: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  dialog: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    ...Typography.h4,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.6,
  },
  body: {
    padding: Spacing.md,
  },
});
