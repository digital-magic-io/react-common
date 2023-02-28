import { QueryKey, useMutation, useQuery, useQueryClient } from 'react-query'
import { UseApiMutationOptions, UseApiMutationResult, UseApiQueryOptions, UseApiQueryResult } from './types'
import { unknownError } from '../errors'
import { isRequestError, RequestError } from './errors'

const buildRequestError = <ApiErrorPayloadType>(e: unknown, context: unknown): RequestError<ApiErrorPayloadType> => {
  if (e instanceof Error) {
    return unknownError(e, context)
  } else {
    if (isRequestError<ApiErrorPayloadType>(e)) {
      return e
    } else {
      return unknownError(e, context)
    }
  }
}

/**
 * Query request hook (this request result may be cached because we don't expect any data mutations with it)
 */
export const useApiQuery = <
  ApiErrorPayloadType,
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>({
  ...opts
}: UseApiQueryOptions<ApiErrorPayloadType, TQueryFnData, TData, TQueryKey>): UseApiQueryResult<
  ApiErrorPayloadType,
  TData
> =>
  useQuery({
    ...opts,
    queryFn: async (context) => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        return await opts.queryFn(context)
      } catch (e) {
        throw buildRequestError<ApiErrorPayloadType>(e, context)
      }
    }
  })

/**
 * Mutation request hook (mutates data via API and can't be cached)
 */
export const useApiMutation = <ApiErrorPayloadType, TData, TVariables, TContext = unknown>({
  invalidateQueries,
  ...opts
}: UseApiMutationOptions<ApiErrorPayloadType, TData, TVariables, TContext>): UseApiMutationResult<
  ApiErrorPayloadType,
  TData,
  TVariables
> => {
  const queryClient = useQueryClient()

  return useMutation({
    ...opts,
    mutationFn: async (args) => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        return await opts.mutationFn(args)
      } catch (e) {
        throw buildRequestError(e, args)
      }
    },
    // eslint-disable-next-line functional/functional-parameters
    onSuccess: (...args) => {
      invalidateQueries?.forEach((k) => void queryClient.invalidateQueries(k))
      return opts.onSuccess?.(...args)
    }
  })
}
