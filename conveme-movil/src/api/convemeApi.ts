import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store'; // La bóveda segura de Expo


export const API_URL =
Platform.OS === 'android'
? 'https://api-conveme.utvt.cloud:3000/graphql'
: 'http://localhost:3000/graphql';

export const convemeApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

convemeApi.interceptors.request.use(async (config) => {
    // Cambiamos localStorage por SecureStore
    const token = await SecureStore.getItemAsync('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
