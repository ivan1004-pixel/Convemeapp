import { convemeApi } from '../api/convemeApi';
import type { LoginResponse } from '../interfaces/auth.interface';
import * as SecureStore from 'expo-secure-store'; // <-- Importamos la bóveda

export const loginService = async (username: string, password_raw: string) => {
    const query = `
    mutation Login($u: String!, $p: String!) {
        login(loginInput: { username: $u, password_raw: $p }) {
            token
            usuario {
                id_usuario
                rol_id
                username
                foto_perfil
            }
        }
    }
    `;

    const { data } = await convemeApi.post<LoginResponse>('', {
        query,
        variables: {
            u: username,
            p: password_raw,
        },
    });

    if (data.errors) throw new Error(data.errors[0].message);

    const loginData = data.data.login;

    if (loginData.token) {
        await SecureStore.setItemAsync('token', loginData.token);
    }

    return loginData;
};

export const logoutService = async () => {
    await SecureStore.deleteItemAsync('token');
};
