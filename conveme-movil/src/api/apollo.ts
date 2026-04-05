/**
 * Apollo Client configurado para ConVeMe
 * - Autenticación JWT
 * - Manejo de errores
 * - Cache in-memory
 * - Sin modificar el backend
 */

import {
  ApolloClient,
  InMemoryCache,
  type NormalizedCacheObject,
} from '@apollo/client';
import { buildApolloLinks } from './links';

const API_URL = 'https://api-conveme.utvt.cloud:3000/graphql';

let apolloClientInstance: ApolloClient<NormalizedCacheObject> | null = null;

export function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          eventos: { merge: false },
          productos: { merge: false },
          ventas: { merge: false },
        },
      },
    },
  });

  return new ApolloClient({
    link: buildApolloLinks(API_URL),
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
}

/** Singleton del cliente Apollo */
export function getApolloClient(): ApolloClient<NormalizedCacheObject> {
  if (!apolloClientInstance) {
    apolloClientInstance = createApolloClient();
  }
  return apolloClientInstance;
}

export const apolloClient = getApolloClient();
