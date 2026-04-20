import { useEffect } from 'react'
import { useToast } from '../context/ToastContext'

const AUTO_HIDE_MS = 3500

export default function Toast() {
  const { toast, hideToast } = useToast()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(hideToast, AUTO_HIDE_MS)
    return () => clearTimeout(t)
  }, [toast, hideToast])

  if (!toast) return null

  return (
    <div
      className={`toast toast-${toast.type}`}
      role="alert"
      aria-live="polite"
    >
      {toast.message}
    </div>
  )
}
