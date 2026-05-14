// src/pages/DashboardPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useTimer } from '../hooks/useTimer'
import { createShift } from '../services/db'
import BottomNav from '../components/layout/BottomNav'
import LiveTimerCard from '../components/timer/LiveTimerCard'
import ShiftCard from '../components/shifts/ShiftCard'
import { StatGrid, Skeleton, Alert, ProgressBar } from '../components/ui'
import { Plus, Zap, Calendar, ChevronRight, Briefcase } from 'lucide-react'
import {
  fmtH, fmtEur, sumCalcs, filterByWeek, filterByMonth,
  nextPayDate, missionProgress, calcShift, today
} from '../utils/calc'
import FinishShiftSheet from './FinishShiftSheet'

export default function DashboardPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { missions, missionShifts, missionCalcs, activeMission, params, loading, reload } = useData()
  const timer = useTimer(user?.uid, activeMission?.id)
  const [finishData, setFinishData] = useState(null) // données du shift terminé pour édition

  const weekShifts = filterByWeek(missionShifts)
  const monthShifts = filterByMonth(missionShifts)
  const weekCalcs = weekShifts.map(s => calcShift(s, params))
  const monthCalcs = monthShifts.map(s => calcShift(s, params))
  const weekStats = sumCalcs(weekCalcs)
  const monthStats = sumCalcs(monthCalcs)

  const todayStr = today()
  const todayShifts = missionShifts.filter(s => s.date === todayStr)
  const todayCalcs = todayShifts.map(s => calcShift(s, params))
  const progress = missionProgress(activeMission?.dateDebutMission, activeMission?.dateFinMission)
  const name = user?.displayName?.split(' ')[0] || ''

  async function handleTimerFinish(finished) {
    // Montrer une fiche de résumé + confirmation avant de sauvegarder
    setFinishData(finished)
  }

  async function saveFinishedShift(data) {
    if (!activeMission?.id) return
    await createShift(user.uid, activeMission.id, data)
    await timer.cancelShift() // reset le timer actif
    await reload()
    setFinishData(null)
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
          <Zap size={16} className="text-zinc-950" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-500 text-xs">Bonsoir{name ? `, ${name}` : ''} 👋</p>
          <h1 className="font-display font-bold text-white text-lg leading-tight truncate">
            {activeMission?.nomMission || 'Suivi Heures UPS'}
          </h1>
        </div>
        <button onClick={() => nav('/missions')} className="btn-icon">
          <Briefcase size={18} />
        </button>
      </header>

      <div className="page-body">
        {loading ? <LoadingSkeleton /> : (
          <>
            {missions.length === 0 && (
              <Alert type="warning">
                <strong>Aucun contrat.</strong> Crée un contrat pour commencer.
                <button onClick={() => nav('/missions/new')} className="block mt-1 text-amber-300 font-semibold">
                  Créer →
                </button>
              </Alert>
            )}

            {/* ── TIMER ── */}
            <LiveTimerCard timer={timer} params={params} onFinish={handleTimerFinish} />

            {/* ── Ajout manuel ── */}
            {!timer.hasActiveShift && (
              <button onClick={() => nav('/shifts/new')}
                className="btn-ghost w-full !py-3 !text-sm !rounded-2xl">
                <Plus size={16} />
                Ajouter un shift manuellement
              </button>
            )}

            {/* ── Progression mission ── */}
            {activeMission?.dateDebutMission && activeMission?.dateFinMission && (
              <div className="card-p">
                <div className="flex justify-between mb-2">
                  <span className="text-zinc-400 text-sm">Progression contrat</span>
                  <span className="text-amber-400 font-mono font-bold text-sm">{Math.round(progress * 100)}%</span>
                </div>
                <ProgressBar value={progress} />
                <div className="flex justify-between mt-1.5 text-xs text-zinc-600">
                  <span>{activeMission.dateDebutMission}</span>
                  <span>{activeMission.dateFinMission}</span>
                </div>
              </div>
            )}

            {/* ── Aujourd'hui ── */}
            {todayShifts.length > 0 && (
              <section>
                <p className="section-label">Aujourd'hui</p>
                <div className="space-y-2">
                  {todayShifts.map((s, i) => (
                    <ShiftCard key={s.id} shift={s} calc={todayCalcs[i]} onClick={() => nav(`/shifts/${s.id}/edit`)} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Semaine ── */}
            <section>
              <p className="section-label">Cette semaine</p>
              <div className="card-p">
                {weekShifts.length === 0
                  ? <p className="text-zinc-600 text-sm text-center py-2">Aucun shift cette semaine</p>
                  : <StatGrid stats={[
                      { label: 'Heures', value: fmtH(weekStats.totalReelMin), color: 'text-white' },
                      { label: 'Nuit', value: fmtH(weekStats.nuitMin), color: 'text-blue-300' },
                      { label: 'Brut', value: fmtEur(weekStats.brutTotal), color: 'text-amber-400' },
                      { label: 'Net ~78%', value: fmtEur(weekStats.netEstime), color: 'text-emerald-400' },
                    ]} />
                }
              </div>
            </section>

            {/* ── Mois ── */}
            <section>
              <p className="section-label">Ce mois</p>
              <div className="card-p space-y-4">
                {monthShifts.length === 0
                  ? <p className="text-zinc-600 text-sm text-center py-2">Aucun shift ce mois</p>
                  : <>
                      <StatGrid stats={[
                        { label: 'Heures', value: fmtH(monthStats.totalReelMin) },
                        { label: 'Nuit', value: fmtH(monthStats.nuitMin), color: 'text-blue-300' },
                        { label: 'Brut mensuel', value: fmtEur(monthStats.brutTotal), color: 'text-amber-400' },
                        { label: 'Net mensuel', value: fmtEur(monthStats.netEstime), color: 'text-emerald-400' },
                      ]} />

                      <div className="divider" />

                      <div>
                        <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-2">
                          Accumulées — versées fin de contrat
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
                            <p className="text-zinc-500 text-xs mb-1">IFM 10%</p>
                            <p className="font-mono font-bold text-white">{fmtEur(monthStats.ifm)}</p>
                          </div>
                          <div className="bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
                            <p className="text-zinc-500 text-xs mb-1">ICP 10%</p>
                            <p className="font-mono font-bold text-white">{fmtEur(monthStats.icp)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3">
                        <Calendar size={18} className="text-amber-400 shrink-0" />
                        <div>
                          <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">Prochain paiement</p>
                          <p className="text-white font-bold">Le {nextPayDate()}</p>
                        </div>
                      </div>
                    </>
                }
              </div>
            </section>

            {/* ── Récents ── */}
            {missionShifts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="section-label !mb-0">Récents</p>
                  <button onClick={() => nav('/historique')}
                    className="text-amber-400 text-xs font-bold flex items-center gap-1">
                    Tout <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {missionShifts.slice(0, 4).map((s, i) => (
                    <ShiftCard key={s.id} shift={s} calc={missionCalcs[i]} onClick={() => nav(`/shifts/${s.id}/edit`)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* Sheet de confirmation fin de shift */}
      {finishData && (
        <FinishShiftSheet
          data={finishData}
          params={params}
          onSave={saveFinishedShift}
          onCancel={() => setFinishData(null)}
        />
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade">
      <Skeleton className="h-40" />
      <Skeleton className="h-10" />
      <Skeleton className="h-36" />
      <Skeleton className="h-52" />
    </div>
  )
}
