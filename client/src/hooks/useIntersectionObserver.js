import { useEffect, useRef } from 'react'

export function useIntersectionObserver(onIntersect, enabled = true) {
  const targetRef = useRef(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target || !enabled || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onIntersect()
    }, { rootMargin: '240px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled, onIntersect])

  return targetRef
}

