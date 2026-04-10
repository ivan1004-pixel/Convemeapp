import { convemeApi } from '../api/convemeApi';
import type { LoginResponse } from '../interfaces/auth.interface';

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

    
    try {
        const response = await convemeApi.post('', {
            query,
            variables: { 
                u: username,
                p: password_raw
            },
        });

        
        const { data } = response;

        if (data.errors) {
            
            throw new Error(data.errors[0].message);
        }
        return data.data.login;
    } catch (error: any) {
        
        throw error;
    }
};
