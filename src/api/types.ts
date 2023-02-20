import { AxiosRequestConfig, Method } from 'axios'
import {
  QueryFunctionContext,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult
} from 'react-query'
import { MaybeLazy, NonOptional } from '@digital-magic/ts-common-utils'
import { RequestError } from './errors'
import { QueryKeyHashFunction } from 'react-query/types/core/types'

export type RequestDefinition = Readonly<{
  method: Method
  url: MaybeLazy<NonOptional<AxiosRequestConfig['url']>>
  params?: AxiosRequestConfig['params']
}>

export type RequestContext = Readonly<{
  method: Method
  url: NonOptional<AxiosRequestConfig['url']>
  params: AxiosRequestConfig['params']
  data: AxiosRequestConfig<unknown>['data']
}>

// eslint-disable-next-line functional/no-mixed-types
export type UseApiQueryAdditionalOptions<TData> = Readonly<{
  enabled?: boolean
  onSuccess?: (data: TData) => void
  onError?: (err: Readonly<RequestError>) => void
  suspense?: boolean
  keepPreviousData?: boolean
  optimisticResults?: boolean
}>

export type UseApiMutationAdditionalOptions<TData, TVariables, TContext = unknown> = Readonly<{
  onMutate?: (variables: TVariables) => Promise<TContext | undefined> | TContext | undefined
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => Promise<unknown> | void
  onError?: (
    error: Readonly<RequestError>,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<unknown> | void
  onSettled?: (
    data: TData | undefined,
    error: Readonly<RequestError> | null,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<unknown> | void
}>

export type UseApiQueryOptions<TQueryFnData, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> = Readonly<
  Omit<UseQueryOptions<TQueryFnData, RequestError, TData, TQueryKey>, 'queryKey' | 'queryFn' | 'queryKeyHashFn'>
> &
  Readonly<{
    request: RequestDefinition
    queryFn: (request: RequestDefinition, context: Readonly<QueryFunctionContext<TQueryKey>>) => Promise<TQueryFnData>
    queryKey: TQueryKey
    queryKeyHashFn?: QueryKeyHashFunction<TQueryKey>
  }>

export type UseApiMutationOptions<TData, TVariables, TContext = unknown> = Readonly<
  Omit<UseMutationOptions<TData, RequestError, TVariables, TContext>, 'mutationFn'>
> &
  Readonly<{
    request: RequestDefinition
    mutationFn: (request: RequestDefinition, variables: TVariables) => Promise<TData>
    invalidateQueries?: ReadonlyArray<QueryKey>
  }>

export type UseApiQueryResult<TData> = UseQueryResult<TData, RequestError>
export type UseApiMutationResult<TData, TVariables> = UseMutationResult<TData, RequestError, TVariables>
