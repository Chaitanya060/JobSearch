import { useReducedMotion } from 'motion/react'

// Thin wrapper so components import one project hook (Animation spec §11).
export function useReducedMotionPreference() {
  return useReducedMotion()
}
