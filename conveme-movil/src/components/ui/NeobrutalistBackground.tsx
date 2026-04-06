import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';

export function NeobrutalistBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* Fondo con degradado suave */}
      <LinearGradient
        colors={[Colors.beige, Colors.beigeDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Patrón de fondo discreto */}
      <View style={styles.pattern}>
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
