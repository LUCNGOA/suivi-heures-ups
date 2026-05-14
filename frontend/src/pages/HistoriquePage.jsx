// src/pages/HistoriquePage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import BottomNav from '../components/layout/BottomNav'
import ShiftCard from '../components/shifts/ShiftCard'
import { Skeleton } from '../components/ui'
import { Plus, Search, Clock } from 'lucide-react'
import { calcShift, fmtH, fmtEur, sumCalcs } from '../utils/calc'

export default function HistoriquePage() {
  const { missionShifts, params, loading } = useData()
  const nav = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = missionShifts.filter(s =>
    !search || s.date?.includes(search) || s.commentaire?.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce((acc, s) => {
    const key = s.date?.slice(0, 7) || '?'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="font-display font-bold text-xl text-white flex-1">Historique</h1>
        <button onClick={() => nav('/shifts/new')} className="btn-icon !bg-amber-500 !text-zinc-950 !border-0 !w-9 !h-9">
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </header>
      <div className="page-body">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Date, note..." style={{ paddingLeft: 44 }} />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="card-p text-center py-14">
            <Clock size={44} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-300 font-bold text-lg">Aucun shift</p>
            <p className="text-zinc-600 text-sm mt-1 mb-6">Commence à tracker tes shifts.</p>
            <button onClick={() => nav('/shifts/new')} className="btn-primary !w-auto !px-8"><Plus size={18} />Ajouter</button>
          </div>
        ) : months.map(month => {
          const sArr = grouped[month]
          const calcs = sArr.map(s => calcShift(s, params))
          const stats = sumCalcs(calcs)
          const [yr, mo] = month.split('-')
          const label = new Date(+yr, +mo - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          return (
            <section key={month}>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <p className="section-label !mb-0 capitalize">{label}</p>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-xs font-mono">{fmtH(stats.totalReelMin)}</span>
                  <span className="text-amber-400 font-bold text-sm">{fmtEur(stats.brutTotal)}</span>
                </div>
              </div>
              <div className="space-y-2">
                {sArr.map((s, i) => (
                  <ShiftCard key={s.id} shift={s} calc={calcs[i]} onClick={() => nav(`/shifts/${s.id}/edit`)} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
