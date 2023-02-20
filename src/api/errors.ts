import * as z from 'zod'
import { AppError, ErrorDetailsRecord, UnknownError } from '../errors'
import { type AxiosError } from 'axios'
import { OptionalType } from '@digital-magic/ts-common-utils'
import { buildErrorMessage } from '../errors/utils'
import { RequestContext } from './types'
const buildErrorDetails = (context: RequestContext): ErrorDetailsRecord => ({
  method: context.method,
  url: context.url,
  params: JSON.stringify(context.params),
  data: JSON.stringify(context.data)
})

export const buildFailedRequestError = (
  errorName: string,
  context: RequestContext,
  details: Record<string, OptionalType<string | number>>
): string => buildErrorMessage(errorName, { ...buildErrorDetails(context), ...details })

// TODO: Make it polymorphic?
export const ApiErrorObject = z.object({
  caseId: z.string().nullable(),
  code: z.string(), //ApiErrorCode,
  message: z.string().nullable()
})
export type ApiErrorObject = Readonly<z.infer<typeof ApiErrorObject>>

export type ErrorWithRequestContext = Readonly<{
  context: RequestContext
}>

export const UseApiError = 'UseApiError'
export type UseApiError = AppError<typeof UseApiError> & ErrorWithRequestContext

export const createUseApiError =
  (context: RequestContext) =>
  (error: unknown): UseApiError => ({
    name: UseApiError,
    message: buildFailedRequestError(UseApiError, context, { error: JSON.stringify(error) }),
    context,
    cause: error
  })

export const ApiError = 'ApiError'
export type ApiError = AppError<typeof ApiError> &
  ErrorWithRequestContext &
  Readonly<{
    payload: ApiErrorObject
  }>

export const apiError =
  (context: RequestContext) =>
  (payload: ApiErrorObject): ApiError => ({
    name: ApiError,
    message: buildFailedRequestError(ApiError, context, { payload: JSON.stringify(payload) }),
    context,
    payload
  })

export const HttpError = 'HttpError'
export type HttpError = AppError<typeof HttpError> &
  ErrorWithRequestContext &
  Readonly<{
    httpStatus?: number
    axiosError: AxiosError<unknown, unknown>
  }>
export const httpError =
  (context: RequestContext) =>
  (error: Readonly<AxiosError<unknown, unknown>>): HttpError => ({
    name: HttpError,
    message: buildFailedRequestError(HttpError, context, { status: error.status, message: error.message }),
    context,
    httpStatus: error.status,
    axiosError: error
  })

type WithZodError<T> = Readonly<{
  error: z.ZodError<T>
}>

export const InvalidRequestError = 'InvalidRequestError'
export type InvalidRequestError<T> = AppError<typeof InvalidRequestError> & ErrorWithRequestContext & WithZodError<T>

export const invalidRequestError =
  (context: RequestContext) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidRequestError<T> => ({
    name: InvalidRequestError,
    message: buildFailedRequestError(InvalidRequestError, context, { message: error.message }),
    context,
    error
  })

export const InvalidResponseError = 'InvalidResponseError'
export type InvalidResponseError<T> = AppError<typeof InvalidResponseError> & ErrorWithRequestContext & WithZodError<T>
export const invalidResponseError =
  (context: RequestContext) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidResponseError<T> => ({
    name: InvalidResponseError,
    message: buildFailedRequestError(InvalidResponseError, context, { message: error.message }),
    context,
    error
  })

export type RequestError =
  | UnknownError
  | ApiError
  | HttpError
  | InvalidRequestError<unknown>
  | InvalidResponseError<unknown>
