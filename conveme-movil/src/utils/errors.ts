/**
 * Utilidades de manejo de errores
 */
import { ApolloError } from '@apollo/client';

/** Extrae un mensaje de error legible desde distintos tipos de errores */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApolloError) {
    // Error de GraphQL
    if (error.graphQLErrors?.length) {
      return error.graphQLErrors[0].message;
    }
    // Error de red
    if (error.networkError) {
      return 'Error de conexión. Verifica tu internet.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Ha ocurrido un error inesperado';
};

/** Verifica si un error es de red */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof ApolloError) {
    return !!error.networkError;
  }
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('conexión') ||
      error.message.toLowerCase().includes('connection');
  }
  return false;
};

/** Verifica si el error es de autenticación (401) */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof ApolloError) {
    return error.graphQLErrors?.some(
      (e) =>
        e.message.toLowerCase().includes('unauthorized') ||
        e.message.toLowerCase().includes('unauthenticated') ||
        e.message.toLowerCase().includes('jwt') ||
        e.extensions?.code === 'UNAUTHENTICATED',
    ) ?? false;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('unauthorized') || msg.includes('jwt expired');
  }
  return false;
};

/** Tipos de error de la app */
export type AppErrorType =
  | 'network'
  | 'authentication'
  | 'validation'
  | 'not_found'
  | 'server'
  | 'unknown';

/** Clasifica un error en un tipo conocido */
export const classifyError = (error: unknown): AppErrorType => {
  if (isNetworkError(error)) return 'network';
  if (isAuthError(error)) return 'authentication';

  const message = getErrorMessage(error).toLowerCase();
  if (message.includes('not found') || message.includes('no encontrado')) return 'not_found';
  if (message.includes('invalid') || message.includes('validation')) return 'validation';
  if (message.includes('server') || message.includes('500')) return 'server';

  return 'unknown';
};

/** Mensajes de error amigables por tipo */
export const friendlyErrorMessages: Record<AppErrorType, string> = {
  network: 'Sin conexión a internet. Verifica tu red y vuelve a intentar.',
  authentication: 'Sesión expirada. Por favor inicia sesión nuevamente.',
  validation: 'Los datos ingresados no son válidos.',
  not_found: 'El recurso solicitado no fue encontrado.',
  server: 'Error en el servidor. Intenta más tarde.',
  unknown: 'Ha ocurrido un error inesperado. Intenta de nuevo.',
};
