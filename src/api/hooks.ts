import { QueryKey, useMutation, useQuery, useQueryClient } from 'react-query'
import { UseApiMutationOptions, UseApiMutationResult, UseApiQueryOptions, UseApiQueryResult } from './types'
import { reqDefToReqInfo } from './utils'
import { createUseApiError } from './errors'

/**
 * Query request hook (this request result may be cached because we don't expect any data mutations with it)
 *
 * @param action name of the action
 * @param opts request options
 */
export const useApiQuery = <TQueryFnData = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>({
  ...opts
}: UseApiQueryOptions<TQueryFnData, TData, TQueryKey>): UseApiQueryResult<TData> =>
  useQuery({
    ...opts,
    queryFn: async (context) => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        return await opts.queryFn(opts.request, context)
      } catch (e) {
        // TODO: Remove it eventually
        // eslint-disable-next-line no-console
        console.error(e)
        throw createUseApiError(reqDefToReqInfo(opts.request, undefined))(e)
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
}: UseApiMutationOptions<TData, TVariables, TContext>): UseApiMutationResult<TData, TVariables> => {
  const queryClient = useQueryClient()

  return useMutation({
    ...opts,
    mutationFn: async (args) => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        return await opts.mutationFn(opts.request, args)
      } catch (e) {
        // TODO: Remove it eventually
        // eslint-disable-next-line no-console
        console.error(e)
        //throw toApiError(reqDefToReqInfo(opts.request, args))(e)
        throw createUseApiError(reqDefToReqInfo(opts.request, args))(e)
      }
    },
    // eslint-disable-next-line functional/functional-parameters
    onSuccess: (...args) => {
      invalidateQueries?.forEach((k) => void queryClient.invalidateQueries(k))
      return opts.onSuccess?.(...args)
    }
  })
}
