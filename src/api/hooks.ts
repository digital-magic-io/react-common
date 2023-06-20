import {
  QueriesOptions,
  QueriesResults,
  QueryFunction,
  QueryKey,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import {
  UseApiMutationOptions,
  UseApiMutationResult,
  UseApiQueryOptions,
  UseApiQueryOptionsHomogenous,
  UseApiQueryResult
} from './types'
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

const queryFunction =
  <ApiErrorPayloadType, TQueryFnData, TData, TQueryKey extends QueryKey = QueryKey>(
    opts: UseApiQueryOptions<ApiErrorPayloadType, TQueryFnData, TData, TQueryKey>
  ): QueryFunction<TQueryFnData, TQueryKey> =>
  async (context) => {
    // eslint-disable-next-line functional/no-try-statements
    try {
      return await opts.queryFn(context)
    } catch (e) {
      throw buildRequestError<ApiErrorPayloadType>(e, context)
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
    queryFn: queryFunction(opts)
  })

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useApiHomogenousQueries = <ApiErrorPayloadType, TQueryFnData = unknown, TData = TQueryFnData>(
  optionsList: UseApiQueryOptionsHomogenous<ApiErrorPayloadType, TQueryFnData, TData>
): QueriesResults<Array<TQueryFnData>> =>
  useQueries({
    queries: optionsList.map((opts) => ({
      ...opts,
      queryFn: queryFunction<ApiErrorPayloadType, TQueryFnData, TData>(opts)
    })) as QueriesOptions<Array<TQueryFnData>>
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
