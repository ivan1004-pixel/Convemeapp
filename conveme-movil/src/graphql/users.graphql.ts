/**
 * Queries y Mutations de Usuarios
 */
import { gql } from '@apollo/client';

// ── Queries ────────────────────────────────────────────────────────────────

export const GET_USUARIO = gql`
  query GetPerfil($id: Int!) {
    usuario(id_usuario: $id) {
      id_usuario
      username
      rol_id
      activo
      created_at
    }
  }
`;

export const GET_USUARIOS = gql`
  query GetUsuarios {
    usuarios {
      id_usuario
      username
      rol_id
      activo
      created_at
    }
  }
`;

// ── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_USUARIO = gql`
  mutation CreateUsuario($username: String!, $password_raw: String!, $rol_id: Int!) {
    createUsuario(createUsuarioInput: {
      username: $username
      password_raw: $password_raw
      rol_id: $rol_id
    }) {
      id_usuario
      username
    }
  }
`;

export const UPDATE_USUARIO = gql`
  mutation UpdateUsuario($updateUsuarioInput: UpdateUsuarioInput!) {
    updateUsuario(updateUsuarioInput: $updateUsuarioInput) {
      id_usuario
      username
      rol_id
      activo
    }
  }
`;

// ── Types ──────────────────────────────────────────────────────────────────

export interface Usuario {
  id_usuario: number;
  username: string;
  rol_id: number;
  activo: boolean;
  created_at: string;
}

export interface GetUsuarioVariables {
  id: number;
}

export interface GetUsuarioResult {
  usuario: Usuario;
}

export interface GetUsuariosResult {
  usuarios: Usuario[];
}

export interface CreateUsuarioVariables {
  username: string;
  password_raw: string;
  rol_id: number;
}

export interface CreateUsuarioResult {
  createUsuario: Pick<Usuario, 'id_usuario' | 'username'>;
}

export interface UpdateUsuarioInput {
  id_usuario: number;
  username?: string;
  password_raw?: string;
  rol_id?: number;
}

export interface UpdateUsuarioVariables {
  updateUsuarioInput: UpdateUsuarioInput;
}

export interface UpdateUsuarioResult {
  updateUsuario: Usuario;
}
