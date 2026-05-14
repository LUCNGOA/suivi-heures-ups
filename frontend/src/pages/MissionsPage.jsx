// src/pages/MissionsPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { deleteMission } from '../services/db'
import BottomNav from '../components/layout/BottomNav'
import { ProgressBar, ConfirmSheet, Skeleton } from '../components/ui'
import { Plus, Edit3, Trash2, CheckCircle, Briefcase } from 'lucide-react'
import { missionProgress } from '../utils/calc'

export default function MissionsPage() {
  const { user } = useAuth()
  const { missions, activeMissionId, selectMission, loading, reload } = useData()
  const nav = useNavigate()
  const [toDelete, setToDelete] = useState(null)

  async function handleDelete() {
    if (!toDelete) return
    await deleteMission(toDelete.id, user.uid)
    await reload()
    setToDelete(null)
  }

  function fmtDate(s) {
    if (!s) return ''
    return new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="font-display font-bold text-xl text-white flex-1">Contrats</h1>
        <button onClick={() => nav('/missions/new')} className="btn-icon !bg-amber-500 !text-zinc-950 !border-0 !w-9 !h-9">
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </header>

      <div className="page-body">
        {loading ? (
          <div className="space-y-3"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
        ) : missions.length === 0 ? (
          <div className="card-p text-center py-14">
            <Briefcase size={44} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-200 font-bold text-lg">Aucun contrat</p>
            <p className="text-zinc-500 text-sm mt-1 mb-6">Crée ton contrat UPS pour commencer.</p>
            <button onClick={() => nav('/missions/new')} className="btn-primary !w-auto !px-8">
              <Plus size={18} />Nouveau contrat
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map(m => {
              const prog = missionProgress(m.dateDebutMission, m.dateFinMission)
              const isActive = m.id === activeMissionId
              return (
                <div key={m.id} className="card-p relative"
                  style={isActive ? { borderColor: 'rgba(245,166,35,.3)' } : {}}>

                  {isActive && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-amber-400 text-xs font-bold">
                      <CheckCircle size={14} />Actif
                    </div>
                  )}

                  <h3 className="font-display font-bold text-white text-lg pr-20">{m.nomMission}</h3>
                  {m.entreprise && <p className="text-zinc-300 text-sm">{m.entreprise}</p>}
                  {m.agenceInterim && <p className="text-zinc-500 text-xs">{m.agenceInterim}</p>}
                  {m.dateDebutMission && (
                    <p className="text-zinc-600 text-xs mt-2">{fmtDate(m.dateDebutMission)}{m.dateFinMission ? ` → ${fmtDate(m.dateFinMission)}` : ''}</p>
                  )}
                  {m.dateDebutMission && m.dateFinMission && (
                    <div className="mt-3"><div className="flex justify-between text-xs text-zinc-600 mb-1"><span>Progression</span><span>{Math.round(prog * 100)}%</span></div><ProgressBar value={prog} /></div>
                  )}
                  <p className="text-zinc-700 text-xs mt-2">{m.params?.tauxHoraire ?? 12.527}€/h · {m.params?.primeNuitParHeure ?? 2.49}€/h nuit</p>

                  <div className="flex gap-2 mt-4">
                    {!isActive && (
                      <button onClick={() => selectMission(m.id)} className="btn-ghost !py-2 !text-xs flex-1">
                        <CheckCircle size={13} />Activer
                      </button>
                    )}
                    <button onClick={() => nav(`/missions/${m.id}/edit`)} className="btn-ghost !py-2 !text-xs flex-1">
                      <Edit3 size={13} />Modifier
                    </button>
                    <button onClick={() => setToDelete(m)} className="btn-danger !py-2 !text-xs flex-1">
                      <Trash2 size={13} />Supprimer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
      {toDelete && (
        <ConfirmSheet title={`Supprimer "${toDelete.nomMission}" ?`}
          message="Tous les shifts associés seront supprimés. Irréversible."
          onConfirm={handleDelete} onCancel={() => setToDelete(null)} danger />
      )}
    </div>
  )
}
