import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
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

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#F9F4EE',
          borderColor: isFocused ? Colors.primary : Colors.dark,
          borderWidth: isFocused ? 2 : 1.5,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons 
        name="magnify" 
        size={20} 
        color={isFocused ? Colors.primary : "rgba(26,26,26,0.4)"} 
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
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
          }}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && { opacity: 0.5, transform: [{ scale: 0.9 }] },
          ]}
          accessibilityLabel="Limpiar búsqueda"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="close-circle" size={20} color={isFocused ? Colors.primary : Colors.dark} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  focused: {
    borderWidth: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  clearIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
});
