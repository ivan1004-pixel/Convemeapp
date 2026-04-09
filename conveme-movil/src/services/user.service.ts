import { convemeApi } from '../api/convemeApi';

// 1. Crear un nuevo usuario
export const createUserService = async (username: string, password_raw: string, rol_id: number, foto_perfil?: string) => {
    const query = `
    mutation CreateUsuario($username: String!, $password_raw: String!, $rol_id: Int!, $foto_perfil: String) {
        createUsuario(createUsuarioInput: {
            username: $username,
            password_raw: $password_raw,
            rol_id: $rol_id,
            foto_perfil: $foto_perfil
        }) {
            id_usuario
            username
            foto_perfil
        }
    }
    `;

    const { data } = await convemeApi.post('', {
        query,
        variables: { username, password_raw, rol_id, foto_perfil },
    });

    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.createUsuario;
};

// 2. Obtener el perfil de un usuario
export const getUsuarioPerfil = async (id_usuario: number) => {
    const query = `
    query GetPerfil($id: Int!) {
        usuario(id_usuario: $id) {
            id_usuario
            username
            rol_id
            activo
            created_at
            foto_perfil
        }
    }
    `;

    const { data } = await convemeApi.post('', {
        query,
        variables: { id: id_usuario },
    });

    if (data.errors) throw new Error(data.errors[0].message);
    return data.data.usuario;
};

// 3. Actualizar el perfil de un usuario
export const updateUserService = async (
    id_usuario: number,
    username?: string,
    password_raw?: string,
    rol_id?: number,
    foto_perfil?: string,
    push_token?: string
) => {
    const query = `
    mutation UpdateUsuario($updateUsuarioInput: UpdateUsuarioInput!) {
        updateUsuario(updateUsuarioInput: $updateUsuarioInput) {
            id_usuario
            username
            rol_id
            activo
            foto_perfil
            push_token
        }
    }
    `;

    const input: any = { id_usuario };
    if (username) input.username = username;
    if (password_raw) input.password_raw = password_raw;
    if (rol_id) input.rol_id = rol_id;
    if (foto_perfil) input.foto_perfil = foto_perfil;
    if (push_token) input.push_token = push_token;

    const { data } = await convemeApi.post('', {
        query,
        variables: { updateUsuarioInput: input },
    });

    if (data.errors) {
        console.log('updateUsuario errors:', JSON.stringify(data.errors, null, 2));
        const error = data.errors[0];
        let msg = error.message;

        // Si el error viene de ValidationPipe de NestJS
        if (error.extensions?.originalError) {
            const original = error.extensions.originalError as any;
            if (Array.isArray(original.message)) {
                msg = original.message.join(' | ');
            } else if (original.message) {
                msg = original.message;
            }
        }
        
        // Traducir errores técnicos específicos
        if (msg.includes('Cannot return null')) {
            throw new Error('¡UPS! HUBO UN PROBLEMA AL ACTUALIZAR TU PERFIL. INTENTA DE NUEVO.');
        }
        
        throw new Error(msg.toUpperCase());
    }
    return data.data.updateUsuario;
};

// 4. Listar todos los usuarios con paginación
export const getUsuarios = async (skip = 0, take = 20) => {
    const query = `
    query GetUsuarios($skip: Int, $take: Int) {
        usuarios(skip: $skip, take: $take) {
            id_usuario
            username
            rol_id
            activo
            foto_perfil
            rol { nombre }
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
