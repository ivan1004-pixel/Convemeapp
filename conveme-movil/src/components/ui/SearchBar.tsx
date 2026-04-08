import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
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
          backgroundColor: '#F9F4EE', // Beige claro fijo para todas las barras de búsqueda
          borderColor: isFocused ? Colors.primary : Colors.dark,
        },
        isFocused && styles.focused,
        style,
      ]}
    >
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
            { backgroundColor: isFocused ? 'rgba(0,0,0,0.05)' : 'transparent' }
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
