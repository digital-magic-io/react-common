import { Serializer, StoreHookResult } from './types'
import { useSerializedStorage, useStorage } from './useStorage'

export const useSerializedLocalStorage = <T>(
  key: string,
  serializer: Serializer<T>,
  initialState: T
): StoreHookResult<T> => useSerializedStorage(localStorage, key, serializer, initialState)

export const useLocalStorage = (key: string, initialState: string): StoreHookResult<string> =>
  useStorage(localStorage, key, initialState)
