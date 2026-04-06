import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth, ROLE_ADMIN } from '../../../src/hooks/useAuth';
import { useAuthStore } from '../../../src/store/authStore';
import { getEmpleados } from '../../../src/services/empleado.service';
import { getVendedores } from '../../../src/services/vendedor.service';
import type { Empleado, Vendedor } from '../../../src/types';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';

export default function PerfilScreen() {
  const { logout } = useAuth();
  const { usuario } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);

  const username = usuario?.username ?? 'Usuario';
  const rolId = usuario?.rol_id ?? 0;
  const rolLabel = rolId === 1 ? 'Administrador' : rolId === 2 ? 'Vendedor' : `Rol ${rolId}`;
  const isAdmin = rolId === ROLE_ADMIN;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        // Buscar empleado con el usuario actual
        const empleados = await getEmpleados();
        const emp = empleados.find(e => e.usuario?.id_usuario === usuario?.id_usuario);
        setEmpleado(emp || null);
      } else {
        // Buscar vendedor (asumiendo que los vendedores están vinculados de alguna forma)
        const vendedores = await getVendedores();
        const vend = vendedores.find(v => v.nombre_completo.toLowerCase().includes(username.toLowerCase()));
        setVendedor(vend || null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.screenTitle}>Mi Perfil</Text>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Avatar */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Image
                  source={isAdmin ? require('../../../assets/images/fotoadmin.jpg') : require('../../../assets/images/fotovendedor.jpg')}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              </View>
              <Text style={styles.username}>{empleado?.nombre_completo || vendedor?.nombre_completo || username}</Text>
              <View style={styles.rolBadge}>
                <MaterialCommunityIcons 
                  name={isAdmin ? 'shield-crown' : 'account-tie'} 
                  size={16} 
                  color={Colors.dark} 
                />
                <Text style={styles.rolBadgeText}>{rolLabel}</Text>
              </View>
            </Animated.View>

            {/* Info Card - Información de Cuenta */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="account-circle" size={24} color={Colors.primary} />
                <Text style={styles.cardTitle}>Información de Cuenta</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID Usuario</Text>
                <Text style={styles.infoValue}>#{usuario?.id_usuario ?? '-'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{username}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rol</Text>
                <Text style={styles.infoValue}>{rolLabel}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estado</Text>
                <View style={styles.activeRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
                  <Text style={styles.infoValueGreen}>Activo</Text>
                </View>
              </View>
            </Animated.View>

            {/* Info Card - Datos Personales */}
            {(empleado || vendedor) && (
              <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="card-account-details" size={24} color={Colors.primary} />
                  <Text style={styles.cardTitle}>Datos Personales</Text>
                </View>
                
                {empleado && (
                  <>
                    {empleado.email && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Email</Text>
                          <Text style={styles.infoValue}>{empleado.email}</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                    {empleado.telefono && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Teléfono</Text>
                          <Text style={styles.infoValue}>{empleado.telefono}</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                    {empleado.puesto && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Puesto</Text>
                          <Text style={styles.infoValue}>{empleado.puesto}</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                    {(empleado.calle_y_numero || empleado.colonia || empleado.municipio) && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Dirección</Text>
                        <Text style={styles.infoValue}>
                          {[empleado.calle_y_numero, empleado.colonia, empleado.municipio?.nombre].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {vendedor && (
                  <>
                    {vendedor.email && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Email</Text>
                          <Text style={styles.infoValue}>{vendedor.email}</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                    {vendedor.telefono && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Teléfono</Text>
                          <Text style={styles.infoValue}>{vendedor.telefono}</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                    {vendedor.instagram_handle && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Instagram</Text>
                          <Text style={styles.infoValue}>@{vendedor.instagram_handle}</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                    {vendedor.escuela && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Escuela</Text>
                          <Text style={styles.infoValue}>{vendedor.escuela.nombre}</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}
                    {vendedor.municipio && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Municipio</Text>
                        <Text style={styles.infoValue}>{vendedor.municipio.nombre}</Text>
                      </View>
                    )}
                  </>
                )}
              </Animated.View>
            )}

            {/* Logout */}
            <Animated.View entering={FadeInDown.duration(400).delay(400)}>
              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <MaterialCommunityIcons name="logout" size={20} color="#fff" />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.beige 
  },
  scroll: { 
    padding: Spacing.lg, 
    paddingBottom: Spacing.xxl 
  },
  header: { 
    marginBottom: Spacing.xl,
    alignItems: 'center'
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 50 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 2, borderColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { 
    ...Typography.h3, 
    fontWeight: '900', 
    color: Colors.dark,
    letterSpacing: 1
  },
  avatarSection: { 
    alignItems: 'center', 
    marginBottom: Spacing.xl 
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 4,
    borderColor: Colors.dark,
    // Shadow neobrutalista
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden' // Ensure image respects border radius
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: { 
    ...Typography.h2, 
    color: '#fff', 
    fontWeight: '900'
  },
  username: { 
    ...Typography.h3, 
    fontWeight: '900', 
    color: Colors.dark, 
    marginBottom: Spacing.xs,
    letterSpacing: 0.5
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.pink,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  rolBadgeText: { 
    ...Typography.caption, 
    color: Colors.dark, 
    fontWeight: '900',
    letterSpacing: 1
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    borderColor: Colors.dark,
    backgroundColor: '#F9F4EE',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    // Shadow neobrutalista
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  cardTitle: { 
    ...Typography.h4, 
    fontWeight: '900', 
    color: Colors.dark, 
    marginBottom: Spacing.lg,
    letterSpacing: 1
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: Spacing.md 
  },
  infoLabel: { 
    ...Typography.body, 
    color: Colors.dark,
    opacity: 0.6,
    fontWeight: '700'
  },
  infoValue: { 
    ...Typography.body, 
    fontWeight: '900', 
    color: Colors.dark,
    textAlign: 'right',
    flexShrink: 1,
  },
  infoValueGreen: { 
    ...Typography.body, 
    fontWeight: '900', 
    color: Colors.success 
  },
  activeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  divider: { 
    height: 2, 
    backgroundColor: Colors.dark,
    opacity: 0.1
  },
  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 3,
    borderColor: Colors.dark,
    // Shadow neobrutalista
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  logoutText: { 
    ...Typography.button, 
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 1
  },
});
