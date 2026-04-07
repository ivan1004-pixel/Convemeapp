import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../../src/hooks/useAuth';
import { Colors } from '../../src/theme/colors';
import { Toast, useToast } from '../../src/components/Toast';

// Componentes del Dashboard
import { VendedorDashboard } from '../../src/components/dashboard/VendedorDashboard';
import { AdminDashboard } from '../../src/components/dashboard/AdminDashboard'; // La moveré a su archivo en el siguiente paso

const DashboardPattern = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="dotPattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <Rect x="0" y="0" width="4" height="4" fill={Colors.dark} opacity="0.12" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dotPattern)" />
    </Svg>
  </View>
);

export default function DashboardScreen() {
  const { isAdmin } = useAuth();
  const { toast, hide: hideToast } = useToast();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <LinearGradient colors={[Colors.beige, Colors.beigeDark]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <DashboardPattern />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {isAdmin ? <AdminDashboard /> : <VendedorDashboard />}
      </SafeAreaView>
      <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});
