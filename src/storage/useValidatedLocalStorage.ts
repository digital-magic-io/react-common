import * as z from 'zod'
import { Serializer, StoreHookResult } from './types'
import { useSerializedLocalStorage } from './useLocalStorage'
import { Primitive, PrimitiveRecord, hasValue, tryOrElse } from '@digital-magic/ts-common-utils'

type ZodType = z.ZodType<Primitive | PrimitiveRecord>

const zodSerializer = <V extends ZodType>(validator: V): Serializer<z.infer<V>> => ({
  serialize: (value) => (hasValue(value) ? JSON.stringify(value) : undefined),
  deserialize: (value, defaultValue) => {
    if (hasValue(value)) {
      const parsed = tryOrElse<unknown>(
        () => JSON.parse(value),
        () => undefined
      )
      if (hasValue(parsed)) {
        const validated = validator.safeParse(parsed)
        if (validated.success) {
          return validated.data
        }
        console.error('Unable to deserialize value: ', validated.error)
      }
      return defaultValue()
    } else {
      return defaultValue()
    }
  }
})

export const useValidatedLocalStorage = <V extends ZodType>(
  key: string,
  initialValue: z.infer<V>,
  validator: V
): StoreHookResult<z.infer<V>> => useSerializedLocalStorage(key, zodSerializer(validator), initialValue)
