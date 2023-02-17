import { buildErrorMessage } from './utils'

export type AppError<T extends string> = Error &
  Readonly<{
    name: T
  }>

export const UnknownError = 'UnknownError'
export type UnknownError = AppError<typeof UnknownError>
export const unknownError = (action: string): UnknownError => ({
  name: UnknownError,
  message: buildErrorMessage(UnknownError, action),
  cause: undefined
})
