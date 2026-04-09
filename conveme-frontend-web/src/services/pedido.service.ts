import { convemeApi } from '../api/convemeApi';

// 1. Obtener todos los pedidos con PAGINACIÓN (20 en 20)
export const getPedidos = async (skip = 0, take = 20) => {
    const query = `
    query GetPedidos($skip: Int, $take: Int) {
        pedidos(skip: $skip, take: $take) {
            id_pedido
            fecha_pedido
            fecha_entrega_estimada
            monto_total
            anticipo
            estado

            vendedor {
                id_vendedor
                nombre_completo
            }

            cliente {
                id_cliente
                nombre_completo
            }
            detalles {
                cantidad
                precio_unitario
                producto {
                    id_producto
                    nombre
                    sku
                }
            }
        }
    }
    `;
    const { data } = await convemeApi.post('', { 
        query, 
        variables: { skip, take } 
    });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.pedidos;
};

// 2. Crear un nuevo pedido (¡NUEVO para el Vendedor!)
export const createPedido = async (input: any) => {
    const query = `
    mutation CreatePedido($input: CreatePedidoInput!) {
        createPedido(createPedidoInput: $input) {
            id_pedido
            estado
            monto_total
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { input } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.createPedido;
};

// 3. Actualizar estado del pedido (Para el Admin)
export const updateEstadoPedido = async (id_pedido: number, estado: string) => {
    const query = `
    mutation UpdatePedido($input: UpdatePedidoInput!) {
        updatePedido(updatePedidoInput: $input) {
            id_pedido
            estado
        }
    }
    `;
    const variables = { input: { id_pedido, estado } };
    const { data } = await convemeApi.post('', { query, variables });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.updatePedido;
};

// 4. Eliminar un pedido
export const deletePedido = async (id: number) => {
    const query = `mutation RemovePedido($id: Int!) { removePedido(id_pedido: $id) }`;
    const { data } = await convemeApi.post('', { query, variables: { id } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.removePedido;
};
