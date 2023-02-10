import * as React from 'react'
import { Serializer, StoreHookResult } from './types'
import { getFromStorage, setToStorage, stringSerializer } from './utils'

export const useSerializedStorage = <T>(
  storage: Storage,
  key: string,
  serializer: Serializer<T>,
  initialState: T
): StoreHookResult<T> => {
  const getDeserializedValue = React.useCallback(
    () => serializer.deserialize(getFromStorage(storage)(key), () => initialState),
    [key, serializer, initialState, storage]
  )

  const [storedValue, setStoredValue] = React.useState<T>(getDeserializedValue)

  const setValue = React.useCallback(
    (value: T | ((val: T) => T)): void => {
      setStoredValue((prevValue) => {
        const targetValue = value instanceof Function ? value(prevValue) : value
        setToStorage(storage)(key, serializer.serialize(targetValue))
        return targetValue
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, serializer, storedValue, storage]
  )

  React.useEffect(() => {
    const storageHandler = (e: Readonly<StorageEvent>): void => {
      if (e.key === key) {
        setStoredValue(getDeserializedValue())
      }
    }
    window.addEventListener('storage', storageHandler)

    return () => window.removeEventListener('storage', storageHandler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [storedValue, setValue]
}

export const useStorage = (storage: Storage, key: string, initialState: string): StoreHookResult<string> =>
  useSerializedStorage(storage, key, stringSerializer, initialState)
