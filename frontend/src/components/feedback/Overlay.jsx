import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { duration, ease } from '../../lib/motionTokens.js'
import { cn } from '../../utils/cn.js'

function useDismiss(open, onClose, panelRef) {
  useEffect(() => {
    if (!open) return
    const prevActive = document.activeElement
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    // Move focus into the dialog (Animation spec §L: restore focus on close).
    panelRef.current?.focus()
    const { body } = document
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      body.style.overflow = prevOverflow
      prevActive instanceof HTMLElement && prevActive.focus()
    }
  }, [open, onClose, panelRef])
}

export function Modal({ open, onClose, title, children, footer }) {
  const panelRef = useRef(null)
  useDismiss(open, onClose, panelRef)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.overlay }}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass-strong relative z-10 w-full max-w-md rounded-2xl p-5 focus:outline-none"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: duration.overlay, ease: ease.standard }}
          >
            {title && (
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">{title}</h2>
                <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:text-text">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="text-sm text-text">{children}</div>
            {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function Drawer({ open, onClose, title, children, side = 'right' }) {
  const panelRef = useRef(null)
  useDismiss(open, onClose, panelRef)
  const isRight = side === 'right'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.overlay }}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'glass-strong absolute top-0 h-full w-[85%] max-w-sm p-5 focus:outline-none',
              isRight ? 'right-0' : 'left-0',
            )}
            initial={{ x: isRight ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRight ? '100%' : '-100%' }}
            transition={{ duration: duration.overlay, ease: ease.standard }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
