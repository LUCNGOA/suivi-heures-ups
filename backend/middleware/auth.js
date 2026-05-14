import admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const db = admin.firestore()

export async function requireAuth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant.' })
  try {
    const decoded = await admin.auth().verifyIdToken(h.split(' ')[1])
    req.uid = decoded.uid; next()
  } catch { res.status(401).json({ error: 'Token invalide.' }) }
}
