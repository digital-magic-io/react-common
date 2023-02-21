/* eslint-disable functional/prefer-immutable-types */
import * as z from 'zod'
import { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { evaluate } from '@digital-magic/ts-common-utils'
import { type RequestDefinition, type RequestContext } from './types'
import { invalidRequestError, invalidResponseError, type RequestErrorBuilder } from './errors'

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

const reqDefToReqInfo = (config: RequestDefinition, data: unknown): RequestContext => ({
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

const doRequest =
  (axios: AxiosInstance, buildError: RequestErrorBuilder) =>
  <RequestType, ResponseType>(opts: RequestConfig<RequestType>): Promise<AxiosResponse<ResponseType, RequestType>> =>
    axios({
      validateStatus: (status) => status < 300,
      ...opts,
      url: evaluate(opts.url)
    }).catch((e) => {
      return Promise.reject(buildError(reqDefToReqInfo(opts, opts.data))(e))
    })

/**
 * Performs a request without a request body that doesn't return a response
 */
export const doCallOnly =
  (axios: AxiosInstance, buildError: RequestErrorBuilder) =>
  (opts: RequestConfig<void>): Promise<void> =>
    doRequest(axios, buildError)(opts).then(() => Promise.resolve())

/**
 * Performs a request that doesn't return a response with request body validation.
 */
export const doSendOnly =
  (axios: AxiosInstance, buildError: RequestErrorBuilder) =>
  <RequestType, RequestSchema extends z.ZodType<RequestType>>(
    opts: RequestConfig<RequestType> & RequestPayloadConfig<RequestType, RequestSchema>
  ): Promise<void> =>
    verifyRequestPayload(opts).then(() => void doRequest(axios, buildError)(opts))

/**
 * Performs a request without a request body with response body validation.
 */
export const doReceiveOnly =
  (axios: AxiosInstance, buildError: RequestErrorBuilder) =>
  <ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
    opts: RequestConfig<undefined> & ResponsePayloadConfig<ResponseType, ResponseSchema>
  ): Promise<ResponseType> =>
    doRequest(
      axios,
      buildError
    )<undefined, ResponseType>(opts).then((result) => verifyResponsePayload(opts, result.data))

/**
 * Performs a request with request and response body validation.
 */
export const doSendAndReceive =
  (axios: AxiosInstance, buildError: RequestErrorBuilder) =>
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
      .then(() => doRequest(axios, buildError)<RequestType, ResponseType>(opts))
      .then((result) => verifyResponsePayload(opts, result.data))

export const doSendFile =
  (axios: AxiosInstance, buildError: RequestErrorBuilder) =>
  (opts: RequestConfig<FormData>): Promise<void> =>
    doRequest(axios, buildError)(opts).then(() => Promise.resolve())

export const doSendFileAndReceive =
  (axios: AxiosInstance, buildError: RequestErrorBuilder) =>
  <ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
    opts: RequestConfig<FormData> & ResponsePayloadConfig<ResponseType, ResponseSchema>
  ): Promise<ResponseType> =>
    doRequest(
      axios,
      buildError
    )<FormData, ResponseType>(opts).then((result) => verifyResponsePayload(opts, result.data))
