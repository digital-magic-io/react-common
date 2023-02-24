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

export type DefaultPayloadType<T> = Readonly<{ payload: T }>

export const ApiError = 'ApiError'
export type ApiError<PayloadType> = AppError<typeof ApiError> & ErrorWithRequestContext & PayloadType

export const apiError =
  (context: RequestContext) =>
  <PayloadType>(payload: PayloadType): ApiError<PayloadType> => ({
    name: ApiError,
    message: buildFailedRequestError(ApiError, context, { payload: JSON.stringify(payload) }),
    context,
    ...payload
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

export const buildRequestError =
  <ApiErrorPayloadType>(
    isAxiosError: (payload: unknown) => payload is AxiosError,
    ApiErrorPayloadSchema: Readonly<z.ZodType<ApiErrorPayloadType>>
  ): RequestErrorBuilder<ApiErrorPayloadType> =>
  (context) =>
  (e) => {
    if (isAxiosError(e)) {
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

export const clientRequestErrorPlainText = <ApiErrorPayloadType>(
  message: string,
  requestError: Readonly<RequestError<ApiErrorPayloadType>>
): ClientErrorPlainText => ({
  name: ClientErrorPlainText,
  cause: requestError,
  message
})

export const clientRequestErrorTranslation = <ApiErrorPayloadType>(
  message: string,
  requestError: Readonly<RequestError<ApiErrorPayloadType>>,
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
