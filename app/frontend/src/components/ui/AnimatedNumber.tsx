'use client'
// Smooth number count-up with ease-out cubic. Used on the hero / submit flow
// so the life-score number rolls in rather than snapping.
import { useEffect, useRef, useState } from 'react'

export function AnimatedNumber({
  value,
  duration = 900,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return
    startRef.current = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - (startRef.current ?? now)
      const t = Math.min(1, elapsed / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span className={className}>{display}</span>
}
