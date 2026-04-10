import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth, ROLE_ADMIN } from '../../../src/hooks/useAuth';
import { useAuthStore } from '../../../src/store/authStore';
import { getEmpleados } from '../../../src/services/empleado.service';
import { getVendedores } from '../../../src/services/vendedor.service';
import { updateUserService } from '../../../src/services/user.service';
import type { Empleado, Vendedor } from '../../../src/types';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';

export default function PerfilScreen() {
  const { logout } = useAuth();
  const { usuario, setUsuario } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);

  const [showPhotoPicker, setShowPhotoPicker] = useState(false); // 👈 modal de selección

  const username = usuario?.username ?? 'USUARIO';
  const rolId = usuario?.rol_id ?? 0;
  const rolLabel =
  rolId === 1 ? 'ADMINISTRADOR' : rolId === 2 ? 'VENDEDOR' : `ROL ${rolId}`;
  const isAdmin = rolId === ROLE_ADMIN;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const empleados = await getEmpleados();
        const emp = empleados.find(
          (e) => e.usuario?.id_usuario === usuario?.id_usuario,
        );
        setEmpleado(emp || null);
      } else {
        const vendedores = await getVendedores();
        const vend = vendedores.find(
          (v) =>
          (usuario?.id_vendedor && v.id_vendedor === usuario.id_vendedor) ||
          v.usuario?.id_usuario === usuario?.id_usuario ||
          v.nombre_completo
          .toLowerCase()
          .includes(username.toLowerCase()),
        );
        setVendedor(vend || null);
      }
    } catch (error) {
      // puedes loguear si quieres
    } finally {
      setLoading(false);
    }
  };

  // Abre el modal personalizado de selección de foto
  const pickImage = () => {
    setShowPhotoPicker(true);
  };

  const closePhotoPicker = () => {
    setShowPhotoPicker(false);
  };

  const handleCamera = async () => {
    closePhotoPicker();

    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('SE REQUIERE PERMISO DE CÁMARA');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 👈 usar MediaTypeOptions
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      uploadImage(result.assets[0].base64);
    }
  };

  const handleGallery = async () => {
    closePhotoPicker();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('SE REQUIERE PERMISO DE GALERÍA');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 👈 igual aquí
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      uploadImage(result.assets[0].base64);
    }
  };

  const uploadImage = async (base64: string) => {
    if (!usuario) return;
    try {
      setUploading(true);
      const base64Data = `data:image/jpeg;base64,${base64}`;
      const updatedUser = await updateUserService(
        usuario.id_usuario,
        undefined,
        undefined,
        undefined,
        base64Data,
      );

      // Actualizar el store de auth
      setUsuario({
        ...usuario,
        foto_perfil: updatedUser.foto_perfil,
      });

      alert('FOTO DE PERFIL ACTUALIZADA');
    } catch (error) {
      alert('NO SE PUDO ACTUALIZAR LA FOTO');
    } finally {
      setUploading(false);
    }
  };

  const defaultAvatar = isAdmin
  ? require('../../../assets/images/fotoadmin.jpg')
  : require('../../../assets/images/fotovendedor.jpg');

  return (
    <NeobrutalistBackground>
    <SafeAreaView style={styles.container} edges={['top']}>
    <View style={styles.header}>
    <TouchableOpacity
    onPress={() => router.push('/(app)')}
    style={styles.backBtn}
    >
    <MaterialCommunityIcons
    name="arrow-left"
    size={24}
    color={Colors.primary}
    />
    </TouchableOpacity>
    <View>
    <Text style={styles.screenTitle}>MI PERFIL</Text>
    <Text style={styles.subtitle}>{rolLabel}</Text>
    </View>
    </View>

    <ScrollView
    contentContainerStyle={styles.scroll}
    showsVerticalScrollIndicator={false}
    >
    {loading ? (
      <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>CARGANDO...</Text>
      </View>
    ) : (
      <>
      {/* Avatar */}
      <Animated.View
      entering={FadeInDown.duration(400).delay(100)}
      style={styles.avatarSection}
      >
      <TouchableOpacity
      onPress={pickImage}
      disabled={uploading}
      style={styles.avatarWrapper}
      >
      <View style={styles.avatarCircle}>
      {uploading ? (
        <ActivityIndicator size="large" color={Colors.dark} />
      ) : (
        <Image
        source={
          usuario?.foto_perfil
          ? { uri: usuario.foto_perfil }
          : defaultAvatar
        }
        style={styles.avatarImage}
        contentFit="cover"
        />
      )}
      </View>
      <View style={styles.editBadge}>
      <MaterialCommunityIcons
      name="camera"
      size={16}
      color="#FFF"
      />
      </View>
      </TouchableOpacity>
      <Text style={styles.username}>
      {(
        empleado?.nombre_completo ||
        vendedor?.nombre_completo ||
        username
      ).toUpperCase()}
      </Text>
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
      <Animated.View
      entering={FadeInDown.duration(400).delay(200)}
      style={styles.card}
      >
      <View style={styles.cardHeaderRow}>
      <MaterialCommunityIcons
      name="account-circle"
      size={24}
      color={Colors.primary}
      />
      <Text style={styles.cardTitle}>INFORMACIÓN DE CUENTA</Text>
      </View>
      <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>ID USUARIO</Text>
      <Text style={styles.infoValue}>
      #{usuario?.id_usuario ?? '-'}
      </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>USERNAME</Text>
      <Text style={styles.infoValue}>
      {username.toUpperCase()}
      </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>ROL</Text>
      <Text style={styles.infoValue}>{rolLabel}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>ESTADO</Text>
      <View style={styles.activeRow}>
      <MaterialCommunityIcons
      name="check-circle"
      size={16}
      color={Colors.success}
      />
      <Text style={styles.infoValueGreen}>ACTIVO</Text>
      </View>
      </View>
      </Animated.View>

      {/* Info Card - Datos Personales */}
      {(empleado || vendedor) && (
        <Animated.View
        entering={FadeInDown.duration(400).delay(300)}
        style={styles.card}
        >
        <View style={styles.cardHeaderRow}>
        <MaterialCommunityIcons
        name="card-account-details"
        size={24}
        color={Colors.primary}
        />
        <Text style={styles.cardTitle}>DATOS PERSONALES</Text>
        </View>

        {empleado && (
          <>
          {empleado.email && (
            <>
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMAIL</Text>
            <Text style={styles.infoValue}>
            {empleado.email.toUpperCase()}
            </Text>
            </View>
            <View style={styles.divider} />
            </>
          )}
          {empleado.telefono && (
            <>
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TELÉFONO</Text>
            <Text style={styles.infoValue}>
            {empleado.telefono}
            </Text>
            </View>
            <View style={styles.divider} />
            </>
          )}
          {empleado.puesto && (
            <>
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PUESTO</Text>
            <Text style={styles.infoValue}>
            {empleado.puesto.toUpperCase()}
            </Text>
            </View>
            <View style={styles.divider} />
            </>
          )}
          {(empleado.calle_y_numero ||
            empleado.colonia ||
            empleado.municipio) && (
              <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DIRECCIÓN</Text>
              <Text style={styles.infoValue}>
              {[
                empleado.calle_y_numero,
                empleado.colonia,
                empleado.municipio?.nombre,
              ]
              .filter(Boolean)
              .join(', ')
              .toUpperCase()}
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
            <Text style={styles.infoLabel}>EMAIL</Text>
            <Text style={styles.infoValue}>
            {vendedor.email.toUpperCase()}
            </Text>
            </View>
            <View style={styles.divider} />
            </>
          )}
          {vendedor.telefono && (
            <>
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TELÉFONO</Text>
            <Text style={styles.infoValue}>
            {vendedor.telefono}
            </Text>
            </View>
            <View style={styles.divider} />
            </>
          )}
          {vendedor.instagram_handle && (
            <>
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>INSTAGRAM</Text>
            <Text style={styles.infoValue}>
            @{vendedor.instagram_handle.toUpperCase()}
            </Text>
            </View>
            <View style={styles.divider} />
            </>
          )}
          {vendedor.escuela && (
            <>
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ESCUELA</Text>
            <Text style={styles.infoValue}>
            {vendedor.escuela.nombre.toUpperCase()}
            </Text>
            </View>
            <View style={styles.divider} />
            </>
          )}
          {vendedor.municipio && (
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>MUNICIPIO</Text>
            <Text style={styles.infoValue}>
            {vendedor.municipio.nombre.toUpperCase()}
            </Text>
            </View>
          )}
          </>
        )}
        </Animated.View>
      )}

      {/* Logout */}
      <Animated.View
      entering={FadeInDown.duration(400).delay(400)}
      >
      <TouchableOpacity
      style={styles.logoutButton}
      onPress={logout}
      >
      <MaterialCommunityIcons
      name="logout"
      size={24}
      color="#FFF"
      />
      <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
      </Animated.View>
      </>
    )}
    </ScrollView>

    {/* MODAL NEOBRUTALISTA PARA CÁMARA / GALERÍA */}
    <Modal
    visible={showPhotoPicker}
    transparent
    animationType="fade"
    onRequestClose={closePhotoPicker}
    >
    <View style={styles.photoPickerOverlay}>
    <View style={styles.photoPickerCard}>
    <Text style={styles.photoPickerTitle}>
    CAMBIAR FOTO DE PERFIL
    </Text>
    <Text style={styles.photoPickerSubtitle}>
    SELECCIONA UNA OPCIÓN
    </Text>

    <TouchableOpacity
    style={[styles.photoPickerButton, styles.photoPickerCameraBtn]}
    onPress={handleCamera}
    disabled={uploading}
    >
    <MaterialCommunityIcons
    name="camera"
    size={18}
    color={Colors.dark}
    style={{ marginRight: 8 }}
    />
    <Text style={styles.photoPickerButtonText}>CÁMARA</Text>
    </TouchableOpacity>

    <TouchableOpacity
    style={[
      styles.photoPickerButton,
      styles.photoPickerGalleryBtn,
    ]}
    onPress={handleGallery}
    disabled={uploading}
    >
    <MaterialCommunityIcons
    name="image-multiple"
    size={18}
    color={Colors.dark}
    style={{ marginRight: 8 }}
    />
    <Text style={styles.photoPickerButtonText}>GALERÍA</Text>
    </TouchableOpacity>

    <TouchableOpacity
    style={styles.photoPickerCancel}
    onPress={closePhotoPicker}
    >
    <Text style={styles.photoPickerCancelText}>CANCELAR</Text>
    </TouchableOpacity>
    </View>
    </View>
    </Modal>
    </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    gap: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.4)',
                                 textTransform: 'uppercase',
                                 letterSpacing: 1,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '900',
    color: Colors.dark,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    elevation: 0,
    overflow: 'hidden',
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: Colors.dark,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  username: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.dark,
  },
  rolBadgeText: {
    fontSize: 10,
    color: Colors.dark,
    fontWeight: '900',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  infoLabel: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
                                 fontWeight: '800',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.dark,
    textAlign: 'right',
    flexShrink: 1,
  },
  infoValueGreen: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.success,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Modal selección foto
  photoPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
                                 justifyContent: 'center',
                                 alignItems: 'center',
                                 padding: 20,
  },
  photoPickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    elevation: 6,
  },
  photoPickerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.dark,
    textAlign: 'center',
    letterSpacing: 2,
  },
  photoPickerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.4)',
                                 textAlign: 'center',
                                 marginTop: 4,
                                 marginBottom: Spacing.lg,
                                 letterSpacing: 1,
  },
  photoPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark,
    marginBottom: Spacing.sm,
  },
  photoPickerCameraBtn: {
    backgroundColor: '#FFE066',
  },
  photoPickerGalleryBtn: {
    backgroundColor: '#9BE7FF',
  },
  photoPickerButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.dark,
  },
  photoPickerCancel: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  photoPickerCancelText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.5)',
  },
});
