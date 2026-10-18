import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'

export default function TiltCard({ children, className = '' }) {
  const ref = useRef(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const glow = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)

  const srx = useSpring(rx, { stiffness: 200, damping: 20 })
  const sry = useSpring(ry, { stiffness: 200, damping: 20 })
  const sglow = useSpring(glow, { stiffness: 120, damping: 20 })
  const bg = useMotionTemplate`radial-gradient(380px circle at ${gx}% ${gy}%, rgb(201 166 107 / 0.18), transparent 62%)`

  const move = (e) => {
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * 9)
    rx.set(-(py - 0.5) * 9)
    gx.set(px * 100)
    gy.set(py * 100)
    glow.set(1)
  }
  const leave = () => {
    rx.set(0)
    ry.set(0)
    glow.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={`relative ${className}`}
    >
      {children}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ backgroundImage: bg, opacity: sglow }}
      />
    </motion.div>
  )
}