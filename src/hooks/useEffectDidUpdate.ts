import { useEffect, useRef } from 'react'

export const useEffectDidUpdate = (...args: Parameters<typeof useEffect>): ReturnType<typeof useEffect> => {
  const hasMounted = useRef<boolean>(false)

  useEffect(() => {
    if (hasMounted.current) {
      return args[0]()
    }

    hasMounted.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, args[1])
}
