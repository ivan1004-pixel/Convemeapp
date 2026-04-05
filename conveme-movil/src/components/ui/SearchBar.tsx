import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: object;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value, onChangeText, placeholder = 'Buscar...', onClear, style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      {value.length > 0 && onClear && (
        <Pressable onPress={onClear} style={styles.clearBtn} hitSlop={8}>
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 4 },
  clearBtn: { padding: 4 },
  clearText: { color: Colors.textSecondary, fontSize: 14 },
});
