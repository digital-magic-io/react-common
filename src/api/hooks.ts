import { QueryKey, useQuery, UseQueryOptions, UseQueryResult } from 'react-query'
import { RequestError, toApiError } from './errors'

export type UseApiQueryOptions<TQueryFnData, TData> = Readonly<
  Omit<UseQueryOptions<TQueryFnData, RequestError, TData>, 'queryKey' | 'queryFn'>
> &
  Readonly<{
    queryFn: () => Promise<TQueryFnData> // QueryFunction<TQueryFnData, TQueryKey>
    queryKey: QueryKey
    action: string
  }>

export type UseApiQueryResult<TData> = UseQueryResult<TData, RequestError>

export const useApiQuery = <TQueryFnData = unknown, TData = TQueryFnData>(
  opts: UseApiQueryOptions<TQueryFnData, TData>
): UseApiQueryResult<TData> =>
  useQuery({
    ...opts,
    queryFn: async () => {
      // eslint-disable-next-line functional/no-try-statements
      try {
        return await opts.queryFn()
      } catch (e) {
        throw toApiError(opts.action)
      }
    }
  })
