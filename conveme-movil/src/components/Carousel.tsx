import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../theme/colors';
import { BorderRadius } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH - 40; // Ancho con margen de 20px a cada lado
const SPACING = 20; // Espacio entre items

interface CarouselItem {
  id: string;
  source: any;
}

interface CarouselProps {
  items: CarouselItem[];
  height?: number;
  autoPlay?: boolean;
  interval?: number;
  style?: ViewStyle;
}

export const Carousel: React.FC<CarouselProps> = ({
  items,
  height = 280,
  autoPlay = true,
  interval = 3500,
  style,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % items.length;
      flatListRef.current?.scrollToOffset({ 
        offset: nextIndex * (ITEM_WIDTH + SPACING), 
        animated: true 
      });
      setActiveIndex(nextIndex);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length, activeIndex]);

  const onScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (ITEM_WIDTH + SPACING));
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <View style={[styles.container, { height }, style]}>
      <FlatList
        ref={flatListRef}
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={ITEM_WIDTH + SPACING}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SPACING }}
        renderItem={({ item }) => (
          <View style={{ width: ITEM_WIDTH, marginRight: SPACING }}>
            <Image
              source={item.source}
              style={styles.image}
              contentFit="cover"
              transition={500}
            />
          </View>
        )}
      />

      <View style={styles.dots}>
        {items.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeIndex ? Colors.primary : 'rgba(26,26,26,0.3)',
                width: index === activeIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    borderColor: Colors.dark,
  },
  dots: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.1)',
  },
});
