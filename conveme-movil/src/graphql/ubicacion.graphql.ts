/**
 * Queries de Ubicación (Estados y Municipios)
 */
import { gql } from '@apollo/client';

// ── Queries ────────────────────────────────────────────────────────────────

export const GET_ESTADOS = gql`
  query GetEstados {
    estados {
      id_estado
      nombre
      municipios {
        id_municipio
        nombre
      }
    }
  }
`;

export const GET_MUNICIPIOS = gql`
  query GetMunicipios($estadoId: Int!) {
    municipios(id_estado: $estadoId) {
      id_municipio
      nombre
      estado {
        id_estado
        nombre
      }
    }
  }
`;

// ── Types ──────────────────────────────────────────────────────────────────

export interface Estado {
  id_estado: number;
  nombre: string;
  municipios?: Municipio[];
}

export interface Municipio {
  id_municipio: number;
  nombre: string;
  estado?: Pick<Estado, 'id_estado' | 'nombre'>;
}

export interface GetEstadosResult {
  estados: Estado[];
}

export interface GetMunicipiosVariables {
  estadoId: number;
}

export interface GetMunicipiosResult {
  municipios: Municipio[];
}
