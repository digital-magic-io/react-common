import { useCallback, useEffect, useState } from 'react'

type UseScrollPositionOptions = {
  isDisabled?: (position: number) => boolean
}

export const useScrollPosition = (options?: UseScrollPositionOptions): number => {
  const [scroll, setScroll] = useState(window.scrollY)

  const scrollHandler = useCallback((): void => {
    const scrollPos = window.scrollY

    if (!options?.isDisabled?.(scrollPos)) {
      setScroll(scrollPos)
    }
  }, [options])

  useEffect(() => {
    window.addEventListener('scroll', scrollHandler, { passive: true })

    return () => {
      window.removeEventListener('scroll', scrollHandler)
    }
  }, [scrollHandler])

  return scroll
}
