// src/components/timer/LiveTimerCard.jsx
import { useState } from 'react'
import { Play, Pause, Square, RotateCcw, Moon, Clock } from 'lucide-react'
import { fmtTimer, fmtEur, DEFAULTS } from '../../utils/calc'

/**
 * Carte timer principal — affiche le timer en cours et les actions
 */
export default function LiveTimerCard({ timer, params, onFinish }) {
  const { isRunning, isPaused, hasActiveShift, elapsed, pauseElapsed,
    startShift, pauseShift, resumeShift, finishShift, cancelShift, activeShift } = timer

  const [starting, setStarting] = useState(false)
  const [showStartOptions, setShowStartOptions] = useState(false)
  const [startOpts, setStartOpts] = useState({ estFerie: false })

  const taux = params?.tauxHoraire ?? DEFAULTS.tauxHoraire
  const primeNuit = params?.primeNuitParHeure ?? DEFAULTS.primeNuitParHeure

  // Estimation brut live (simple)
  const elapsedH = elapsed / 3600
  const nightHoursApprox = estimateNightHoursLive(activeShift)
  const brutLive = elapsedH * taux + nightHoursApprox * primeNuit

  async function handleStart() {
    setStarting(true)
    await startShift(startOpts)
    setStarting(false)
    setShowStartOptions(false)
  }

  async function handleFinish() {
    const finished = await finishShift()
    if (finished && onFinish) {
      onFinish(finished)
    }
  }

  // ── Pas de shift actif ─────────────────────────────────────
  if (!hasActiveShift) {
    return (
      <div className="card-p space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-600" />
          <span className="text-zinc-500 text-sm font-medium">Aucun shift en cours</span>
        </div>

        {showStartOptions && (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-700 animate-in-up space-y-3">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Options de départ</p>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white text-sm">Jour férié</span>
              <div
                onClick={() => setStartOpts(o => ({ ...o, estFerie: !o.estFerie }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${startOpts.estFerie ? 'bg-amber-500' : 'bg-zinc-700'} cursor-pointer`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${startOpts.estFerie ? 'translate-x-6 left-0.5' : 'left-0.5'}`} />
              </div>
            </label>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowStartOptions(!showStartOptions)}
            className="btn-ghost !py-3 !px-3 !rounded-xl w-12 shrink-0"
          >
            ⚙️
          </button>
          <button
            onClick={handleStart}
            disabled={starting}
            className="btn-start flex-1"
          >
            <Play size={24} fill="white" />
            {starting ? 'Démarrage...' : 'START SHIFT'}
          </button>
        </div>
        <p className="text-zinc-600 text-xs text-center">Le timer continue même téléphone verrouillé</p>
      </div>
    )
  }

  // ── Shift actif ────────────────────────────────────────────
  return (
    <div className={`card-p space-y-5 ${isPaused ? 'border-amber-500/20' : 'border-emerald-500/20'}`}
      style={{ borderColor: isPaused ? 'rgba(245,166,35,.25)' : 'rgba(74,222,128,.2)' }}>

      {/* Statut */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
          <span className={`text-sm font-bold ${isPaused ? 'text-amber-300' : 'text-emerald-300'}`}>
            {isPaused ? 'EN PAUSE' : 'SHIFT EN COURS'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeShift?.estFerie && <span className="badge-ferie">Férié</span>}
          {activeShift?.date && (
            <span className="text-zinc-500 text-xs">{activeShift.date}</span>
          )}
        </div>
      </div>

      {/* Timer principal */}
      <div className="text-center py-2">
        <div className={`timer-display ${isPaused ? 'timer-paused' : ''}`}>
          {fmtTimer(elapsed)}
        </div>
        <p className="text-zinc-500 text-xs mt-2">
          {isPaused ? `⏸ Pause : ${fmtTimer(pauseElapsed)}` : 'Temps travaillé effectif'}
        </p>
      </div>

      {/* Estimation live */}
      <div className="bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-zinc-500" />
          <span className="text-zinc-400 text-sm">Brut estimé</span>
        </div>
        <span className="text-amber-400 font-display font-bold text-lg">{fmtEur(brutLive)}</span>
      </div>

      {/* Heures de nuit si applicable */}
      {nightHoursApprox > 0 && (
        <div className="flex items-center gap-2 text-blue-300 text-xs">
          <Moon size={12} />
          <span>{(nightHoursApprox * 60).toFixed(0)}min de nuit détectées</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {isRunning ? (
          <button onClick={pauseShift} className="btn-pause">
            <Pause size={20} />
            PAUSE
          </button>
        ) : (
          <button onClick={resumeShift} className="btn-resume">
            <Play size={20} />
            REPRENDRE
          </button>
        )}
        <button onClick={handleFinish} className="btn-stop">
          <Square size={18} fill="currentColor" />
          FIN
        </button>
      </div>

      {/* Annuler */}
      <button onClick={cancelShift} className="text-zinc-600 text-xs text-center w-full hover:text-zinc-400 transition-colors">
        <RotateCcw size={12} className="inline mr-1" />
        Annuler ce shift
      </button>
    </div>
  )
}

/** Estime les heures de nuit à partir de l'heure de début du timer */
function estimateNightHoursLive(activeShift) {
  if (!activeShift?.startTimeLocal) return 0
  const start = new Date(activeShift.startTimeLocal)
  const now = new Date()
  const startMin = start.getHours() * 60 + start.getMinutes()
  const NIGHT_START = 21 * 60
  const nowMin = now.getHours() * 60 + now.getMinutes()

  // Minutes de nuit passées depuis le début
  let nightMin = 0
  if (startMin >= NIGHT_START) {
    nightMin = Math.min(nowMin + (now.getDay() !== start.getDay() ? 1440 : 0), 1440) - startMin
  } else if (nowMin < 21 * 60 && now.getHours() < 6) {
    // Après minuit avant 6h
    nightMin = nowMin + (1440 - NIGHT_START)
  } else if (nowMin >= NIGHT_START) {
    nightMin = nowMin - NIGHT_START
  }

  return Math.max(0, nightMin) / 60
}
