/**
 * Queries y Mutations de Autenticación
 * Endpoint: https://api-conveme.utvt.cloud:3000/graphql
 */
import { gql } from '@apollo/client';

// ── Mutations ──────────────────────────────────────────────────────────────

export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password_raw: String!) {
    login(loginInput: { username: $username, password_raw: $password_raw }) {
      token
      usuario {
        id_usuario
        rol_id
        username
      }
    }
  }
`;

// ── Types ──────────────────────────────────────────────────────────────────

export interface LoginVariables {
  username: string;
  password_raw: string;
}

export interface LoginResult {
  login: {
    token: string;
    usuario: {
      id_usuario: number;
      rol_id: number;
      username: string;
    };
  };
}
