// Shared motion tokens (Animation spec §4). Reuse these — no arbitrary values.

export const duration = {
  instant: 0.1,
  micro: 0.15,
  component: 0.2,
  overlay: 0.22,
  route: 0.18,
  reveal: 0.45,
}

export const ease = {
  standard: [0.2, 0.8, 0.2, 1],
  enter: [0.16, 1, 0.3, 1], // Glass/Animation spec §2
  out: [0, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
}

export const spring = {
  gentle: { type: 'spring', stiffness: 170, damping: 26 },
  snappy: { type: 'spring', stiffness: 320, damping: 32 },
}

// Reusable variants
export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: duration.component, ease: ease.standard } },
}

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
