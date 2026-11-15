import { createContext, useContext, useCallback, useRef, useState } from 'react'
import { Modal } from './Overlay.jsx'
import { Button } from '../ui/Button.jsx'

// Imperative confirm() for destructive actions (delete resume/account, unsave).
const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((opts) => {
    setState({
      title: 'Are you sure?',
      message: '',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      danger: false,
      ...opts,
    })
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (result) => {
    resolver.current?.(result)
    resolver.current = null
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(false)}
        title={state?.title}
        footer={
          state && (
            <>
              <Button variant="outline" onClick={() => close(false)}>
                {state.cancelLabel}
              </Button>
              <Button variant={state.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
                {state.confirmLabel}
              </Button>
            </>
          )
        }
      >
        {state?.message && <p className="text-muted">{state.message}</p>}
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
