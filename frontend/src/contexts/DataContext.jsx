// src/contexts/DataContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getMissions, getShifts } from '../services/db'
import { useAuth } from './AuthContext'
import { calcShift } from '../utils/calc'

const Ctx = createContext(null)
export const useData = () => useContext(Ctx)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMissionId, setActiveMissionId] = useState(() =>
    localStorage.getItem('activeMissionId') || null
  )
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [m, s] = await Promise.all([getMissions(user.uid), getShifts(user.uid)])
      if (!mounted.current) return
      setMissions(m)
      setShifts(s)
      if (!activeMissionId && m.length > 0) {
        setActiveMissionId(m[0].id)
        localStorage.setItem('activeMissionId', m[0].id)
      }
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    mounted.current = true
    load()
    return () => { mounted.current = false }
  }, [load])

  const selectMission = useCallback(id => {
    setActiveMissionId(id)
    localStorage.setItem('activeMissionId', id)
  }, [])

  const activeMission = missions.find(m => m.id === activeMissionId) ?? missions[0]
  const params = activeMission?.params
  const missionShifts = shifts.filter(s => s.missionId === activeMission?.id)
  const missionCalcs = missionShifts.map(s => calcShift(s, params))

  return (
    <Ctx.Provider value={{
      missions, shifts, loading,
      activeMission, activeMissionId, selectMission,
      missionShifts, missionCalcs, params,
      reload: load,
    }}>
      {children}
    </Ctx.Provider>
  )
}
