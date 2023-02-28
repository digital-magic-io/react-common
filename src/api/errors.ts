import * as z from 'zod'
import { type AxiosError } from 'axios'
import { OptionalType } from '@digital-magic/ts-common-utils'
import { RequestContext } from './types'
import {
  AppError,
  ErrorDetailsRecord,
  unknownError,
  UnknownError,
  buildErrorMessage,
  isAppError,
  isUnknownError
} from '../errors'

const buildErrorDetails = (context: RequestContext): ErrorDetailsRecord => ({
  method: context.method,
  url: context.url,
  params: JSON.stringify(context.params),
  data: JSON.stringify(context.data)
})

export const buildFailedRequestError = <T extends symbol>(
  errorType: T,
  context: RequestContext,
  details: Record<string, OptionalType<string | number>>
): string => buildErrorMessage(errorType.toString(), { ...buildErrorDetails(context), ...details })

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const ApiErrorObject = <T>(ApiErrorCode: Readonly<z.ZodType<T>>) =>
  z.object({
    caseId: z.string().nullable(),
    code: ApiErrorCode,
    message: z.string().nullable()
  })

export type ErrorWithRequestContext = Readonly<{
  context: RequestContext
}>

export const CommunicationError: unique symbol = Symbol('CommunicationError')
export type CommunicationError = AppError<typeof CommunicationError> & ErrorWithRequestContext

export const communicationError =
  (context: RequestContext) =>
  (error: Readonly<Error>): CommunicationError => ({
    _type: CommunicationError,
    name: CommunicationError.toString(),
    message: buildFailedRequestError(CommunicationError, context, { error: JSON.stringify(error.message) }),
    context,
    cause: error
  })

export const isCommunicationError = (e: unknown): e is CommunicationError => isAppError(CommunicationError)(e)

export type DefaultPayloadType<T> = Readonly<{ payload: T }>

export const ApiError: unique symbol = Symbol('ApiError')
export type ApiError<PayloadType> = AppError<typeof ApiError> & ErrorWithRequestContext & PayloadType

export const apiError =
  (context: RequestContext) =>
  <PayloadType>(payload: PayloadType): ApiError<PayloadType> => ({
    _type: ApiError,
    name: ApiError.toString(),
    message: buildFailedRequestError(ApiError, context, { payload: JSON.stringify(payload) }),
    context,
    ...payload
  })

export const isApiError = <PayloadType>(e: unknown): e is ApiError<PayloadType> => isAppError(ApiError)(e)

export const HttpError: unique symbol = Symbol('HttpError')
export type HttpError = AppError<typeof HttpError> &
  ErrorWithRequestContext &
  Readonly<{
    httpStatus: OptionalType<number>
    axiosError: AxiosError<unknown, unknown>
  }>

export const httpError =
  (context: RequestContext) =>
  (error: Readonly<AxiosError<unknown, unknown>>): HttpError => ({
    _type: HttpError,
    name: HttpError.toString(),
    message: buildFailedRequestError(HttpError, context, { status: error.response?.status, message: error.message }),
    context,
    httpStatus: error.response?.status,
    axiosError: error
  })

export const isHttpError = (e: unknown): e is HttpError => isAppError(HttpError)(e)

type WithZodError<T> = Readonly<{
  error: z.ZodError<T>
}>

export const InvalidRequestError: unique symbol = Symbol('InvalidRequestError')
export type InvalidRequestError<T> = AppError<typeof InvalidRequestError> & ErrorWithRequestContext & WithZodError<T>

export const invalidRequestError =
  (context: RequestContext) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidRequestError<T> => ({
    _type: InvalidRequestError,
    name: InvalidRequestError.toString(),
    message: buildFailedRequestError(InvalidRequestError, context, { message: error.message }),
    context,
    error
  })

export const isInvalidRequestError = <T>(e: unknown): e is InvalidRequestError<T> => isAppError(InvalidRequestError)(e)

export const InvalidResponseError: unique symbol = Symbol('InvalidResponseError')
export type InvalidResponseError<T> = AppError<typeof InvalidResponseError> & ErrorWithRequestContext & WithZodError<T>
export const invalidResponseError =
  (context: RequestContext) =>
  <T>(error: Readonly<z.ZodError<T>>): InvalidResponseError<T> => ({
    _type: InvalidResponseError,
    name: InvalidResponseError.toString(),
    message: buildFailedRequestError(InvalidResponseError, context, { message: error.message }),
    context,
    error
  })

export const isInvalidResponseError = <T>(e: unknown): e is InvalidResponseError<T> =>
  isAppError(InvalidResponseError)(e)

export type RequestError<ApiErrorPayloadType> =
  | UnknownError
  | InvalidRequestError<unknown>
  | InvalidResponseError<unknown>
  | CommunicationError
  | HttpError
  | ApiError<ApiErrorPayloadType>

export type RequestErrorBuilder<ApiErrorPayloadType> = (
  context: RequestContext
) => (e: unknown) => RequestError<ApiErrorPayloadType>

export const isRequestError = <ApiErrorPayloadType>(e: unknown): e is RequestError<ApiErrorPayloadType> =>
  isUnknownError(e) ||
  isInvalidRequestError(e) ||
  isInvalidResponseError(e) ||
  isCommunicationError(e) ||
  isHttpError(e) ||
  isApiError<ApiErrorPayloadType>(e)

export const buildRequestError =
  <ApiErrorPayloadType>(
    isAxiosError: (payload: unknown) => payload is AxiosError,
    ApiErrorPayloadSchema: Readonly<z.ZodType<ApiErrorPayloadType>>
  ): RequestErrorBuilder<ApiErrorPayloadType> =>
  (context) =>
  (e) => {
    if (isRequestError<ApiErrorPayloadType>(e)) {
      return e
    } else if (isAxiosError(e)) {
      if (e.response?.data) {
        const errorObj = ApiErrorPayloadSchema.safeParse(e.response.data)
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
        return communicationError(context)(e)
      } else {
        return unknownError(e, context)
      }
    }
  }
