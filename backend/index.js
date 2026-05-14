import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import analyseRouter from './routes/analyse.js'
import assistantRouter from './routes/assistant.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))
const aiLimit = rateLimit({ windowMs: 60 * 1000, max: 10 })

app.get('/health', (_, res) => res.json({ ok: true, version: '4.0.0' }))
app.use('/api/analyse', aiLimit, analyseRouter)
app.use('/api/assistant', aiLimit, assistantRouter)
app.use((_, res) => res.status(404).json({ error: 'Route introuvable' }))
app.use((err, req, res, next) => { console.error(err.message); res.status(500).json({ error: err.message }) })

app.listen(PORT, () => console.log(`✅ Backend v4 — port ${PORT}`))
