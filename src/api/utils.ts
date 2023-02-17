import * as z from 'zod'
import { HttpMethod } from './types'
import axios, { AxiosRequestConfig } from 'axios'
import { Lazy } from '@digital-magic/ts-common-utils'
import { invalidRequestError, invalidResponseError } from './errors'

type RequestConfig<Response> = Readonly<
  Omit<AxiosRequestConfig<Response>, 'method' | 'url'> & {
    url: string | Lazy<string>
    method: HttpMethod
  }
>

type RequestPayloadConfig<Request, RequestSchema extends z.ZodType<Request>> = Readonly<{
  bodySchema: RequestSchema
}>

type ResponsePayloadConfig<Response, ResponseSchema extends z.ZodType<Response>> = Readonly<{
  responseSchema: ResponseSchema
}>

const evaluate = (value: string | Lazy<string>): string => (typeof value === 'string' ? value : value())

const verifyRequestPayload = <Request, RequestSchema extends z.ZodType<Request>, Response>(
  opts: RequestConfig<Response> & RequestPayloadConfig<Request, RequestSchema>
): Promise<Request> => {
  const validated = opts.bodySchema.safeParse(opts.data)
  if (!validated.success) {
    return Promise.reject(invalidRequestError({ ...opts, url: evaluate(opts.url) })(validated.error))
  } else {
    return Promise.resolve(validated.data)
  }
}

const verifyResponsePayload =
  <Response, ResponseSchema extends z.ZodType<Response>>(
    opts: RequestConfig<Response> & ResponsePayloadConfig<Response, ResponseSchema>
  ) =>
  (response: Response): Promise<Response> => {
    const validated = opts.responseSchema.safeParse(response)
    if (!validated.success) {
      return Promise.reject(invalidResponseError({ ...opts, url: evaluate(opts.url) })(validated.error))
    } else {
      return Promise.resolve(validated.data)
    }
  }

/**
 * Performs Axios request with some additional type guards.
 *
 * @param url request URL or lazy function that returns such URL
 * @param opts other request options
 */
export const doRequest = <Data>({ url, ...opts }: RequestConfig<Data>): Promise<Data> =>
  axios({
    validateStatus: (status) => status < 300,
    url: evaluate(url),
    ...opts
  })

/**
 * Performs request with request body validation.
 *
 * @param opts request & request body options
 */
export const sendOnly = <Request, RequestSchema extends z.ZodType<Request>>(
  opts: RequestConfig<never> & RequestPayloadConfig<Request, RequestSchema>
): Promise<void> => verifyRequestPayload(opts).then(() => doRequest(opts))

export const receiveOnly = <Response, ResponseSchema extends z.ZodType<Response>>(
  opts: RequestConfig<Response> & ResponsePayloadConfig<Response, ResponseSchema>
): Promise<Response> => doRequest(opts).then(verifyResponsePayload(opts))

export const sendAndReceive = <
  Request,
  RequestSchema extends z.ZodType<Request>,
  Response,
  ResponseSchema extends z.ZodType<Response>
>(
  opts: RequestConfig<Response> &
    RequestPayloadConfig<Request, RequestSchema> &
    ResponsePayloadConfig<Response, ResponseSchema>
): Promise<Response> =>
  verifyRequestPayload(opts)
    .then(() => doRequest(opts))
    .then(verifyResponsePayload(opts))
