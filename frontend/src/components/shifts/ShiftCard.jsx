// src/components/shifts/ShiftCard.jsx
import { Moon, Zap, Star } from 'lucide-react'
import { fmtH, fmtEur } from '../../utils/calc'

export default function ShiftCard({ shift, calc, onClick }) {
  const date = new Date(shift.date + 'T00:00:00')
  return (
    <button onClick={onClick} className="card-tap w-full text-left flex items-stretch gap-4">
      {/* Date */}
      <div className="flex flex-col items-center justify-center bg-zinc-800 rounded-xl px-3 border border-zinc-700 min-w-[54px] shrink-0">
        <span className="text-zinc-400 text-xs font-bold uppercase">
          {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
        </span>
        <span className="font-display font-bold text-2xl text-white leading-tight">{date.getDate()}</span>
        <span className="text-zinc-500 text-xs">{date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-semibold text-sm">
            {shift.heureDebut} → {shift.heureFin}
          </span>
          {shift.pauseMinutes > 0 && (
            <span className="text-zinc-500 text-xs">−{shift.pauseMinutes}min</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className="text-zinc-400 text-xs font-mono">{fmtH(calc.totalReelMin)}</span>
          {calc.nuitH > 0 && (
            <span className="badge-night"><Moon size={9} />{fmtH(calc.nuitMin)}</span>
          )}
          {calc.hasRenfort && (
            <span className="badge-renfort"><Zap size={9} />Renfort</span>
          )}
          {calc.estFerie && (
            <span className="badge-ferie"><Star size={9} />Férié</span>
          )}
          {shift.isFromTimer && (
            <span className="text-zinc-600 text-xs">⏱ Timer</span>
          )}
        </div>
        {shift.commentaire && (
          <p className="text-zinc-600 text-xs mt-1 italic truncate">"{shift.commentaire}"</p>
        )}
      </div>

      {/* Montant */}
      <div className="flex flex-col items-end justify-center shrink-0">
        <span className="text-amber-400 font-display font-bold text-lg">{fmtEur(calc.brutTotal)}</span>
        <span className="text-zinc-500 text-xs">{fmtEur(calc.netEstime)}</span>
      </div>
    </button>
  )
}
