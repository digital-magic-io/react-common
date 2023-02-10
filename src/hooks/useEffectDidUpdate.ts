import { useEffect, useRef } from 'react'

// eslint-disable-next-line functional/prefer-immutable-types,functional/functional-parameters
export const useEffectDidUpdate = (...args: Parameters<typeof useEffect>): ReturnType<typeof useEffect> => {
  const hasMounted = useRef<boolean>(false)

  useEffect(() => {
    if (hasMounted.current) {
      return args[0]()
    }

    // eslint-disable-next-line functional/immutable-data
    hasMounted.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, args[1])
}
