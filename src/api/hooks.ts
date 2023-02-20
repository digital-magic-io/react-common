import { QueryKey, useMutation, useQuery, useQueryClient } from 'react-query'
import { UseApiMutationOptions, UseApiMutationResult, UseApiQueryOptions, UseApiQueryResult } from './types'
import {
  ApiError,
  CommunicationError,
  HttpError,
  InvalidRequestError,
  InvalidResponseError,
  RequestError
} from './errors'
import { UnknownError, unknownError } from '../errors'

const buildRequestError = (e: unknown, context: unknown): RequestError => {
  if (e instanceof Error) {
    if (
      [UnknownError, InvalidRequestError, InvalidResponseError, CommunicationError, HttpError, ApiError].includes(
        e.name
      )
    ) {
      return e as RequestError
    } else {
      return unknownError(e, context)
    }
  } else {
    return unknownError(e, context)
  }
}

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
        return await opts.queryFn(context)
      } catch (e) {
        throw buildRequestError(e, context)
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
