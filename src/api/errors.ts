import * as z from 'zod'
import { AppError } from '../errors'
import { AxiosError, AxiosRequestConfig } from 'axios'
import { OptionalType } from '@digital-magic/ts-common-utils'
import { buildErrorMessage } from '../errors/utils'

type ErrorContext = Readonly<AxiosRequestConfig<unknown>>
const optProp = (value: OptionalType<string | number>): string => String(value) ?? 'N/A'

const errorCtxToString = (ctx: ErrorContext): string =>
  `method: ${optProp(ctx.method)}, url: ${optProp(ctx.url)}, params: ${optProp(
    JSON.stringify(ctx.params)
  )}, data ${optProp(JSON.stringify(ctx.data))}`

const buildFailedRequestError = (errorName: string, context: ErrorContext, details: string): string =>
  buildErrorMessage(errorName, `${errorCtxToString(context)}, ${details}`)

// TODO: Make it polymorphic?
const ApiErrorObject = z.object({
  caseId: z.string().nullable(),
  code: z.string(), //ApiErrorCode,
  message: z.string().nullable()
})
type ApiErrorObject = Readonly<z.infer<typeof ApiErrorObject>>

export type RequestError = Readonly<{
  context: ErrorContext
}>

export const ApiError = 'ApiError'
export type ApiError = AppError<typeof ApiError> &
  RequestError &
  Readonly<{
    payload: ApiErrorObject
  }>

export const apiError =
  (context: ErrorContext) =>
  (payload: ApiErrorObject): ApiError => ({
    name: ApiError,
    message: buildFailedRequestError(ApiError, context, `payload: ${JSON.stringify(payload)}`),
    context,
    payload
  })

export const HttpError = 'HttpError'
export type HttpError = AppError<typeof HttpError> &
  RequestError &
  Readonly<{
    httpStatus?: number
    axiosError: AxiosError<unknown, unknown>
  }>
export const httpError =
  (context: ErrorContext) =>
  (error: Readonly<AxiosError<unknown, unknown>>): HttpError => ({
    name: HttpError,
    message: buildFailedRequestError(HttpError, context, `status: ${optProp(error.status)}, message: ${error.message}`),
    context,
    httpStatus: error.status,
    axiosError: error
  })

type WithZodError<T> = Readonly<{
  error: z.ZodError<T>
}>

export const InvalidRequestError = 'InvalidRequestError'
export type InvalidRequestError<T> = AppError<typeof InvalidRequestError> & RequestError & WithZodError<T>

export const invalidRequestError =
  (context: ErrorContext) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidRequestError<T> => ({
    name: InvalidRequestError,
    message: buildFailedRequestError(InvalidRequestError, context, `message: ${error.message}`),
    context,
    error
  })

export const InvalidResponseError = 'InvalidResponseError'
export type InvalidResponseError<T> = AppError<typeof InvalidResponseError> & RequestError & WithZodError<T>
export const invalidResponseError =
  (context: ErrorContext) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidResponseError<T> => ({
    name: InvalidResponseError,
    message: buildFailedRequestError(InvalidResponseError, context, `message: ${error.message}`),
    context,
    error
  })
