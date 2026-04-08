import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  withTiming
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useColorScheme } from '../../hooks/use-color-scheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const [isFocused, setIsFocused] = useState(false);
  
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(focusAnim.value, [0, 1], [0, 2]) },
        { translateY: interpolate(focusAnim.value, [0, 1], [0, 2]) },
      ],
      shadowOffset: {
        width: interpolate(focusAnim.value, [0, 1], [4, 2]),
        height: interpolate(focusAnim.value, [0, 1], [4, 2]),
      },
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: '#F9F4EE',
          borderColor: isFocused ? Colors.primary : Colors.dark,
          shadowColor: Colors.dark,
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 4,
        },
        animatedStyle,
        style,
      ]}
    >
      <MaterialCommunityIcons 
        name="magnify" 
        size={20} 
        color="rgba(26,26,26,0.5)" 
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.input, { color: Colors.dark }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(26,26,26,0.5)"
        returnKeyType="search"
        clearButtonMode="never"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
          }}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.pressed,
          ]}
          accessibilityLabel="Limpiar búsqueda"
          accessibilityRole="button"
          hitSlop={10}
        >
          <MaterialCommunityIcons 
            name="close-circle" 
            size={20} 
            color={isFocused ? Colors.primary : "rgba(26,26,26,0.3)"} 
          />
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontWeight: '700',
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
});
