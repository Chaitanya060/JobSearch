import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { duration, ease, fadeInUp, staggerParent } from '../../lib/motionTokens.js'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference.js'

export function FadeIn({ children, className, delay = 0, y = 12, as = 'div' }) {
  const reduce = useReducedMotionPreference()
  const Comp = motion[as] || motion.div
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.component, ease: ease.standard, delay: reduce ? 0 : delay }}
    >
      {children}
    </Comp>
  )
}

// While-in-view reveal for landing sections (triggers once).
export function Reveal({ children, className }) {
  const reduce = useReducedMotionPreference()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: duration.reveal, ease: ease.standard }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }) {
  const reduce = useReducedMotionPreference()
  return (
    <motion.div className={className} variants={reduce ? undefined : fadeInUp}>
      {children}
    </motion.div>
  )
}

// Count up once when real data loads; show final value immediately if reduced.
export function CountUpOnce({ value = 0, className }) {
  const reduce = useReducedMotionPreference()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce || !inView) {
      setDisplay(value)
      return
    }
    let raf
    const start = performance.now()
    const dur = 600
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur)
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, inView, reduce])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}

// One soft ambient gradient behind the landing hero (CSS handles the slow drift
// and reduced-motion pause). Parent must be position:relative + overflow-hidden.
export function AmbientGradient() {
  return <div className="ambient-gradient" aria-hidden />
}

// A translucent highlight that glides once across a surface on first view.
// Place inside a relative, overflow-hidden container (e.g. the hero preview).
export function GlassSweep() {
  const reduce = useReducedMotionPreference()
  if (reduce) return null
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
      initial={{ x: '-150%' }}
      whileInView={{ x: '350%' }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, ease: ease.enter, delay: 0.5 }}
    />
  )
}

export function PageTransition({ children }) {
  const reduce = useReducedMotionPreference()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.route, ease: ease.standard }}
    >
      {children}
    </motion.div>
  )
}
