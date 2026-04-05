import { convemeApi } from '../api/convemeApi';

// Crear venta completa con detalles
export const createVenta = async (input: any) => {
    const query = `
    mutation CreateVenta($input: CreateVentaInput!) {
        createVenta(createVentaInput: $input) {
            id_venta
            fecha_venta
            monto_total
            metodo_pago
            estado
            cliente { id_cliente nombre_completo }
            vendedor { id_vendedor nombre_completo }
            detalles {
                id_det_venta
                cantidad
                precio_unitario
                producto { id_producto nombre sku }
            }
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { input } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.createVenta;
};

// Obtener todas las ventas con información completa
export const getVentas = async () => {
    const query = `
    query {
        ventas {
            id_venta
            fecha_venta
            monto_total
            metodo_pago
            estado
            cliente { id_cliente nombre_completo email telefono }
            vendedor { id_vendedor nombre_completo }
            detalles {
                id_det_venta
                cantidad
                precio_unitario
                producto { id_producto nombre sku precio_unitario }
            }
        }
    }
    `;
    const { data } = await convemeApi.post('', { query });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.ventas;
};

// Obtener una venta específica
export const getVenta = async (id: number) => {
    const query = `
    query GetVenta($id: Int!) {
        venta(id_venta: $id) {
            id_venta
            fecha_venta
            monto_total
            metodo_pago
            estado
            cliente { id_cliente nombre_completo email telefono }
            vendedor { id_vendedor nombre_completo }
            detalles {
                id_det_venta
                cantidad
                precio_unitario
                producto { id_producto nombre sku precio_unitario }
            }
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { id } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.venta;
};

// Actualizar venta
export const updateVenta = async (input: any) => {
    const query = `
    mutation UpdateVenta($input: UpdateVentaInput!) {
        updateVenta(updateVentaInput: $input) {
            id_venta
            fecha_venta
            monto_total
            metodo_pago
            estado
            cliente { id_cliente nombre_completo }
            vendedor { id_vendedor nombre_completo }
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { input } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.updateVenta;
};

// Eliminar venta
export const deleteVenta = async (id: number) => {
    const query = `mutation RemoveVenta($id: Int!) { removeVenta(id_venta: $id) }`;
    const { data } = await convemeApi.post('', { query, variables: { id } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.removeVenta;
};
