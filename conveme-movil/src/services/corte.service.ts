import { convemeApi } from '../api/convemeApi';

// 👇 Ahora acepta el buscador y paginación
export const getCortes = async (search: string = '', skip = 0, take = 20) => {
    const query = `
    query GetCortesVendedor($search: String, $skip: Int, $take: Int) {
        cortesVendedor(search: $search, skip: $skip, take: $take) {
            id_corte
            fecha_corte
            dinero_esperado
            dinero_total_entregado
            diferencia_corte
            observaciones
            vendedor {
                id_vendedor
                nombre_completo
            }
            asignacion {
                id_asignacion
            }
            detalles {
                id_det_corte
                cantidad_vendida
                cantidad_devuelta
                merma_reportada
                producto {
                    id_producto
                    nombre
                    precio_unitario
                }
            }
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { search, skip, take } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.cortesVendedor;
};

export const createCorte = async (input: any) => {
    const query = `
    mutation CreateCorteVendedor($input: CreateCorteVendedorInput!) {
        createCorteVendedor(createCorteVendedorInput: $input) {
            id_corte
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { input } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.createCorteVendedor;
};

export const updateCorte = async (input: any) => {
    const query = `
    mutation UpdateCorteVendedor($input: UpdateCorteVendedorInput!) {
        updateCorteVendedor(updateCorteVendedorInput: $input) {
            id_corte
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { input } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.updateCorteVendedor;
};

export const deleteCorte = async (id: number) => {
    const query = `
    mutation RemoveCorteVendedor($id: Int!) {
        removeCorteVendedor(id_corte: $id)
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { id } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.removeCorteVendedor;
};

// 👇 AHORA ES UNA CONSULTA DIRECTA Y SEGURA A LA BASE DE DATOS
export const getCortesPorVendedor = async (vendedor_id: number) => {
    const query = `
    query GetCortesPorVendedor($vendedor_id: Int!) {
        cortesPorVendedor(vendedor_id: $vendedor_id) {
            id_corte
            fecha_corte
            dinero_esperado
            dinero_total_entregado
            diferencia_corte
            observaciones
            vendedor {
                id_vendedor
                nombre_completo
            }
            asignacion {
                id_asignacion
            }
            detalles {
                id_det_corte
                cantidad_vendida
                cantidad_devuelta
                merma_reportada
                producto {
                    id_producto
                    nombre
                    precio_unitario
                }
            }
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { vendedor_id } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.cortesPorVendedor;
};
