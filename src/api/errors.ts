import * as z from 'zod'
import { AppError, ErrorDetailsRecord, UnknownError, unknownError } from '../errors'
import { AxiosError, AxiosRequestConfig, isAxiosError } from 'axios'
import { hasValue, OptionalType } from '@digital-magic/ts-common-utils'
import { buildErrorMessage } from '../errors/utils'

type ErrorContext = Readonly<Readonly<AxiosRequestConfig<unknown>>>

const errorCtxToDetails = (ctx: ErrorContext): ErrorDetailsRecord => ({
  method: ctx.method,
  url: ctx.url,
  params: JSON.stringify(ctx.params),
  data: JSON.stringify(ctx.data)
})

const buildFailedRequestError = (
  errorName: string,
  context: OptionalType<ErrorContext>,
  details: Record<string, OptionalType<string | number>>
): string => buildErrorMessage(errorName, hasValue(context) ? { ...errorCtxToDetails(context), ...details } : details)

// TODO: Make it polymorphic?
const ApiErrorObject = z.object({
  caseId: z.string().nullable(),
  code: z.string(), //ApiErrorCode,
  message: z.string().nullable()
})
type ApiErrorObject = Readonly<z.infer<typeof ApiErrorObject>>

export type ErrorWithContext = Readonly<{
  context: ErrorContext
}>

export const ApiError = 'ApiError'
export type ApiError = AppError<typeof ApiError> &
  ErrorWithContext &
  Readonly<{
    payload: ApiErrorObject
  }>

export const apiError =
  (context: ErrorContext) =>
  (payload: ApiErrorObject): ApiError => ({
    name: ApiError,
    message: buildFailedRequestError(ApiError, context, { payload: JSON.stringify(payload) }),
    context,
    payload
  })

export const HttpError = 'HttpError'
export type HttpError = AppError<typeof HttpError> &
  //ErrorWithContext &
  Readonly<{
    context: OptionalType<ErrorContext>
    httpStatus?: number
    axiosError: AxiosError<unknown, unknown>
  }>
export const httpError =
  (context: OptionalType<ErrorContext>) =>
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
export type InvalidRequestError<T> = AppError<typeof InvalidRequestError> & ErrorWithContext & WithZodError<T>

export const invalidRequestError =
  (context: ErrorContext) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidRequestError<T> => ({
    name: InvalidRequestError,
    message: buildFailedRequestError(InvalidRequestError, context, { message: error.message }),
    context,
    error
  })

export const InvalidResponseError = 'InvalidResponseError'
export type InvalidResponseError<T> = AppError<typeof InvalidResponseError> & ErrorWithContext & WithZodError<T>
export const invalidResponseError =
  (context: ErrorContext) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidResponseError<T> => ({
    name: InvalidResponseError,
    message: buildFailedRequestError(InvalidResponseError, context, { message: error.message }),
    context,
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
  (action: string) =>
  (e: unknown): RequestError => {
    if (isAxiosError(e)) {
      if (e.response?.data && hasValue(e.config)) {
        const errorObj = ApiErrorObject.safeParse(e.response.data)
        if (errorObj.success) {
          return apiError(e.config)(errorObj.data)
        } else {
          return httpError(e.config)(e)
        }
      } else {
        return httpError(e.config)(e)
      }
    } else {
      if (e instanceof Error) {
        return unknownError(buildErrorMessage(UnknownError, { action, message: e.message }))
      } else {
        return unknownError(buildErrorMessage(UnknownError, { action, error: JSON.stringify(e) }))
      }
    }
  }
