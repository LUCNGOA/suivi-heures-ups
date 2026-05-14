// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ShiftFormPage from './pages/ShiftFormPage'
import MissionsPage from './pages/MissionsPage'
import MissionFormPage from './pages/MissionFormPage'
import HistoriquePage from './pages/HistoriquePage'
import AnalysePage from './pages/AnalysePage'
import ProfilPage from './pages/ProfilPage'
import AIFloatingButton from './components/ai/AIFloatingButton'

function Guard({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/auth" replace />
}

function Inner() {
  const { user } = useAuth()
  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
        <Route path="/" element={<Guard><DashboardPage /></Guard>} />
        <Route path="/shifts/new" element={<Guard><ShiftFormPage /></Guard>} />
        <Route path="/shifts/:id/edit" element={<Guard><ShiftFormPage /></Guard>} />
        <Route path="/missions" element={<Guard><MissionsPage /></Guard>} />
        <Route path="/missions/new" element={<Guard><MissionFormPage /></Guard>} />
        <Route path="/missions/:id/edit" element={<Guard><MissionFormPage /></Guard>} />
        <Route path="/historique" element={<Guard><HistoriquePage /></Guard>} />
        <Route path="/analyse" element={<Guard><AnalysePage /></Guard>} />
        <Route path="/profil" element={<Guard><ProfilPage /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <AIFloatingButton />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Inner />
      </DataProvider>
    </AuthProvider>
  )
}
