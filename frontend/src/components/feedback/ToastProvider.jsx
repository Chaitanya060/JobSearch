import { createContext, useContext, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { duration } from '../../lib/motionTokens.js'

const ToastContext = createContext(null)
const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }
const TONES = { success: 'text-success', error: 'text-error', info: 'text-info' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (message, { type = 'info', duration: ms = 4000 } = {}) => {
      const id = ++idRef.current
      // Cap the stack (Animation spec §M).
      setToasts((t) => [...t.slice(-3), { id, message, type }])
      setTimeout(() => dismiss(id), ms)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2">
          <AnimatePresence>
            {toasts.map((t) => {
              const Icon = ICONS[t.type]
              return (
                <motion.div
                  key={t.id}
                  role="status"
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: duration.component }}
                  className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3 shadow-lg"
                >
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${TONES[t.type]}`} aria-hidden />
                  <p className="flex-1 text-sm text-text">{t.message}</p>
                  <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-text">
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
