import { OptionalType } from '@digital-magic/ts-common-utils'

export type ErrorDetailValue = OptionalType<string | number>
export type ErrorDetailsRecord = Readonly<Record<string, ErrorDetailValue>>

export type AppError<T extends symbol> = Error &
  Readonly<{
    _type: T
  }>
