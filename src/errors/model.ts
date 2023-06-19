import { buildErrorMessage, isAppError } from './utils'
import { AppError } from './types'
import { TFunction, TOptions } from 'i18next'
import { RequestError } from '../api'

export const UnknownError: unique symbol = Symbol('UnknownError')
export type UnknownError = AppError<typeof UnknownError>
export const unknownError = (e: unknown, context?: unknown): UnknownError => ({
  _type: UnknownError,
  name: UnknownError.toString(),
  message: buildErrorMessage(UnknownError.toString(), {
    error: JSON.stringify(e),
    context: JSON.stringify(context)
  }),
  cause: e
})

export const isUnknownError = (e: unknown): e is UnknownError => isAppError(UnknownError)(e)

export const ClientErrorPlainText: unique symbol = Symbol('ClientErrorPlainText')
export type ClientErrorPlainText = AppError<typeof ClientErrorPlainText>

export const clientRequestErrorPlainText = <ApiErrorPayloadType>(
  message: string,
  requestError: Readonly<RequestError<ApiErrorPayloadType>>
): ClientErrorPlainText => ({
  _type: ClientErrorPlainText,
  name: ClientErrorPlainText.toString(),
  cause: requestError,
  message
})
export const isClientErrorPlainText = (e: unknown): e is ClientErrorPlainText => isAppError(ClientErrorPlainText)(e)

export const ClientErrorTranslation: unique symbol = Symbol('ClientErrorTranslation')
export type ClientErrorTranslation = AppError<typeof ClientErrorTranslation> &
  Readonly<{
    messageKey: Parameters<TFunction>[0]
    // Unable to use Parameters<TFunction>[1] here, because TFunction has 2 overloads with 2 & 3 parameters
    messageOpts?: TOptions
  }>

export const clientRequestErrorTranslation = <ApiErrorPayloadType>(
  message: string,
  requestError: Readonly<RequestError<ApiErrorPayloadType>>,
  // eslint-disable-next-line functional/prefer-immutable-types
  messageKey: ClientErrorTranslation['messageKey'],
  // eslint-disable-next-line functional/prefer-immutable-types
  messageOpts?: ClientErrorTranslation['messageOpts']
): ClientErrorTranslation => ({
  _type: ClientErrorTranslation,
  name: ClientErrorTranslation.toString(),
  cause: requestError,
  message,
  messageKey,
  messageOpts
})

export const isClientErrorTranslation = (e: unknown): e is ClientErrorTranslation =>
  isAppError(ClientErrorTranslation)(e)

export type ClientError = ClientErrorPlainText | ClientErrorTranslation
