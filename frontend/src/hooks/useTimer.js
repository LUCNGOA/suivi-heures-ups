// src/hooks/useTimer.js
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  doc, setDoc, onSnapshot, serverTimestamp, updateDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { today } from '../utils/calc'

/**
 * Hook timer temps réel — persisté dans Firestore
 * Fonctionne même si le téléphone est verrouillé (calcul basé sur timestamps serveur)
 */
export function useTimer(userId, missionId) {
  const [activeShift, setActiveShift] = useState(null)
  const [elapsed, setElapsed] = useState(0)       // secondes travaillées (hors pause)
  const [pauseElapsed, setPauseElapsed] = useState(0) // secondes en pause
  const [loading, setLoading] = useState(true)
  const tickRef = useRef(null)
  const shiftRef = useRef(null) // dernière valeur sans re-subscribe

  // Chemin Firestore du shift actif
  const docPath = userId ? `activeShifts/${userId}` : null

  // ── Subscribe au shift actif en Firestore ─────────────────
  useEffect(() => {
    if (!docPath) return
    const unsub = onSnapshot(doc(db, docPath), snap => {
      const data = snap.exists() ? snap.data() : null
      setActiveShift(data)
      shiftRef.current = data
      setLoading(false)
    })
    return unsub
  }, [docPath])

  // ── Tick toutes les secondes ───────────────────────────────
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const shift = shiftRef.current
      if (!shift || shift.status === 'idle') { setElapsed(0); return }

      const now = Date.now()
      const startMs = shift.startTime?.toMillis?.() ?? shift.startTime ?? now

      // Total pause accumulée
      let totalPauseMs = (shift.totalPauseMs ?? 0)
      if (shift.status === 'paused' && shift.pauseStart) {
        const pauseStartMs = shift.pauseStart?.toMillis?.() ?? shift.pauseStart ?? now
        totalPauseMs += (now - pauseStartMs)
        setPauseElapsed(Math.floor((now - pauseStartMs) / 1000))
      } else {
        setPauseElapsed(0)
      }

      const workedMs = now - startMs - totalPauseMs
      setElapsed(Math.max(0, Math.floor(workedMs / 1000)))
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [])

  // ── START ──────────────────────────────────────────────────
  const startShift = useCallback(async (opts = {}) => {
    if (!userId || !missionId) return
    const startTime = new Date()
    const data = {
      userId,
      missionId,
      date: today(),
      status: 'running',  // 'running' | 'paused' | 'finished' | 'idle'
      startTime,
      startTimeLocal: startTime.toISOString(),
      pauseStart: null,
      totalPauseMs: 0,
      estFerie: opts.estFerie ?? false,
      renfort: opts.renfort ?? { enabled: false, heureDebut: '', heureFin: '' },
      commentaire: opts.commentaire ?? '',
      updatedAt: serverTimestamp(),
    }
    await setDoc(doc(db, `activeShifts/${userId}`), data)
  }, [userId, missionId])

  // ── PAUSE ──────────────────────────────────────────────────
  const pauseShift = useCallback(async () => {
    if (!userId || activeShift?.status !== 'running') return
    await updateDoc(doc(db, `activeShifts/${userId}`), {
      status: 'paused',
      pauseStart: new Date(),
      updatedAt: serverTimestamp(),
    })
  }, [userId, activeShift])

  // ── REPRENDRE ──────────────────────────────────────────────
  const resumeShift = useCallback(async () => {
    if (!userId || activeShift?.status !== 'paused') return
    const now = Date.now()
    const pauseStartMs = activeShift.pauseStart?.toMillis?.() ?? activeShift.pauseStart?.getTime?.() ?? now
    const addedPause = now - pauseStartMs
    const newTotalPauseMs = (activeShift.totalPauseMs ?? 0) + addedPause
    await updateDoc(doc(db, `activeShifts/${userId}`), {
      status: 'running',
      pauseStart: null,
      totalPauseMs: newTotalPauseMs,
      updatedAt: serverTimestamp(),
    })
  }, [userId, activeShift])

  // ── FIN SHIFT ─────────────────────────────────────────────
  const finishShift = useCallback(async () => {
    if (!userId || !activeShift || activeShift.status === 'idle') return
    const now = new Date()
    const startMs = activeShift.startTime?.toMillis?.() ?? new Date(activeShift.startTimeLocal).getTime()
    let totalPauseMs = activeShift.totalPauseMs ?? 0
    if (activeShift.status === 'paused' && activeShift.pauseStart) {
      const psMs = activeShift.pauseStart?.toMillis?.() ?? activeShift.pauseStart?.getTime?.() ?? Date.now()
      totalPauseMs += (Date.now() - psMs)
    }
    const workedMs = Math.max(0, now.getTime() - startMs - totalPauseMs)
    const totalPauseMinutes = Math.round(totalPauseMs / 60000)

    // Convertir en HH:MM local
    const toHHMM = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    const startDate = new Date(startMs)

    const finished = {
      ...activeShift,
      status: 'finished',
      endTime: now,
      endTimeLocal: now.toISOString(),
      heureDebut: toHHMM(startDate),
      heureFin: toHHMM(now),
      pauseMinutes: totalPauseMinutes,
      totalWorkedMinutes: Math.round(workedMs / 60000),
      totalPauseMs,
      finishedAt: serverTimestamp(),
    }
    return finished
  }, [userId, activeShift])

  // ── ANNULER ───────────────────────────────────────────────
  const cancelShift = useCallback(async () => {
    if (!userId) return
    await setDoc(doc(db, `activeShifts/${userId}`), { status: 'idle', userId })
  }, [userId])

  const isRunning = activeShift?.status === 'running'
  const isPaused = activeShift?.status === 'paused'
  const hasActiveShift = isRunning || isPaused

  return {
    activeShift,
    elapsed,        // secondes de travail effectif
    pauseElapsed,   // secondes en pause
    loading,
    isRunning,
    isPaused,
    hasActiveShift,
    startShift,
    pauseShift,
    resumeShift,
    finishShift,
    cancelShift,
  }
}
