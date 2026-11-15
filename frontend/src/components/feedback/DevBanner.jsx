import { USE_MOCKS } from '../../services/api.js'

// Persistent, honest disclaimer while the app shows mock data (spec §16).
export function DevBanner() {
  if (!USE_MOCKS) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center p-2">
      <span className="pointer-events-auto rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-xs font-medium text-warning shadow-[var(--shadow-sm)] backdrop-blur">
        DEMO DATA — not live vacancies
      </span>
    </div>
  )
}
