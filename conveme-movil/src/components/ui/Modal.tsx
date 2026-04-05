import React from 'react';
import {
  Modal as RNModal, View, Text, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { Button } from './Button';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  loading?: boolean;
  confirmVariant?: 'primary' | 'danger';
}

export const Modal: React.FC<ModalProps> = ({
  visible, onClose, title, children,
  confirmText, cancelText = 'Cancelar', onConfirm, loading,
  confirmVariant = 'primary',
}) => {
  return (
    <RNModal
      visible={visible} animationType="fade" transparent onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
            {title && (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.body}>{children}</View>
            </ScrollView>
            {(onConfirm || cancelText) && (
              <View style={styles.footer}>
                <Button title={cancelText} onPress={onClose} variant="outline" style={styles.footerBtn} />
                {onConfirm && confirmText && (
                  <Button
                    title={confirmText} onPress={onConfirm}
                    variant={confirmVariant} loading={loading} style={styles.footerBtn}
                  />
                )}
              </View>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.background, borderRadius: 16,
    width: '100%', maxHeight: '85%', overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { ...Typography.h3, color: Colors.text, flex: 1 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: Colors.textSecondary },
  body: { padding: Spacing.md },
  footer: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerBtn: { flex: 1 },
});
