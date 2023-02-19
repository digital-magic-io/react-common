import * as z from 'zod'
import axios, { AxiosResponse } from 'axios'
import { evaluate } from '@digital-magic/ts-common-utils'
import { invalidRequestError, invalidResponseError } from './errors'
import { ErrorRequestConfig, RequestConfig } from './types'

type RequestPayloadConfig<Request, RequestSchema extends z.ZodType<Request>> = Readonly<{
  requestSchema: RequestSchema
}>

type ResponsePayloadConfig<Response, ResponseSchema extends z.ZodType<Response>> = Readonly<{
  responseSchema: ResponseSchema
}>

export const reqCfgToErrReqCfg = (config: RequestConfig<unknown>): ErrorRequestConfig => ({
  ...config,
  url: evaluate(config.url)
})

const verifyRequestPayload = <Request, RequestSchema extends z.ZodType<Request>, Response>(
  opts: RequestConfig<Response> & RequestPayloadConfig<Request, RequestSchema>
): Promise<Request> => {
  const validated = opts.requestSchema.safeParse(opts.data)
  if (!validated.success) {
    return Promise.reject(invalidRequestError(reqCfgToErrReqCfg(opts))(validated.error))
  } else {
    return Promise.resolve(validated.data)
  }
}

const verifyResponsePayload = <Response, ResponseSchema extends z.ZodType<Response>>(
  opts: ResponsePayloadConfig<Response, ResponseSchema> & RequestConfig<unknown>,
  response: Response
): Promise<Response> => {
  const validated = opts.responseSchema.safeParse(response)
  if (!validated.success) {
    return Promise.reject(invalidResponseError(reqCfgToErrReqCfg(opts))(validated.error))
  } else {
    return Promise.resolve(validated.data)
  }
}

/**
 * Performs Axios request.
 *
 * @param opts request options
 */
export const doRequest = <Request, Response>(opts: RequestConfig<Request>): Promise<AxiosResponse<Response, Request>> =>
  axios({
    validateStatus: (status) => status < 300,
    ...reqCfgToErrReqCfg(opts)
  })

/**
 * Performs a request that doesn't return a response with request body validation.
 *
 * @param opts request options
 */
export const sendOnly = <Request, RequestSchema extends z.ZodType<Request>>(
  opts: RequestConfig<Request> & RequestPayloadConfig<Request, RequestSchema>
): Promise<void> => verifyRequestPayload(opts).then(() => void doRequest(opts))

/**
 * Performs a request without a request body with response body validation.
 *
 * @param opts request options
 */
export const receiveOnly = <Response, ResponseSchema extends z.ZodType<Response>>(
  opts: RequestConfig<undefined> & ResponsePayloadConfig<Response, ResponseSchema>
): Promise<Response> => doRequest<undefined, Response>(opts).then((result) => verifyResponsePayload(opts, result.data))

/**
 * Performs a request with request and response body validation.
 *
 * @param opts request options
 */
export const sendAndReceive = <
  Request,
  RequestSchema extends z.ZodType<Request>,
  Response,
  ResponseSchema extends z.ZodType<Response>
>(
  opts: RequestConfig<Request> &
    RequestPayloadConfig<Request, RequestSchema> &
    ResponsePayloadConfig<Response, ResponseSchema>
): Promise<Response> =>
  verifyRequestPayload(opts)
    .then(() => doRequest<Request, Response>(opts))
    .then((result) => verifyResponsePayload(opts, result.data))
