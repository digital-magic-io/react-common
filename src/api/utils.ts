import * as z from 'zod'
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { evaluate } from '@digital-magic/ts-common-utils'
import { type RequestDefinition, type RequestContext } from './types'
import {
  apiError,
  ApiErrorObject,
  buildFailedRequestError,
  httpError,
  invalidRequestError,
  invalidResponseError,
  RequestError
} from './errors'
import { UnknownError, unknownError } from '../errors'

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
 * @param opts request options
 */
export const doRequest = <RequestType, ResponseType>(
  opts: RequestConfig<RequestType>
): Promise<AxiosResponse<ResponseType, RequestType>> =>
  axios({
    validateStatus: (status) => status < 300,
    ...opts,
    url: evaluate(opts.url)
  })

/**
 * Performs a request that doesn't return a response with request body validation.
 *
 * @param opts request options
 */
export const sendOnly = <RequestType, RequestSchema extends z.ZodType<RequestType>>(
  opts: RequestConfig<RequestType> & RequestPayloadConfig<RequestType, RequestSchema>
): Promise<void> => verifyRequestPayload(opts).then(() => void doRequest(opts))

/**
 * Performs a request without a request body with response body validation.
 *
 * @param opts request options
 */
export const receiveOnly = <ResponseType, ResponseSchema extends z.ZodType<ResponseType>>(
  opts: RequestConfig<undefined> & ResponsePayloadConfig<ResponseType, ResponseSchema>
): Promise<ResponseType> =>
  doRequest<undefined, ResponseType>(opts).then((result) => verifyResponsePayload(opts, result.data))

/**
 * Performs a request with request and response body validation.
 *
 * @param opts request options
 */
export const sendAndReceive = <
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
    .then(() => doRequest<RequestType, ResponseType>(opts))
    .then((result) => verifyResponsePayload(opts, result.data))

export const toApiError =
  (context: RequestContext) =>
  (e: unknown): RequestError => {
    if (axios.isAxiosError(e)) {
      if (e.response?.data) {
        const errorObj = ApiErrorObject.safeParse(e.response.data)
        if (errorObj.success) {
          return apiError(context)(errorObj.data)
        } else {
          return httpError(context)(e)
        }
      } else {
        return httpError(context)(e)
      }
    } else {
      if (e instanceof Error) {
        return unknownError(buildFailedRequestError(UnknownError, context, { message: e.message }))
      } else {
        return unknownError(buildFailedRequestError(UnknownError, context, { error: JSON.stringify(e) }))
      }
    }
  }
