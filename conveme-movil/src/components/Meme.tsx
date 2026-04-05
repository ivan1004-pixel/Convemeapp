import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius } from '../theme/spacing';

interface MemeProps {
  source: ReturnType<typeof require>;
  size?: number;
  style?: ViewStyle;
}

export const Meme: React.FC<MemeProps> = ({ source, size = 160, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
