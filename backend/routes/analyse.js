// backend/routes/analyse.js
import { Router } from 'express'
import multer from 'multer'
import { requireAuth, db } from '../middleware/auth.js'
import { analyserFichePaie } from '../services/openai.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, f, cb) => cb(['image/jpeg','image/png','image/webp','application/pdf'].includes(f.mimetype) ? null : new Error('Format non supporté'), true) })

router.post('/', requireAuth, upload.single('fichier'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier.' })
  const { missionId } = req.body
  if (!missionId) return res.status(400).json({ error: 'missionId requis.' })
  try {
    const sessSnap = await db.collection('sessions').where('missionId', '==', missionId).where('userId', '==', req.uid).get()
    const sessions = sessSnap.docs.map(d => d.data())
    const contexte = buildContexte(sessions)
    const analyse = await analyserFichePaie(req.file.buffer.toString('base64'), req.file.mimetype, contexte)
    await db.collection('analyses').add({ userId: req.uid, missionId, analyse, createdAt: new Date().toISOString() })
    res.json(analyse)
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }) }
})

function buildContexte(sessions) {
  const TAUX = 12.527, PRIME_NUIT = 2.49, NIGHT = 21 * 60
  let totalMin = 0, nuitMin = 0, brut = 0
  for (const s of sessions) {
    const d = toMin(s.heureDebut), f = toMin(s.heureFin), p = Number(s.pauseMinutes) || 0
    let dur = f - d; if (dur <= 0) dur += 1440
    const reel = Math.max(0, dur - p)
    const nuit = Math.max(0, Math.min(d + dur, 1440) - Math.max(d, NIGHT))
    const nuitReel = Math.round(nuit * (dur > 0 ? reel / dur : 0))
    totalMin += reel; nuitMin += nuitReel
    brut += reel / 60 * TAUX + nuitReel / 60 * PRIME_NUIT
  }
  return { nombreSessions: sessions.length, totalHeures: totalMin / 60, heuresNuit: nuitMin / 60, brutEstime: Math.round(brut * 100) / 100 }
}

const toMin = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m }
export default router
