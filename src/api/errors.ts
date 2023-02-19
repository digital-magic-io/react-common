import * as z from 'zod'
import { AppError, ErrorDetailsRecord, UnknownError, unknownError } from '../errors'
import { AxiosError, isAxiosError } from 'axios'
import { OptionalType } from '@digital-magic/ts-common-utils'
import { buildErrorMessage } from '../errors/utils'
import { ErrorRequestConfig } from './types'
const errorCtxToDetails = (config: ErrorRequestConfig): ErrorDetailsRecord => ({
  method: config.method,
  url: config.url,
  params: JSON.stringify(config.params),
  data: JSON.stringify(config.data)
})

const buildFailedRequestError = (
  errorName: string,
  config: ErrorRequestConfig,
  details: Record<string, OptionalType<string | number>>
): string => buildErrorMessage(errorName, { ...errorCtxToDetails(config), ...details })

// TODO: Make it polymorphic?
const ApiErrorObject = z.object({
  caseId: z.string().nullable(),
  code: z.string(), //ApiErrorCode,
  message: z.string().nullable()
})
type ApiErrorObject = Readonly<z.infer<typeof ApiErrorObject>>

export type ErrorWithRequestConfig = Readonly<{
  config: ErrorRequestConfig
}>

export const ApiError = 'ApiError'
export type ApiError = AppError<typeof ApiError> &
  ErrorWithRequestConfig &
  Readonly<{
    payload: ApiErrorObject
  }>

export const apiError =
  (config: ErrorRequestConfig) =>
  (payload: ApiErrorObject): ApiError => ({
    name: ApiError,
    message: buildFailedRequestError(ApiError, config, { payload: JSON.stringify(payload) }),
    config: config,
    payload
  })

export const HttpError = 'HttpError'
export type HttpError = AppError<typeof HttpError> &
  ErrorWithRequestConfig &
  Readonly<{
    httpStatus?: number
    axiosError: AxiosError<unknown, unknown>
  }>
export const httpError =
  (config: ErrorRequestConfig) =>
  (error: Readonly<AxiosError<unknown, unknown>>): HttpError => ({
    name: HttpError,
    message: buildFailedRequestError(HttpError, config, { status: error.status, message: error.message }),
    config: config,
    httpStatus: error.status,
    axiosError: error
  })

type WithZodError<T> = Readonly<{
  error: z.ZodError<T>
}>

export const InvalidRequestError = 'InvalidRequestError'
export type InvalidRequestError<T> = AppError<typeof InvalidRequestError> & ErrorWithRequestConfig & WithZodError<T>

export const invalidRequestError =
  (config: ErrorRequestConfig) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidRequestError<T> => ({
    name: InvalidRequestError,
    message: buildFailedRequestError(InvalidRequestError, config, { message: error.message }),
    config: config,
    error
  })

export const InvalidResponseError = 'InvalidResponseError'
export type InvalidResponseError<T> = AppError<typeof InvalidResponseError> & ErrorWithRequestConfig & WithZodError<T>
export const invalidResponseError =
  (config: ErrorRequestConfig) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidResponseError<T> => ({
    name: InvalidResponseError,
    message: buildFailedRequestError(InvalidResponseError, config, { message: error.message }),
    config: config,
    error
  })

export type RequestErrorType =
  | typeof UnknownError
  | typeof ApiError
  | typeof HttpError
  | typeof InvalidRequestError
  | typeof InvalidResponseError

export type RequestError = AppError<RequestErrorType>

export const toApiError =
  (config: ErrorRequestConfig) =>
  (e: unknown): RequestError => {
    if (isAxiosError(e)) {
      if (e.response?.data) {
        const errorObj = ApiErrorObject.safeParse(e.response.data)
        if (errorObj.success) {
          return apiError(config)(errorObj.data)
        } else {
          return httpError(config)(e)
        }
      } else {
        return httpError(config)(e)
      }
    } else {
      if (e instanceof Error) {
        return unknownError(buildFailedRequestError(UnknownError, config, { message: e.message }))
      } else {
        return unknownError(buildFailedRequestError(UnknownError, config, { error: JSON.stringify(e) }))
      }
    }
  }
