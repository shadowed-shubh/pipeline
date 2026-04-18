import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type, exiting: false }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl
              shadow-2xl max-w-sm cursor-pointer select-none
              ${toast.exiting ? 'toast-exit' : 'toast-enter'}
              ${toast.type === 'error'   ? 'bg-red-900/90 border border-red-700 text-white' :
                toast.type === 'warning' ? 'bg-orange-900/90 border border-orange-700 text-white' :
                                           'bg-card border border-primary/30 text-white'}
            `}
          >
            <span className="text-lg flex-shrink-0">
              {toast.type === 'error'   ? '❌' :
               toast.type === 'warning' ? '⚠️' : '✅'}
            </span>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
