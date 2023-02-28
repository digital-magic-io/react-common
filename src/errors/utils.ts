import { AppError, ErrorDetailsRecord, ErrorDetailValue } from './types'

const optProp = (name: string, value: ErrorDetailValue): string => `${name}: ${String(value) ?? 'N/A'}`

export const errorDetailsToString = (details: ErrorDetailsRecord): string =>
  Object.entries(details)
    .map(([k, v]) => optProp(k, v))
    .join(', ')

export const buildBasicErrorMessage = (errorName: string, details: string): string =>
  `Failed with ${errorName}: ${details}`

export const buildErrorMessage = (errorName: string, errorDetailsRecord: ErrorDetailsRecord): string =>
  buildBasicErrorMessage(errorName, errorDetailsToString(errorDetailsRecord))

export const isAppError =
  <T extends symbol>(errorType: T) =>
  (e: unknown): e is T =>
    Object.prototype.hasOwnProperty.call(e, '_type') &&
    Object.prototype.hasOwnProperty.call(e, 'name') &&
    Object.prototype.hasOwnProperty.call(e, 'message') &&
    (e as AppError<T>)._type === errorType
