import * as React from 'react'
import { OptionalString } from '@digital-magic/ts-common-utils/lib/type'

export type StoreHookResult<T> = readonly [T, React.Dispatch<React.SetStateAction<T>>]

// eslint-disable-next-line functional/readonly-type
export type Serializer<T> = {
  readonly serialize: (value: T) => OptionalString
  readonly deserialize: (value: OptionalString, defaultValue: () => T) => T
}
