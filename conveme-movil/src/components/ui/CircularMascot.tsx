import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View, ViewStyle, ImageStyle } from 'react-native';

interface CircularMascotProps {
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  isError?: boolean;
}

export const CircularMascot: React.FC<CircularMascotProps> = ({
  size = 80,
  style,
  imageStyle,
  isError = false,
}) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isError) {
      const animation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    } else {
      rotation.setValue(0);
    }
  }, [isError]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const mascotSource = isError 
    ? require('../../../assets/images/memeerror.png') 
    : require('../../../assets/images/mascota.png');

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Animated.Image
        source={mascotSource}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: !isError ? [{ rotate: spin }] : [],
          },
          imageStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
