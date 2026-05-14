// src/services/api.js
const BASE = '/api'

export async function analyserFiche(file, missionId, token) {
  const form = new FormData()
  form.append('fichier', file)
  form.append('missionId', missionId)
  const res = await fetch(`${BASE}/analyse`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur analyse')
  return data
}

export async function chatAssistant(messages, missionId, token) {
  const res = await fetch(`${BASE}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages, missionId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur assistant')
  return data
}
