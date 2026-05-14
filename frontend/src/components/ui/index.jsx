// src/components/ui/index.jsx
import { Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react'

export const Spinner = ({ size = 20, className = '' }) =>
  <Loader2 size={size} className={`animate-spin ${className}`} />

export const Skeleton = ({ className = '' }) =>
  <div className={`skel ${className}`} />

export function Toggle({ checked, onChange, label, sub }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
        checked ? 'border-amber-500/25 bg-amber-500/5' : 'border-zinc-700 bg-zinc-900'
      }`}>
      <div>
        {label && <p className="text-white text-sm font-medium text-left">{label}</p>}
        {sub && <p className="text-zinc-500 text-xs text-left">{sub}</p>}
      </div>
      <div className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 ${checked ? 'bg-amber-500' : 'bg-zinc-700'}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </button>
  )
}

export function Alert({ type = 'info', children }) {
  const s = {
    info: { bg: 'bg-blue-500/10 border-blue-500/20 text-blue-300', icon: <Info size={16} /> },
    success: { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300', icon: <CheckCircle size={16} /> },
    warning: { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-300', icon: <AlertTriangle size={16} /> },
    error: { bg: 'bg-red-500/10 border-red-500/20 text-red-300', icon: <AlertTriangle size={16} /> },
  }[type]
  return (
    <div className={`${s.bg} border rounded-2xl px-4 py-3 text-sm flex items-start gap-2`}>
      <span className="shrink-0 mt-0.5">{s.icon}</span>
      <div>{children}</div>
    </div>
  )
}

export function ProgressBar({ value }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  )
}

export function ConfirmSheet({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmer', danger }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h3 className="font-display font-bold text-xl text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Annuler</button>
          <button onClick={onConfirm}
            className={`flex-1 btn py-3.5 rounded-2xl ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function StatGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(({ label, value, color, sub }) => (
        <div key={label} className="bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
          <p className="stat-label mb-1">{label}</p>
          <p className={`stat-val text-xl ${color || 'text-white'}`}>{value}</p>
          {sub && <p className="text-zinc-600 text-xs mt-0.5">{sub}</p>}
        </div>
      ))}
    </div>
  )
}
