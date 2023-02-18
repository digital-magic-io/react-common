import { ErrorDetailsRecord, ErrorDetailValue } from './types'

const optProp = (name: string, value: ErrorDetailValue): string => `${name}: ${String(value) ?? 'N/A'}`

export const errorDetailsToString = (details: ErrorDetailsRecord): string =>
  Object.entries(details)
    .map(([k, v]) => optProp(k, v))
    .join(', ')

export const buildBasicErrorMessage = (errorName: string, details: string): string =>
  `Failed with ${errorName}: ${details}`

export const buildErrorMessage = (errorName: string, errorDetailsRecord: ErrorDetailsRecord): string =>
  buildBasicErrorMessage(errorName, errorDetailsToString(errorDetailsRecord))
