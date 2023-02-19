import * as z from 'zod'
import { AppError, ErrorDetailsRecord, UnknownError, unknownError } from '../errors'
import { AxiosError, isAxiosError } from 'axios'
import { OptionalType } from '@digital-magic/ts-common-utils'
import { buildErrorMessage } from '../errors/utils'
import { RequestContext } from './types'
const buildErrorDetails = (context: RequestContext): ErrorDetailsRecord => ({
  method: context.method,
  url: context.url,
  params: JSON.stringify(context.params),
  data: JSON.stringify(context.data)
})

const buildFailedRequestError = (
  errorName: string,
  context: RequestContext,
  details: Record<string, OptionalType<string | number>>
): string => buildErrorMessage(errorName, { ...buildErrorDetails(context), ...details })

// TODO: Make it polymorphic?
const ApiErrorObject = z.object({
  caseId: z.string().nullable(),
  code: z.string(), //ApiErrorCode,
  message: z.string().nullable()
})
type ApiErrorObject = Readonly<z.infer<typeof ApiErrorObject>>

export type ErrorWithRequestContext = Readonly<{
  context: RequestContext
}>

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

export type RequestErrorType =
  | typeof UnknownError
  | typeof ApiError
  | typeof HttpError
  | typeof InvalidRequestError
  | typeof InvalidResponseError

export type RequestError = AppError<RequestErrorType>

export const toApiError =
  (context: RequestContext) =>
  (e: unknown): RequestError => {
    if (isAxiosError(e)) {
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
