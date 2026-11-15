import { useCallback, useEffect, useState } from 'react'

// Minimal data-fetch hook: { data, loading, error, reload }.
// A real app may swap this for TanStack Query; the call sites won't change much.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  const run = useCallback(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve(fn())
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(run, [run])

  return { ...state, reload: run }
}
