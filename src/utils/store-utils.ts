import { isEmpty, OptionalString } from '@digital-magic/ts-common-utils/lib/type'
import { getOrElse } from '@digital-magic/ts-common-utils/lib/nullable-utils'

export type StoreType = OptionalString

export const getFromStorage = (storage: Storage) => (key: string): StoreType =>
  getOrElse(storage.getItem(key), () => undefined)

/*
export function getFromStorage(storage: Storage, key: string): StoreType {
  const result = storage.getItem(key)
  return result === null ? undefined : result
}
*/

export const setToStorage = (storage: Storage) => (key: string, value: StoreType): void =>
  isEmpty(value) ? storage.clear() : storage.setItem(key, value)
