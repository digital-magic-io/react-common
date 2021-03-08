import React from 'react'
import { isEmpty } from '@digital-magic/ts-common-utils/lib/type'
import { getFromStorage, setToStorage, StoreType } from '../utils/store-utils'

export function useStorageState(
  storage: Storage,
  key: string,
  initialState?: () => StoreType
): readonly [StoreType, React.Dispatch<React.SetStateAction<StoreType>>] {
  const getStorageValue = getFromStorage(storage)
  const setStorageValue = setToStorage(storage)
  const initialValue: () => StoreType = () =>
    getStorageValue(key) ?? isEmpty(initialState) ? undefined : initialState()
  const [value, setValue] = React.useState<StoreType>(initialValue)

  React.useEffect((): void => setStorageValue(key, value))

  return [value, setValue]
}
