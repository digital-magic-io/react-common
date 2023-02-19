import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult
} from 'react-query'
import { RequestError, toApiError } from './errors'
import { QueryFunctionContext } from 'react-query/types/core/types'
import { RequestConfig } from './types'
import { reqCfgToErrReqCfg } from './utils'

export type UseApiQueryAdditionalOptions<TQueryFnData, TData, TQueryKey extends QueryKey = QueryKey> = Readonly<
  Omit<UseQueryOptions<TQueryFnData, RequestError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
>

export type UseApiMutationAdditionalOptions<TData, TVariables, TContext = unknown> = Readonly<
  Omit<UseMutationOptions<TData, RequestError, TVariables, TContext>, 'mutationFn'>
>

export type UseApiQueryOptions<
  TQueryFnData,
  TData,
  TQueryKey extends QueryKey = QueryKey
> = UseApiQueryAdditionalOptions<TQueryFnData, TData, TQueryKey> &
  Readonly<{
    queryFn: (config: RequestConfig<TData>, context: Readonly<QueryFunctionContext<TQueryKey>>) => Promise<TQueryFnData>
    queryKey: TQueryKey
    config: RequestConfig<TData>
  }>

export type UseApiMutationOptions<TData, TVariables, TContext = unknown> = UseApiMutationAdditionalOptions<
  TData,
  TVariables,
  TContext
> &
  Readonly<{
    mutationFn: (config: RequestConfig<TData>, variables: TVariables) => Promise<TData>
    invalidateQueries?: ReadonlyArray<QueryKey>
    config: RequestConfig<TData>
  }>

/**
 * Query request hook (this request result may be cached because we don't expect any data mutations with it)
 *
 * @param action name of the action
 * @param opts request options
 */
export const useApiQuery = <TQueryFnData = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>({
  ...opts
}: UseApiQueryOptions<TQueryFnData, TData, TQueryKey>): UseQueryResult<TData, RequestError> =>
  useQuery({
    ...opts,
    queryFn: async (context) => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        return await opts.queryFn(opts.config, context)
      } catch (e) {
        // TODO: Remove it eventually
        // eslint-disable-next-line no-console
        console.error(e)
        throw toApiError(reqCfgToErrReqCfg(opts.config))(e)
      }
    }
  })

/**
 * Mutation request hook (mutates data via API and can't be cached)
 *
 * @param action name of the action
 * @param invalidateQueries list of QueryKeys that must be invalidated on success
 * @param opts request options
 */
export const useApiMutation = <TData, TVariables, TContext = unknown>({
  invalidateQueries,
  ...opts
}: UseApiMutationOptions<TData, TVariables, TContext>): UseMutationResult<TData, RequestError, TVariables> => {
  const queryClient = useQueryClient()

  return useMutation<TData, RequestError, TVariables, TContext>({
    ...opts,
    mutationFn: async (args) => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        return await opts.mutationFn(opts.config, args)
      } catch (e) {
        // TODO: Remove it eventually
        // eslint-disable-next-line no-console
        console.error(e)
        throw toApiError(reqCfgToErrReqCfg(opts.config))(e)
      }
    },
    // eslint-disable-next-line functional/functional-parameters
    onSuccess: (...args) => {
      invalidateQueries?.forEach((k) => void queryClient.invalidateQueries(k))
      return opts.onSuccess?.(...args)
    }
  })
}
