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
        { 
          backgroundColor: '#FFFFFF', 
          borderBottomColor: Colors.dark,
          borderBottomWidth: 3,
        },
        style,
      ]}
    >
      <View style={styles.left}>
        {showBack && (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton, 
              pressed && styles.pressed,
              { backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.dark, borderRadius: 8 }
            ]}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Text style={[styles.backIcon, { color: Colors.dark }]}>←</Text>
          </Pressable>
        )}
      </View>
      <Text style={[styles.title, { color: Colors.dark }]} numberOfLines={1}>
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
    height: Platform.OS === 'ios' ? 70 : 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  left: {
    width: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    width: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h3,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: -2,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
