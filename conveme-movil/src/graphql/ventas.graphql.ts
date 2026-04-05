/**
 * Queries y Mutations de Ventas
 */
import { gql } from '@apollo/client';

// ── Queries ────────────────────────────────────────────────────────────────

export const GET_VENTAS = gql`
  query GetVentas {
    ventas {
      id_venta
      total
      fecha
      vendedor {
        id_vendedor
      }
      cliente {
        id_cliente
        nombre
      }
      evento {
        id_evento
        nombre
      }
    }
  }
`;

export const GET_VENTA = gql`
  query GetVenta($id: Int!) {
    venta(id_venta: $id) {
      id_venta
      total
      fecha
      vendedor {
        id_vendedor
      }
      cliente {
        id_cliente
        nombre
      }
      evento {
        id_evento
        nombre
      }
    }
  }
`;

// ── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_VENTA = gql`
  mutation CreateVenta($input: CreateVentaInput!) {
    createVenta(createVentaInput: $input) {
      id_venta
      total
    }
  }
`;

export const REMOVE_VENTA = gql`
  mutation RemoveVenta($id: Int!) {
    removeVenta(id_venta: $id) {
      id_venta
    }
  }
`;

// ── Types ──────────────────────────────────────────────────────────────────

export interface VentaVendedor {
  id_vendedor: number;
}

export interface VentaCliente {
  id_cliente: number;
  nombre: string;
}

export interface VentaEvento {
  id_evento: number;
  nombre: string;
}

export interface Venta {
  id_venta: number;
  total: number;
  fecha: string;
  vendedor?: VentaVendedor;
  cliente?: VentaCliente;
  evento?: VentaEvento;
}

export interface GetVentasResult {
  ventas: Venta[];
}

export interface GetVentaVariables {
  id: number;
}

export interface GetVentaResult {
  venta: Venta;
}

export interface CreateVentaInput {
  total: number;
  vendedor_id?: number;
  cliente_id?: number;
  evento_id?: number;
}

export interface CreateVentaVariables {
  input: CreateVentaInput;
}

export interface CreateVentaResult {
  createVenta: Pick<Venta, 'id_venta' | 'total'>;
}

export interface RemoveVentaVariables {
  id: number;
}

export interface RemoveVentaResult {
  removeVenta: Pick<Venta, 'id_venta'>;
}
