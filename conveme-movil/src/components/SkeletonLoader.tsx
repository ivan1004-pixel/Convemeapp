import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

export interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius: br = borderRadius.base,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width,
          height,
          borderRadius: br,
          opacity,
        },
        style,
      ]}
    />
  );
};

/** Skeleton para tarjetas de contenido */
export const CardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <SkeletonLoader height={120} borderRadius={borderRadius.xl} />
    <View style={styles.cardBody}>
      <SkeletonLoader height={20} width="70%" />
      <View style={styles.spacer} />
      <SkeletonLoader height={14} />
      <View style={{ height: spacing[1] }} />
      <SkeletonLoader height={14} width="85%" />
    </View>
  </View>
);

/** Skeleton para listas */
export const ListItemSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.listItem, style]}>
    <SkeletonLoader width={48} height={48} borderRadius={borderRadius.full} />
    <View style={styles.listItemBody}>
      <SkeletonLoader height={16} width="60%" />
      <View style={{ height: spacing[1.5] }} />
      <SkeletonLoader height={12} width="40%" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray[200],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },
  cardBody: {
    padding: spacing[4],
  },
  spacer: {
    height: spacing[2],
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  listItemBody: {
    flex: 1,
  },
});
