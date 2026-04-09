import { useEffect, useRef } from 'react';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { updateUserService } from '../services/user.service';
import { useAuthStore } from '../store/authStore';

export const usePushNotifications = () => {
  const { usuario, setUsuario, isAuthenticated } = useAuthStore();
  const hasRegistered = useRef(false);

  useEffect(() => {
    // Solo intentar registro si estamos autenticados y el store ya se hidrató
    if (isAuthenticated && usuario && !usuario.push_token && !hasRegistered.current && useAuthStore.persist.hasHydrated()) {
      hasRegistered.current = true;
      register();
    }
  }, [usuario, isAuthenticated]);

  const register = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token && usuario) {
        console.log('Push Token obtenido:', token);
        await updateUserService(usuario.id_usuario, undefined, undefined, undefined, undefined, token);
        setUsuario({ ...usuario, push_token: token });
      }
    } catch (error) {
      console.error('Error al registrar notificaciones push:', error);
    }
  };
};
