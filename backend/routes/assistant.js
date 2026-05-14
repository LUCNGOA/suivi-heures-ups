// backend/routes/assistant.js
import { Router } from 'express'
import { requireAuth, db } from '../middleware/auth.js'
import { repondreAssistant } from '../services/openai.js'

const router = Router()

router.post('/', requireAuth, async (req, res) => {
  const { messages, missionId } = req.body
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages[] requis.' })
  try {
    const contexte = await buildContexte(req.uid, missionId)
    const reponse = await repondreAssistant(messages, contexte)
    res.json({ reponse })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

async function buildContexte(uid, missionId) {
  const missSnap = await db.collection('missions').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(1).get()
  const missions = missSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const mission = missionId ? missions.find(m => m.id === missionId) || missions[0] : missions[0]
  if (!mission) return { message: 'Aucune mission.' }

  const sessSnap = await db.collection('sessions').where('missionId', '==', mission.id).where('userId', '==', uid).get()
  const sessions = sessSnap.docs.map(d => d.data())

  const TAUX = mission.params?.tauxHoraire || 12.527
  const PNUIT = mission.params?.primeNuitParHeure || 2.49
  let totalMin = 0, nuitMin = 0, brut = 0, nbRenfort = 0, nbFerie = 0

  for (const s of sessions) {
    const d = toMin(s.heureDebut), f = toMin(s.heureFin), p = Number(s.pauseMinutes) || 0
    let dur = f - d; if (dur <= 0) dur += 1440
    const reel = Math.max(0, dur - p)
    const nuit = Math.round(Math.max(0, Math.min(d + dur, 1440) - Math.max(d, 21 * 60)) * (dur > 0 ? reel / dur : 0))
    totalMin += reel; nuitMin += nuit
    const b = reel / 60 * TAUX + nuit / 60 * PNUIT
    brut += b
    if (s.renfort?.enabled) nbRenfort++
    if (s.estFerie) nbFerie++
  }

  const ifm = brut * 0.10, icp = (brut + ifm) * 0.10
  return {
    mission: { nom: mission.nomMission, tauxHoraire: TAUX, primeNuit: PNUIT, debut: mission.dateDebutMission, fin: mission.dateFinMission },
    stats: { nbShifts: sessions.length, totalHeures: Math.round(totalMin / 60 * 100) / 100, heuresNuit: Math.round(nuitMin / 60 * 100) / 100, nbRenfort, nbFerie, brutEstime: Math.round(brut * 100) / 100, netEstime: Math.round(brut * 0.78 * 100) / 100, ifmAccumulee: Math.round(ifm * 100) / 100, icpAccumulee: Math.round(icp * 100) / 100 }
  }
}

const toMin = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m }
export default router
