import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

export function NeobrutalistBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* Patrón de fondo discreto */}
      <View style={styles.pattern}>
        {/* Puntos pequeños como patrón */}
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                left: `${(i * 17) % 100}%`,
                top: `${(i * 23) % 100}%`,
              },
            ]}
          />
        ))}
      </View>
      
      {/* Contenido */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark,
  },
  content: {
    flex: 1,
  },
});
