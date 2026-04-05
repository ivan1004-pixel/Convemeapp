import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, DimensionValue } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { Spacing } from '@/src/theme/spacing';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%', height = 16, borderRadius = 4, style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: Colors.border, opacity },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <View style={skeletonStyles.card}>
    <Skeleton width="60%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
    <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
    <Skeleton width="40%" height={14} borderRadius={4} />
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12, padding: Spacing.cardPadding,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
});
