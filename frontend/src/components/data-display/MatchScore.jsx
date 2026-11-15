import { motion } from 'motion/react'
import { matchBand } from '../../utils/match.js'
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference.js'
import { cn } from '../../utils/cn.js'

const toneStroke = {
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  muted: 'var(--color-text-muted)',
}

// Literal classes so Tailwind's scanner keeps them.
const toneText = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  muted: 'text-muted',
}

// Ring + text. Labelled "Profile match", never a hiring probability (guide §11).
export function MatchScore({ score = 0, size = 56, stroke = 5, showLabel = true }) {
  const reduce = useReducedMotionPreference()
  const band = matchBand(score)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - score / 100)

  return (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0" style={{ width: size, height: size }} title={`Profile match ${score}%`}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={toneStroke[band.tone]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: reduce ? offset : c }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: reduce ? 0 : 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </svg>
        <span className="tabular absolute inset-0 flex items-center justify-center text-sm font-semibold text-text">
          {score}
        </span>
      </div>
      {showLabel && (
        <div className="leading-tight">
          <p className="text-xs text-muted">Profile match</p>
          <p className={cn('text-sm font-medium', toneText[band.tone])}>{band.label}</p>
        </div>
      )}
    </div>
  )
}
