import React from 'react';
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, borderRadius, shadows, spacing, textStyles } from '../theme';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
  closeOnBackdrop?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footer,
  contentStyle,
  closeOnBackdrop = true,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={closeOnBackdrop ? onClose : undefined}
      >
        <Pressable style={[styles.content, contentStyle]} onPress={() => {}}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.body}>{children}</View>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Pressable>
      </Pressable>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  content: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    ...shadows.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    ...textStyles.h3,
    color: colors.gray[900],
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  closeText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  body: {
    padding: spacing[5],
  },
  footer: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
