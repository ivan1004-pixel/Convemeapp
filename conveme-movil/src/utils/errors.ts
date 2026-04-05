export const parseGraphQLError = (error: unknown): string => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('unauthorized') || msg.includes('unauthenticated'))
      return 'Sesión expirada. Por favor inicia sesión de nuevo.';
    if (msg.includes('network')) return 'Error de conexión. Verifica tu internet.';
    if (msg.includes('duplicate') || msg.includes('ya existe'))
      return 'Este registro ya existe.';
    return error.message;
  }
  return 'Error desconocido';
};
