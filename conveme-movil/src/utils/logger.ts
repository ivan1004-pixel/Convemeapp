const isDev = __DEV__;

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.info(`[ConVeMe] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    if (isDev) console.error(`[ConVeMe ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(`[ConVeMe WARN] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) console.debug(`[ConVeMe DEBUG] ${message}`, ...args);
  },
};
