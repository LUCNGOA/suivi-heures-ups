// src/pages/ProfilPage.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import BottomNav from '../components/layout/BottomNav'
import { sumCalcs, fmtH, fmtEur } from '../utils/calc'
import { LogOut, User, Zap, Shield, Sparkles } from 'lucide-react'

export default function ProfilPage() {
  const { user, logout } = useAuth()
  const { missionCalcs } = useData()
  const nav = useNavigate()
  const stats = sumCalcs(missionCalcs)

  return (
    <div className="page">
      <header className="topbar"><h1 className="font-display font-bold text-xl text-white">Profil</h1></header>
      <div className="page-body">
        <div className="card-p flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#d97706,#f5a623)' }}>
            <User size={28} className="text-zinc-950" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-xl text-white truncate">{user?.displayName || 'Intérimaire UPS'}</p>
            <p className="text-zinc-500 text-sm truncate">{user?.email}</p>
          </div>
        </div>

        {missionCalcs.length > 0 && (
          <div className="card-p space-y-3">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Mission active — totaux</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Total heures', fmtH(stats.totalReelMin), 'text-white'],
                ['Heures nuit', fmtH(stats.nuitMin), 'text-blue-300'],
                ['Brut accumulé', fmtEur(stats.brutTotal), 'text-amber-400'],
                ['Net estimé', fmtEur(stats.netEstime), 'text-emerald-400'],
                ['IFM acc.', fmtEur(stats.ifm), 'text-zinc-300'],
                ['ICP acc.', fmtEur(stats.icp), 'text-zinc-300'],
              ].map(([label, val, color]) => (
                <div key={label} className="bg-zinc-900 rounded-xl px-3 py-2.5 border border-zinc-800">
                  <p className="text-zinc-600 text-xs mb-0.5">{label}</p>
                  <p className={`font-mono font-bold ${color}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card-p" style={{ borderColor: 'rgba(167,139,250,.15)', background: 'rgba(167,139,250,.04)' }}>
          <div className="flex items-center gap-2 mb-2"><Sparkles size={18} className="text-purple-400" /><p className="text-white font-semibold text-sm">Assistant IA actif</p></div>
          <p className="text-zinc-500 text-xs">Clique sur ✨ pour poser tes questions.</p>
        </div>

        <div className="card-p space-y-2">
          <div className="flex items-center gap-2 mb-1"><Zap size={16} className="text-amber-400" /><p className="text-white font-semibold text-sm">Suivi Heures UPS v4.0</p></div>
          <div className="space-y-1 text-xs text-zinc-600">
            <p>• Taux défaut : 12.527 €/h · Prime nuit : 2.49 €/h</p>
            <p>• Nuit à partir de 21h · Férié jusqu'à minuit seulement</p>
            <p>• Renfort = période dédiée, pas un %</p>
            <p>• Net estimé : brut × 78%</p>
            <p>• IFM 10% + ICP 10% → fin de contrat</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
          <Shield size={16} className="text-emerald-400 shrink-0" />
          <p className="text-zinc-500 text-xs">Données sécurisées Firebase · Timer persisté cloud</p>
        </div>

        <button onClick={async () => { await logout(); nav('/auth') }} className="btn-danger w-full !rounded-2xl">
          <LogOut size={18} />Se déconnecter
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
