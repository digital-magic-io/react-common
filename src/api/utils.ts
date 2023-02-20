/* eslint-disable functional/prefer-immutable-types */
import * as z from 'zod'
import { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { evaluate } from '@digital-magic/ts-common-utils'
import { type RequestDefinition, type RequestContext } from './types'
import { invalidRequestError, invalidResponseError } from './errors'

type RequestConfig<RequestType> = Readonly<
  Omit<AxiosRequestConfig<RequestType>, 'method' | 'url'> & {
    url: RequestDefinition['url']
    method: RequestDefinition['method']
  }
>

type RequestPayloadConfig<RequestType, RequestSchema extends z.ZodType<RequestType>> = Readonly<{
  requestSchema: RequestSchema
}>

type ResponsePayloadConfig<ResponseType, ResponseSchema extends z.ZodType<ResponseType>> = Readonly<{
  responseSchema: ResponseSchema
}>

const reqCfgToReqInfo = (config: RequestConfig<unknown>): RequestContext => ({
  url: evaluate(config.url),
  method: config.method,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  params: config.params,
  data: config.data
})

export const reqDefToReqInfo = (config: RequestDefinition, data: unknown): RequestContext => ({
  url: evaluate(config.url),
  method: config.method,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  params: config.params,
  data
})

const verifyRequestPayload = <RequestType, RequestSchema extends z.ZodType<RequestType>, ResponseType>(
  opts: RequestConfig<ResponseType> & RequestPayloadConfig<RequestType, RequestSchema>
): Promise<RequestType> => {
  const validated = opts.requestSchema.safeParse(opts.data)
  if (!validated.success) {
    return Promise.reject(invalidRequestError(reqCfgToReqInfo(opts))(validated.error))
  } else {
    return Promise.resolve(validated.data)
  }
}

const verifyResponsePayload = <ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
  opts: RequestConfig<unknown> & ResponsePayloadConfig<ResponseType, ResponseSchema>,
  response: ResponseType
): Promise<ResponseType> => {
  const validated = opts.responseSchema.safeParse(response)
  if (!validated.success) {
    return Promise.reject(invalidResponseError(reqCfgToReqInfo(opts))(validated.error))
  } else {
    return Promise.resolve(validated.data)
  }
}

/**
 * Performs Axios request.
 *
 */
export const doRequest =
  (axios: AxiosInstance) =>
  <RequestType, ResponseType>(opts: RequestConfig<RequestType>): Promise<AxiosResponse<ResponseType, RequestType>> =>
    axios({
      validateStatus: (status) => status < 300,
      ...opts,
      url: evaluate(opts.url)
    })

/**
 * Performs a request that doesn't return a response with request body validation.
 *
 * @param axios AxiosInstance
 */
export const sendOnly =
  (axios: AxiosInstance) =>
  <RequestType, RequestSchema extends z.ZodType<RequestType>>(
    opts: RequestConfig<RequestType> & RequestPayloadConfig<RequestType, RequestSchema>
  ): Promise<void> =>
    verifyRequestPayload(opts).then(() => void doRequest(axios)(opts))

/**
 * Performs a request without a request body with response body validation.
 *
 * @param axios AxiosInstance
 */
export const receiveOnly =
  (axios: AxiosInstance) =>
  <ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
    opts: RequestConfig<undefined> & ResponsePayloadConfig<ResponseType, ResponseSchema>
  ): Promise<ResponseType> =>
    doRequest(axios)<undefined, ResponseType>(opts).then((result) => verifyResponsePayload(opts, result.data))

/**
 * Performs a request with request and response body validation.
 *
 * @param axios AxiosInstance
 */
export const sendAndReceive =
  (axios: AxiosInstance) =>
  <
    RequestType,
    RequestSchema extends z.ZodType<RequestType>,
    ResponseType,
    ResponseSchema extends z.ZodType<ResponseType>
  >(
    opts: RequestConfig<RequestType> &
      RequestPayloadConfig<RequestType, RequestSchema> &
      ResponsePayloadConfig<ResponseType, ResponseSchema>
  ): Promise<ResponseType> =>
    verifyRequestPayload(opts)
      .then(() => doRequest(axios)<RequestType, ResponseType>(opts))
      .then((result) => verifyResponsePayload(opts, result.data))
