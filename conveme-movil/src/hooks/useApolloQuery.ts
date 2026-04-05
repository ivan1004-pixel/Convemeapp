/**
 * Hook genérico para queries Apollo con manejo de estado de carga
 * Wrapper sobre useQuery de Apollo con mejor DX
 */
import { useCallback } from 'react';
import {
  useQuery,
  useMutation,
  type DocumentNode,
  type QueryHookOptions,
  type MutationHookOptions,
  type TypedDocumentNode,
  type OperationVariables,
} from '@apollo/client';

/**
 * Wrapper sobre useQuery con mejor manejo de errores
 */
export function useApolloQuery<TData, TVariables extends OperationVariables = OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>,
) {
  const result = useQuery<TData, TVariables>(query, options);

  const errorMessage = result.error?.graphQLErrors?.[0]?.message
    ?? result.error?.networkError?.message
    ?? result.error?.message;

  return {
    ...result,
    errorMessage,
    isEmpty: !result.loading && !result.error && !result.data,
  };
}

/**
 * Wrapper sobre useMutation con mejor DX
 */
export function useApolloMutation<
  TData,
  TVariables extends OperationVariables = OperationVariables,
>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: MutationHookOptions<TData, TVariables>,
) {
  const [mutateFunction, result] = useMutation<TData, TVariables>(mutation, options);

  const execute = useCallback(
    async (variables?: TVariables) => {
      const res = await mutateFunction({ variables });
      if (res.errors?.length) {
        throw new Error(res.errors[0].message);
      }
      return res.data;
    },
    [mutateFunction],
  );

  const errorMessage = result.error?.graphQLErrors?.[0]?.message
    ?? result.error?.networkError?.message
    ?? result.error?.message;

  return {
    ...result,
    execute,
    errorMessage,
  };
}
