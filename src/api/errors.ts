import * as z from 'zod'
import { type AxiosError } from 'axios'
import { OptionalType } from '@digital-magic/ts-common-utils'
import { buildErrorMessage } from '../errors/utils'
import { RequestContext } from './types'
import {
  AppError,
  ClientErrorPlainText,
  ClientErrorTranslation,
  ErrorDetailsRecord,
  unknownError,
  UnknownError
} from '../errors'
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

export const CommunicationError = 'CommunicationError'
export type CommunicationError = AppError<typeof CommunicationError> & ErrorWithRequestContext

export const communicationError =
  (context: RequestContext) =>
  (error: Readonly<Error>): CommunicationError => ({
    name: CommunicationError,
    message: buildFailedRequestError(CommunicationError, context, { error: JSON.stringify(error.message) }),
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
    httpStatus: OptionalType<number>
    axiosError: AxiosError<unknown, unknown>
  }>
export const httpError =
  (context: RequestContext) =>
  (error: Readonly<AxiosError<unknown, unknown>>): HttpError => ({
    name: HttpError,
    message: buildFailedRequestError(HttpError, context, { status: error.response?.status, message: error.message }),
    context,
    httpStatus: error.response?.status,
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
  | InvalidRequestError<unknown>
  | InvalidResponseError<unknown>
  | CommunicationError
  | HttpError
  | ApiError

export type RequestErrorBuilder = (context: RequestContext) => (e: unknown) => RequestError

export const buildRequestError =
  (isAxiosError: (payload: unknown) => payload is AxiosError): RequestErrorBuilder =>
  (context) =>
  (e) => {
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
        // TODO: Not sure that InvalidRequestError/InvalidResponseError are needed here, because generally are thrown outside the request handling
        if (e.name === InvalidRequestError) {
          return e as InvalidRequestError<unknown>
        } else if (e.name === InvalidResponseError) {
          return e as InvalidResponseError<unknown>
        } else {
          return communicationError(context)(e)
        }
      } else {
        return unknownError(e, context)
      }
    }
  }

export const clientRequestErrorPlainText = (
  message: string,
  requestError: Readonly<RequestError>
): ClientErrorPlainText => ({
  name: ClientErrorPlainText,
  cause: requestError,
  message
})

export const clientRequestErrorTranslation = (
  message: string,
  requestError: Readonly<RequestError>,
  // eslint-disable-next-line functional/prefer-immutable-types
  messageKey: ClientErrorTranslation['messageKey'],
  // eslint-disable-next-line functional/prefer-immutable-types
  messageOpts?: ClientErrorTranslation['messageOpts']
): ClientErrorTranslation => ({
  name: ClientErrorTranslation,
  cause: requestError,
  message,
  messageKey,
  messageOpts
})
