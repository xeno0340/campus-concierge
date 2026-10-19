import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function Cursor() {
  const [enabled] = useState(
    () =>
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [hover, setHover] = useState(false)
  const [label, setLabel] = useState('')
  const [pressed, setPressed] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 450, damping: 38, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 450, damping: 38, mass: 0.4 })

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-custom-cursor')

    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e) => {
      const el = e.target.closest?.('a, button, [data-cursor]')
      setHover(!!el)
      setLabel(el?.dataset?.cursor || '')
    }
    const down = () => setPressed(true)
    const up = () => setPressed(false)

    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over)
    window.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
      window.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ x, y }}
        className="pointer-events-none fixed top-0 left-0 z-[1000] mix-blend-difference"
      >
        <div className="-translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-white" />
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={{ x: sx, y: sy }}
        className="pointer-events-none fixed top-0 left-0 z-[999] mix-blend-difference"
      >
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2 grid place-items-center rounded-full border border-white"
          animate={{
            width: hover ? (label ? 84 : 56) : 34,
            height: hover ? (label ? 84 : 56) : 34,
            scale: pressed ? 0.85 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          {label && (
            <span className="text-[10px] font-medium tracking-[0.16em] text-white uppercase">{label}</span>
          )}
        </motion.div>
      </motion.div>
    </>
  )
}