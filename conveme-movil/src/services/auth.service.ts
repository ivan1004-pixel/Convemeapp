import { convemeApi } from '../api/convemeApi';
import type { LoginResponse } from '../interfaces/auth.interface';
import * as SecureStore from 'expo-secure-store'; // <-- Importamos la bóveda

export const loginService = async (username: string, password_raw: string) => {
    const query = `
    mutation Login($username: String!, $password_raw: String!) {
        login(loginInput: { username: $username, password_raw: $password_raw }) {
            token
            usuario {
                id_usuario
                rol_id
                username
            }
        }
    }
    `;

    const { data } = await convemeApi.post<LoginResponse>('', {
        query,
        variables: { username, password_raw },
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
