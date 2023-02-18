import { buildBasicErrorMessage } from './utils'
import { OptionalType } from '@digital-magic/ts-common-utils'

export type ErrorDetailValue = OptionalType<string | number>
export type ErrorDetailsRecord = Readonly<Record<string, ErrorDetailValue>>

export type ArrErrorType = typeof UnknownError

export type AppError<T = string> = Error &
  Readonly<{
    name: T
  }>

export const UnknownError = 'UnknownError'
export type UnknownError = AppError<ArrErrorType>
export const unknownError = (action: string): UnknownError => ({
  name: UnknownError,
  message: buildBasicErrorMessage(UnknownError, action),
  cause: undefined
})
