/**
 * Queries y Mutations de Eventos
 */
import { gql } from '@apollo/client';

// ── Queries ────────────────────────────────────────────────────────────────

export const GET_EVENTOS = gql`
  query GetEventos {
    eventos {
      id_evento
      nombre
      descripcion
      fecha_inicio
      fecha_fin
      costo_stand
      escuela {
        id_escuela
        nombre
      }
      municipio {
        id_municipio
        nombre
        estado {
          id_estado
          nombre
        }
      }
    }
  }
`;

export const GET_EVENTO = gql`
  query GetEvento($id: Int!) {
    evento(id_evento: $id) {
      id_evento
      nombre
      descripcion
      fecha_inicio
      fecha_fin
      costo_stand
      escuela {
        id_escuela
        nombre
      }
      municipio {
        id_municipio
        nombre
        estado {
          id_estado
          nombre
        }
      }
    }
  }
`;

// ── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_EVENTO = gql`
  mutation CreateEvento($input: CreateEventoInput!) {
    createEvento(createEventoInput: $input) {
      id_evento
      nombre
    }
  }
`;

export const UPDATE_EVENTO = gql`
  mutation UpdateEvento($input: UpdateEventoInput!) {
    updateEvento(updateEventoInput: $input) {
      id_evento
      nombre
    }
  }
`;

export const REMOVE_EVENTO = gql`
  mutation RemoveEvento($id: Int!) {
    removeEvento(id_evento: $id) {
      id_evento
    }
  }
`;

// ── Types ──────────────────────────────────────────────────────────────────

export interface Escuela {
  id_escuela: number;
  nombre: string;
}

export interface Estado {
  id_estado: number;
  nombre: string;
}

export interface Municipio {
  id_municipio: number;
  nombre: string;
  estado: Estado;
}

export interface Evento {
  id_evento: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  costo_stand?: number;
  escuela?: Escuela;
  municipio?: Municipio;
}

export interface GetEventosResult {
  eventos: Evento[];
}

export interface GetEventoVariables {
  id: number;
}

export interface GetEventoResult {
  evento: Evento;
}

export interface CreateEventoVariables {
  input: Omit<Evento, 'id_evento' | 'escuela' | 'municipio'> & {
    escuela_id?: number;
    municipio_id?: number;
  };
}

export interface CreateEventoResult {
  createEvento: Pick<Evento, 'id_evento' | 'nombre'>;
}

export interface UpdateEventoVariables {
  input: Partial<CreateEventoVariables['input']> & { id_evento: number };
}

export interface UpdateEventoResult {
  updateEvento: Pick<Evento, 'id_evento' | 'nombre'>;
}

export interface RemoveEventoVariables {
  id: number;
}

export interface RemoveEventoResult {
  removeEvento: Pick<Evento, 'id_evento'>;
}
