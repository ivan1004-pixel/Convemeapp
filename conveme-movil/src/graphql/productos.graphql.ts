/**
 * Queries y Mutations de Productos
 */
import { gql } from '@apollo/client';

// ── Queries ────────────────────────────────────────────────────────────────

export const GET_PRODUCTOS = gql`
  query GetProductos {
    productos {
      id_producto
      nombre
      descripcion
      precio
      activo
      categoria {
        id_categoria
        nombre
      }
    }
  }
`;

export const GET_PRODUCTO = gql`
  query GetProducto($id: Int!) {
    producto(id_producto: $id) {
      id_producto
      nombre
      descripcion
      precio
      activo
      categoria {
        id_categoria
        nombre
      }
    }
  }
`;

// ── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_PRODUCTO = gql`
  mutation CreateProducto($input: CreateProductoInput!) {
    createProducto(createProductoInput: $input) {
      id_producto
      nombre
    }
  }
`;

export const UPDATE_PRODUCTO = gql`
  mutation UpdateProducto($input: UpdateProductoInput!) {
    updateProducto(updateProductoInput: $input) {
      id_producto
      nombre
      precio
    }
  }
`;

export const REMOVE_PRODUCTO = gql`
  mutation RemoveProducto($id: Int!) {
    removeProducto(id_producto: $id) {
      id_producto
    }
  }
`;

// ── Types ──────────────────────────────────────────────────────────────────

export interface Categoria {
  id_categoria: number;
  nombre: string;
}

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  categoria?: Categoria;
}

export interface GetProductosResult {
  productos: Producto[];
}

export interface GetProductoVariables {
  id: number;
}

export interface GetProductoResult {
  producto: Producto;
}

export interface CreateProductoInput {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria_id?: number;
}

export interface CreateProductoVariables {
  input: CreateProductoInput;
}

export interface CreateProductoResult {
  createProducto: Pick<Producto, 'id_producto' | 'nombre'>;
}

export interface UpdateProductoVariables {
  input: Partial<CreateProductoInput> & { id_producto: number };
}

export interface UpdateProductoResult {
  updateProducto: Pick<Producto, 'id_producto' | 'nombre' | 'precio'>;
}

export interface RemoveProductoVariables {
  id: number;
}

export interface RemoveProductoResult {
  removeProducto: Pick<Producto, 'id_producto'>;
}
