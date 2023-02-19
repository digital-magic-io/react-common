import {
  MutationFunction,
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

export type UseApiQueryOptions<TQueryFnData, TData> = Readonly<
  Omit<UseQueryOptions<TQueryFnData, RequestError, TData>, 'queryKey' | 'queryFn'>
> &
  Readonly<{
    queryFn: () => Promise<TQueryFnData> // QueryFunction<TQueryFnData, TQueryKey>
    queryKey: QueryKey
    action: string
  }>

export type UseApiMutationOptions<TData, TVariables> = Readonly<
  Omit<UseMutationOptions<TData, RequestError, TVariables>, 'mutationFn'>
> &
  Readonly<{
    mutationFn: MutationFunction<TData, TVariables>
    invalidateQueries?: ReadonlyArray<QueryKey>
    action: string
  }>

export const useApiQuery = <TQueryFnData = unknown, TData = TQueryFnData>({
  action,
  ...opts
}: UseApiQueryOptions<TQueryFnData, TData>): UseQueryResult<TData, RequestError> =>
  useQuery({
    ...opts,
    queryFn: async () => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        return await opts.queryFn()
      } catch (e) {
        // TODO: Remove it eventually
        // eslint-disable-next-line no-console
        console.error(e)
        throw toApiError(action)(e)
      }
    }
  })

export const useApiMutation = <TData, TVariables>({
  action,
  invalidateQueries,
  ...opts
}: UseApiMutationOptions<TData, TVariables>): UseMutationResult<TData, RequestError, TVariables> => {
  const queryClient = useQueryClient()

  return useMutation<TData, RequestError, TVariables>({
    ...opts,
    mutationFn: async (args: TVariables): Promise<TData> => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        return await opts.mutationFn(args)
      } catch (e) {
        // TODO: Remove it eventually
        // eslint-disable-next-line no-console
        console.error(e)
        throw toApiError(action)(e)
      }
    },
    // eslint-disable-next-line functional/functional-parameters
    onSuccess: (...args) => {
      invalidateQueries?.forEach((k) => void queryClient.invalidateQueries(k))
      return opts.onSuccess?.(...args)
    }
  })
}
