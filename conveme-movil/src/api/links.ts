/**
 * Apollo Links para autenticación y manejo de errores
 * Intercepta requests y añade el token JWT automáticamente
 */

import { ApolloLink, HttpLink, Observable, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import * as SecureStore from 'expo-secure-store';

/** Link de autenticación con soporte async para leer el token de SecureStore */
export const createAuthLinkAsync = (): ApolloLink =>
  new ApolloLink((operation, forward) =>
    new Observable((observer) => {
      SecureStore.getItemAsync('token')
        .then((token) => {
          if (token) {
            operation.setContext(({ headers = {} }: { headers: Record<string, string> }) => ({
              headers: {
                ...headers,
                Authorization: `Bearer ${token}`,
              },
            }));
          }
          forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
        })
        .catch((err: unknown) => observer.error(err));
    }),
  );

/** Link de manejo de errores */
const createErrorLink = () =>
  onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.warn(
          `[GraphQL error] Operation: ${operation.operationName}, Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${JSON.stringify(path)}`,
        );
        // Si el token expiró, limpiamos el storage
        if (
          message.toLowerCase().includes('unauthorized') ||
          message.toLowerCase().includes('unauthenticated') ||
          message.toLowerCase().includes('jwt expired')
        ) {
          SecureStore.deleteItemAsync('token').catch(console.error);
        }
      });
    }
    if (networkError) {
      console.warn(`[Network error] ${networkError.message}`);
    }
  });

/** Construye la cadena completa de links de Apollo */
export function buildApolloLinks(apiUrl: string): ApolloLink {
  const httpLink = new HttpLink({
    uri: apiUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return from([createErrorLink(), createAuthLinkAsync(), httpLink]);
}
