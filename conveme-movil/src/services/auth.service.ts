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
            }
        }
    }
    `;

    const { data } = await convemeApi.post<LoginResponse>('', {
        query,
        variables: { 
            u: username,
            p: password_raw
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

export const updatePushTokenService = async (push_token: string) => {
    const query = `
    mutation UpdatePushToken($push_token: String!) {
        updatePushToken(push_token: $push_token) {
            id_usuario
            push_token
        }
    }
    `;

    try {
        const { data } = await convemeApi.post<any>('', {
            query,
            variables: { push_token },
        });
        if (data.errors) console.error('Error updating push token:', data.errors[0].message);
        return data.data?.updatePushToken;
    } catch (error) {
        console.error('Failed to update push token:', error);
    }
};
