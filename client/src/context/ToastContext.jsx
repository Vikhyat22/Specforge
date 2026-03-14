import { createContext, useContext, useState, useCallback } from 'react'
const ToastContext = createContext(null)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => {
      const next = [...prev, { id, message, type }]
      return next.slice(-3) // max 3 toasts
    })
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])
  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))
  const BORDER = { success: 'var(--green)', error: 'var(--coral)', info: 'var(--sky)' }
  const ICON = { success: '✓', error: '✕', info: 'i' }
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
        display:'flex', flexDirection:'column', gap:10, alignItems:'flex-end' }}>
        {toasts.map(t => (
          <div key={t.id}
            style={{ display:'flex', alignItems:'flex-start', gap:12,
              background:'var(--ink2)', border:`1px solid ${BORDER[t.type]}`,
              borderRadius:10, padding:'12px 16px', maxWidth:340, minWidth:240,
              boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
              animation:'slideIn 0.2s ease' }}>
            <span style={{ fontSize:11, fontWeight:700, color: BORDER[t.type],
              background:`${BORDER[t.type]}22`, borderRadius:'50%',
              width:20, height:20, display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0, marginTop:1 }}>
              {ICON[t.type]}
            </span>
            <span style={{ fontSize:12, color:'var(--text)', lineHeight:1.5, flex:1 }}>
              {t.message}
            </span>
            <button onClick={() => dismiss(t.id)}
              style={{ background:'none', border:'none', color:'var(--fog)',
                cursor:'pointer', fontSize:14, padding:0, lineHeight:1, flexShrink:0 }}>
              ×
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
