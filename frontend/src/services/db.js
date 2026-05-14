// src/services/db.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc,
  query, where, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── MISSIONS ──────────────────────────────────────────────────

export async function getMissions(userId) {
  try {
    const q = query(collection(db, 'missions'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    const q2 = query(collection(db, 'missions'), where('userId', '==', userId))
    const snap = await getDocs(q2)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
  }
}

export async function createMission(userId, data) {
  const ref = await addDoc(collection(db, 'missions'), {
    userId,
    nomMission: data.nomMission || 'Mission UPS',
    entreprise: data.entreprise || 'UPS France',
    agenceInterim: data.agenceInterim || '',
    dateDebutMission: data.dateDebutMission || '',
    dateFinMission: data.dateFinMission || '',
    params: {
      tauxHoraire: Number(data.params?.tauxHoraire) || 12.527,
      primeNuitParHeure: Number(data.params?.primeNuitParHeure) || 2.49,
    },
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateMission(id, data) {
  const update = { updatedAt: serverTimestamp() }
  const fields = ['nomMission', 'entreprise', 'agenceInterim', 'dateDebutMission', 'dateFinMission', 'params']
  fields.forEach(f => { if (data[f] !== undefined) update[f] = data[f] })
  await updateDoc(doc(db, 'missions', id), update)
}

export async function deleteMission(id, userId) {
  const batch = writeBatch(db)
  // Supprimer sessions
  const sSnap = await getDocs(query(collection(db, 'sessions'), where('missionId', '==', id), where('userId', '==', userId)))
  sSnap.docs.forEach(d => batch.delete(d.ref))
  // Supprimer analyses
  const aSnap = await getDocs(query(collection(db, 'analyses'), where('missionId', '==', id), where('userId', '==', userId)))
  aSnap.docs.forEach(d => batch.delete(d.ref))
  batch.delete(doc(db, 'missions', id))
  await batch.commit()
}

// ── SESSIONS (shifts sauvegardés) ─────────────────────────────

export async function getShifts(userId, missionId = null) {
  try {
    const q = missionId
      ? query(collection(db, 'sessions'), where('userId', '==', userId), where('missionId', '==', missionId), orderBy('date', 'desc'))
      : query(collection(db, 'sessions'), where('userId', '==', userId), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    const q2 = missionId
      ? query(collection(db, 'sessions'), where('userId', '==', userId), where('missionId', '==', missionId))
      : query(collection(db, 'sessions'), where('userId', '==', userId))
    const snap = await getDocs(q2)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }
}

/**
 * Nouvelle structure shift avec support renfort et heures précises
 */
export async function createShift(userId, missionId, data) {
  const ref = await addDoc(collection(db, 'sessions'), {
    userId,
    missionId,
    // Dates
    date: data.date,
    // Horaires principaux
    heureDebut: data.heureDebut,
    heureFin: data.heureFin,
    pauseMinutes: Number(data.pauseMinutes) || 0,
    // Flags
    estFerie: data.estFerie || false,
    // Renfort — nouvelles heures dédiées (pas un %)
    renfort: {
      enabled: data.renfort?.enabled || false,
      heureDebut: data.renfort?.heureDebut || '',
      heureFin: data.renfort?.heureFin || '',
    },
    // Timestamps réels si vient du timer
    startTimeLocal: data.startTimeLocal || null,
    endTimeLocal: data.endTimeLocal || null,
    totalPauseMs: data.totalPauseMs || 0,
    isFromTimer: data.isFromTimer || false,
    // Divers
    commentaire: data.commentaire || '',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateShift(id, data) {
  await updateDoc(doc(db, 'sessions', id), {
    date: data.date,
    heureDebut: data.heureDebut,
    heureFin: data.heureFin,
    pauseMinutes: Number(data.pauseMinutes) || 0,
    estFerie: data.estFerie || false,
    renfort: {
      enabled: data.renfort?.enabled || false,
      heureDebut: data.renfort?.heureDebut || '',
      heureFin: data.renfort?.heureFin || '',
    },
    commentaire: data.commentaire || '',
    updatedAt: serverTimestamp(),
  })
}

export async function deleteShift(id) {
  await deleteDoc(doc(db, 'sessions', id))
}

// ── ANALYSES ──────────────────────────────────────────────────

export async function getAnalyses(userId, missionId) {
  try {
    const q = query(collection(db, 'analyses'), where('userId', '==', userId), where('missionId', '==', missionId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  } catch { return [] }
}
