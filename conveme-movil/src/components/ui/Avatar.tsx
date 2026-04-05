import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { getInitials } from '../../utils';

interface AvatarProps {
  name: string;
  size?: number;
  imageUrl?: string;
  color?: string;
}

const AVATAR_COLORS = [
  '#0a7ea4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 40,
  imageUrl,
  color,
}) => {
  const initials = getInitials(name);
  const backgroundColor = color ?? getColorForName(name);
  const fontSize = size * 0.38;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.base,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.initialsContainer,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}
      accessibilityLabel={name}
    >
      <Text style={[styles.initials, { fontSize, lineHeight: size }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
});
