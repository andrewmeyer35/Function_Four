'use client'
// Lightweight CSS-only confetti burst. Renders a fixed-position layer of
// emoji particles with randomized trajectories, then self-unmounts after
// the animation finishes. No canvas, no deps.
import { useEffect, useState } from 'react'

const PIECES = ['🎉', '✨', '🎊', '⭐', '💫', '🔥', '💖', '💛', '💙', '💚']

export function Confetti({ run, duration = 2400 }: { run: boolean; duration?: number }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!run) return
    setMounted(true)
    const id = setTimeout(() => setMounted(false), duration + 200)
    return () => clearTimeout(id)
  }, [run, duration])

  if (!mounted) return null

  // Generate particles once per mount.
  const count = 60
  const particles = Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100
    const x0 = `${(Math.random() - 0.5) * 40}px`
    const x1 = `${(Math.random() - 0.5) * 260}px`
    const dur = 1600 + Math.random() * 1600
    const delay = Math.random() * 400
    const emoji = PIECES[i % PIECES.length]
    return { left, x0, x1, dur, delay, emoji, key: i }
  })

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.key}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              ['--x0' as string]: p.x0,
              ['--x1' as string]: p.x1,
              ['--dur' as string]: `${p.dur}ms`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
