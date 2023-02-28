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
  <ApiErrorPayloadType>(axios: AxiosInstance, buildError: RequestErrorBuilder<ApiErrorPayloadType>) =>
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
  <ApiErrorPayloadType>(axios: AxiosInstance, buildError: RequestErrorBuilder<ApiErrorPayloadType>) =>
  async (opts: RequestConfig<void>): Promise<void> => {
    await doRequest(axios, buildError)(opts)
    return Promise.resolve()
  }

/**
 * Performs a request that doesn't return a response with request body validation.
 */
export const doSendOnly =
  <ApiErrorPayloadType>(axios: AxiosInstance, buildError: RequestErrorBuilder<ApiErrorPayloadType>) =>
  async <RequestType, RequestSchema extends z.ZodType<RequestType>>(
    opts: RequestConfig<RequestType> & RequestPayloadConfig<RequestType, RequestSchema>
  ): Promise<void> => {
    await verifyRequestPayload(opts)
    await doRequest(axios, buildError)(opts)
    return Promise.resolve()
  }

/**
 * Performs a request without a request body with response body validation.
 */
export const doReceiveOnly =
  <ApiErrorPayloadType>(axios: AxiosInstance, buildError: RequestErrorBuilder<ApiErrorPayloadType>) =>
  async <ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
    opts: RequestConfig<undefined> & ResponsePayloadConfig<ResponseType, ResponseSchema>
  ): Promise<ResponseType> => {
    const result = await doRequest(axios, buildError)<undefined, ResponseType>(opts)
    return await verifyResponsePayload(opts, result.data)
  }

/**
 * Performs a request with request and response body validation.
 */
export const doSendAndReceive =
  <ApiErrorPayloadType>(axios: AxiosInstance, buildError: RequestErrorBuilder<ApiErrorPayloadType>) =>
  async <
    RequestType,
    RequestSchema extends z.ZodType<RequestType>,
    ResponseType,
    ResponseSchema extends z.ZodType<ResponseType>
  >(
    opts: RequestConfig<RequestType> &
      RequestPayloadConfig<RequestType, RequestSchema> &
      ResponsePayloadConfig<ResponseType, ResponseSchema>
  ): Promise<ResponseType> => {
    await verifyRequestPayload(opts)
    const result = await doRequest(axios, buildError)<RequestType, ResponseType>(opts)
    return await verifyResponsePayload(opts, result.data)
  }

export const doSendFile =
  <ApiErrorPayloadType>(axios: AxiosInstance, buildError: RequestErrorBuilder<ApiErrorPayloadType>) =>
  async (opts: RequestConfig<FormData>): Promise<void> => {
    await doRequest(axios, buildError)(opts)
    return Promise.resolve()
  }

export const doSendFileAndReceive =
  <ApiErrorPayloadType>(axios: AxiosInstance, buildError: RequestErrorBuilder<ApiErrorPayloadType>) =>
  async <ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
    opts: RequestConfig<FormData> & ResponsePayloadConfig<ResponseType, ResponseSchema>
  ): Promise<ResponseType> => {
    const result = await doRequest(axios, buildError)<FormData, ResponseType>(opts)
    return await verifyResponsePayload(opts, result.data)
  }
