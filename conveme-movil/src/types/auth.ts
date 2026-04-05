export type UserRole = 'ADMIN' | 'VENDEDOR';

export interface Usuario {
  id_usuario: number;
  username: string;
  rol_id: number;
  rol?: UserRole;
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  activo?: boolean;
}

export interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
}

export interface LoginInput {
  username: string;
  password_raw: string;
}

export interface LoginResult {
  token: string;
  usuario: Usuario;
}
