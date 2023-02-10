import { isEmpty, OptionalString } from '@digital-magic/ts-common-utils'
import { Serializer } from './types'

export type StoreType = OptionalString

export const getFromStorage =
  (storage: Storage) =>
  (key: string): StoreType =>
    storage.getItem(key) ?? undefined

export const setToStorage =
  (storage: Storage) =>
  (key: string, value: StoreType): void =>
    isEmpty(value) ? storage.removeItem(key) : storage.setItem(key, value)

export const stringSerializer: Serializer<string> = {
  serialize: (value) => value,
  deserialize: (value, defaultValue) => value ?? defaultValue()
}
