import { convemeApi } from '../api/convemeApi';

// 1. Obtener todos los vendedores (Paginado 20 en 20)
export const getVendedores = async (skip = 0, take = 20) => {
    const query = `
    query GetVendedores($skip: Int, $take: Int) {
        vendedores(skip: $skip, take: $take) {
            id_vendedor
            nombre_completo
            email
            telefono
            instagram_handle
            comision_fija_menudeo
            comision_fija_mayoreo
            meta_ventas_mensual
            usuario {
                foto_perfil
            }
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
    const { data } = await convemeApi.post('', { 
        query, 
        variables: { skip, take } 
    });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.vendedores;
};

// 2. Crear vendedor
export const createVendedor = async (input: any) => {
    const query = `
    mutation CreateVendedor($input: CreateVendedorInput!) {
        createVendedor(createVendedorInput: $input) {
            id_vendedor
            nombre_completo
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { input } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.createVendedor;
};

// 3. Editar vendedor
export const updateVendedor = async (input: any) => {
    const query = `
    mutation UpdateVendedor($input: UpdateVendedorInput!) {
        updateVendedor(updateVendedorInput: $input) {
            id_vendedor
            nombre_completo
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { input } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.updateVendedor;
};

// 4. Borrar vendedor
export const deleteVendedor = async (id: number) => {
    const query = `
    mutation RemoveVendedor($id: Int!) {
        removeVendedor(id_vendedor: $id) {
            id_vendedor
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { id } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.removeVendedor;
};

// 5. Obtener usuarios (Paginado para el selector al crear vendedor)
export const getUsuariosParaSelect = async (skip = 0, take = 50) => {
    const query = `
    query GetUsuarios($skip: Int, $take: Int) {
        usuarios(skip: $skip, take: $take) {
            id_usuario
            username
            rol {            # 🟢 AQUÍ ESTÁ LA MAGIA QUE FALTABA
                id_rol
                nombre
            }
        }
    }
    `;
    const { data } = await convemeApi.post('', {
        query,
        variables: { skip, take }
    });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.usuarios;
};

// 6. Obtener Vendedor por ID de Usuario (Actualizado para el Perfil)
export const getVendedorByUsuarioId = async (usuario_id: number) => {
    const query = `
    query VendedorByUsuario($usuario_id: Int!) {
        vendedorByUsuario(usuario_id: $usuario_id) {
            id_vendedor
            nombre_completo
            email
            telefono
            instagram_handle
            comision_fija_menudeo
            comision_fija_mayoreo
            meta_ventas_mensual
            usuario {
                foto_perfil
            }
            escuela {
                nombre
            }
            municipio {
                nombre
                estado {
                    nombre
                }
            }
        }
    }
    `;
    const { data } = await convemeApi.post('', { query, variables: { usuario_id } });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.vendedorByUsuario;
};
