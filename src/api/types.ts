import { type AxiosRequestConfig, type Method } from 'axios'
import {
  QueriesOptions,
  QueryFunctionContext,
  QueryKey,
  QueryKeyHashFunction,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query'
import { Handler, MaybeLazy, NonOptional } from '@digital-magic/ts-common-utils'
import { ClientError } from '../errors'
import { type RequestError } from './errors'

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
export type UseApiQueryAdditionalOptions<ApiErrorPayloadType, TData> = Readonly<{
  enabled?: boolean
  onSuccess?: (data: TData) => void
  onError?: (err: Readonly<RequestError<ApiErrorPayloadType>>) => void
  suspense?: boolean
  keepPreviousData?: boolean
  optimisticResults?: boolean
}>

export type UseApiMutationAdditionalOptions<ApiErrorPayloadType, TData, TVariables, TContext = unknown> = Readonly<{
  onMutate?: (variables: TVariables) => Promise<TContext | undefined> | TContext | undefined
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => Promise<unknown> | void
  onError?: (
    error: Readonly<RequestError<ApiErrorPayloadType>>,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<unknown> | void
  onSettled?: (
    data: TData | undefined,
    error: Readonly<RequestError<ApiErrorPayloadType>> | null,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<unknown> | void
}>

export type UseApiQueryOptions<
  ApiErrorPayloadType,
  TQueryFnData,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> = Readonly<
  Omit<
    UseQueryOptions<TQueryFnData, RequestError<ApiErrorPayloadType>, TData, TQueryKey>,
    'queryKey' | 'queryFn' | 'queryKeyHashFn'
  >
> &
  Readonly<{
    queryFn: (context: Readonly<QueryFunctionContext<TQueryKey>>) => Promise<TQueryFnData>
    queryKey: TQueryKey
    queryKeyHashFn?: QueryKeyHashFunction<TQueryKey>
  }>

export type UseApiQueryOptionsHomogenous<ApiErrorPayloadType, TQueryFnData, TData = TQueryFnData> = Readonly<
  Omit<
    QueriesOptions<Array<UseQueryOptions<TQueryFnData, RequestError<ApiErrorPayloadType>, TData>>>,
    'queryKey' | 'queryFn' | 'queryKeyHashFn'
  >
> &
  Readonly<{
    queryFn: () => Promise<TQueryFnData>
    queryKey: QueryKey
    queryKeyHashFn?: QueryKeyHashFunction<QueryKey>
  }>

export type UseApiMutationOptions<ApiErrorPayloadType, TData, TVariables, TContext = unknown> = Readonly<
  Omit<UseMutationOptions<TData, RequestError<ApiErrorPayloadType>, TVariables, TContext>, 'mutationFn'>
> &
  Readonly<{
    mutationFn: (variables: TVariables) => Promise<TData>
    invalidateQueries?: ReadonlyArray<QueryKey>
  }>

export type UseApiQueryResult<ApiErrorPayloadType, TData> = UseQueryResult<TData, RequestError<ApiErrorPayloadType>>
export type UseApiMutationResult<ApiErrorPayloadType, TData, TVariables> = UseMutationResult<
  TData,
  RequestError<ApiErrorPayloadType>,
  TVariables
>
export type GenericRequestErrorHandler<ApiErrorPayloadType> = Handler<RequestError<ApiErrorPayloadType>>
export type GenericRequestErrorMapper<ApiErrorPayloadType> = (
  err: Readonly<RequestError<ApiErrorPayloadType>>
) => ClientError
