import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useStore } from '../store.jsx'

// กล่องแจ้งเตือนมุมขวาบน
const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const STYLES = {
  success: 'border-sage-200 bg-white text-sage-800',
  error: 'border-red-200 bg-white text-red-700',
  info: 'border-slateblue-200 bg-white text-slateblue-800',
}

const ICON_COLOR = {
  success: 'text-sage-500',
  error: 'text-red-500',
  info: 'text-slateblue-500',
}

export default function Toasts() {
  const { toasts, dismissToast } = useStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] ?? Info
        return (
          <div
            key={t.id}
            className={`animate-toast-in flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/5 ${STYLES[t.type]}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ICON_COLOR[t.type]}`} />
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
