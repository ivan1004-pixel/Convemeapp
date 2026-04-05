import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUIStore } from '@/src/store/uiStore';
import { Colors } from '@/src/theme/colors';
import { Typography } from '@/src/theme/typography';

export const SyncIndicator: React.FC = () => {
  const { isConnected, isSyncing } = useUIStore();

  if (isConnected && !isSyncing) return null;

  return (
    <View style={[styles.container, !isConnected && styles.offline]}>
      <Text style={styles.text}>
        {!isConnected ? '📡 Sin conexión' : '🔄 Sincronizando...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.warning, paddingVertical: 6, zIndex: 999,
  },
  offline: { backgroundColor: Colors.danger },
  text: { ...Typography.caption, color: Colors.white, textAlign: 'center', fontWeight: '600' },
});
