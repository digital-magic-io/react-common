import { TFunction } from 'i18next'
import { OptionalType } from '@digital-magic/ts-common-utils'
import { buildErrorMessage } from './utils'

export type ErrorDetailValue = OptionalType<string | number>
export type ErrorDetailsRecord = Readonly<Record<string, ErrorDetailValue>>

// TODO: Update name to be unique symbol type
export type AppError<T extends string = string> = Error &
  Readonly<{
    name: T
  }>

export const UnknownError = 'UnknownError'
export type UnknownError = AppError<typeof UnknownError>
export const unknownError = (e: unknown, context?: unknown): UnknownError => ({
  name: UnknownError,
  message: buildErrorMessage(UnknownError, { error: JSON.stringify(e), context: JSON.stringify(context) }),
  cause: e
})

export const ClientErrorPlainText = 'ClientErrorPlainText'
export type ClientErrorPlainText = AppError<typeof ClientErrorPlainText>

export const ClientErrorTranslation = 'ClientErrorTranslation'
export type ClientErrorTranslation = AppError<typeof ClientErrorTranslation> &
  Readonly<{
    messageKey: Parameters<TFunction>[0]
    messageOpts?: Parameters<TFunction>[1]
  }>

export type ClientError = ClientErrorPlainText | ClientErrorTranslation
