import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightAction,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderBottomColor: theme.border },
        style,
      ]}
    >
      <View style={styles.left}>
        {showBack && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Text style={[styles.backIcon, { color: Colors.primary }]}>←</Text>
          </Pressable>
        )}
      </View>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 56 : 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h4,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
});
