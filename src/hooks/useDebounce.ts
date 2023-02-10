import { useEffect, useState } from 'react'

type UseDebounceOptions<T> = {
  shouldUpdateImmediately: (newValue: T, prevValue: T) => boolean
}

export const useDebounce = <T>(value: T, delay: number, options?: UseDebounceOptions<T>): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    if (options?.shouldUpdateImmediately(value, debouncedValue)) {
      clearTimeout(handler)
      setDebouncedValue(value)
    }

    return () => {
      clearTimeout(handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay])

  return debouncedValue
}
