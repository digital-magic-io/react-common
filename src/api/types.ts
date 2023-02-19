import { AxiosRequestConfig, Method } from 'axios'
import { MaybeLazy } from '@digital-magic/ts-common-utils'
import { NonOptional } from '@digital-magic/ts-common-utils/lib/type'

export type RequestDefinition<T> = Readonly<{
  method: Method
  url: MaybeLazy<NonOptional<AxiosRequestConfig['url']>>
  params: AxiosRequestConfig['params']
  data: AxiosRequestConfig<T>['data']
}>

export type RequestContext = Readonly<{
  method: Method
  url: NonOptional<AxiosRequestConfig['url']>
  params: AxiosRequestConfig['params']
  data: AxiosRequestConfig<unknown>['data']
}>
