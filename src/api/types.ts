import * as z from 'zod'
import { AxiosRequestConfig } from 'axios'
import { MaybeLazy } from '@digital-magic/ts-common-utils'

export const HttpMethod = z.enum(['get', 'post', 'put', 'patch', 'delete'])
export type HttpMethod = z.infer<typeof HttpMethod>

export type ErrorRequestConfig = Readonly<AxiosRequestConfig<unknown>>

export type RequestConfig<Request> = Readonly<
  Omit<AxiosRequestConfig<Request>, 'method' | 'url'> & {
    url: MaybeLazy<string>
    method: HttpMethod
  }
>
