export const parseApiError = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e['message'] === 'string') return e['message'];
    if (Array.isArray(e['errors']) && (e['errors'] as unknown[])[0]) {
      const firstErr = (e['errors'] as Record<string, unknown>[])[0];
      if (typeof firstErr['message'] === 'string') return firstErr['message'];
    }
  }
  return 'Ha ocurrido un error inesperado';
};

export const isUnauthorizedError = (error: unknown): boolean => {
  const message = parseApiError(error).toLowerCase();
  return message.includes('unauthorized') || message.includes('token') || message.includes('401');
};
