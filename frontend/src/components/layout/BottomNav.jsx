// src/components/layout/BottomNav.jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Clock, Briefcase, ScanText, User } from 'lucide-react'

const TABS = [
  { path: '/', icon: LayoutDashboard, label: 'Accueil' },
  { path: '/historique', icon: Clock, label: 'Historique' },
  { path: '/missions', icon: Briefcase, label: 'Contrats' },
  { path: '/analyse', icon: ScanText, label: 'Analyse' },
  { path: '/profil', icon: User, label: 'Profil' },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  return (
    <nav className="bottomnav">
      {TABS.map(({ path, icon: Icon, label }) => {
        const on = pathname === path
        return (
          <button key={path} onClick={() => nav(path)} className={`nav-item ${on ? 'on' : ''}`}>
            <Icon size={22} strokeWidth={on ? 2.5 : 1.8} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
