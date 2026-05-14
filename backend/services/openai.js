// backend/services/openai.js

async function callGemini(prompt, imageBase64 = null, mimeType = null) {
  const body = {
    contents: [
      {
        parts: []
      }
    ]
  }

  // Texte
  if (prompt) {
    body.contents[0].parts.push({
      text: prompt
    })
  }

  // Image / PDF
  if (imageBase64) {
    body.contents[0].parts.push({
      inline_data: {
        mime_type: mimeType,
        data: imageBase64
      }
    })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )

  const data = await response.json()

  console.log('Réponse Gemini :')
  console.log(JSON.stringify(data, null, 2))

  if (
    !data.candidates ||
    !data.candidates[0] ||
    !data.candidates[0].content ||
    !data.candidates[0].content.parts ||
    !data.candidates[0].content.parts[0]
  ) {
    throw new Error(
      data.error?.message || 'Réponse Gemini invalide'
    )
  }

  return data.candidates[0].content.parts[0].text
}

// ─────────────────────────────────────────────
// ANALYSE FICHE DE PAIE
// ─────────────────────────────────────────────

export async function analyserFichePaie(
  imageBase64,
  mimeType,
  contexte
) {
  const prompt = `
Tu es expert paie UPS France.

Règles métier :
- Travail de nuit à partir de 21h
- Jour férié majoré seulement jusqu'à minuit
- IFM = 10%
- ICP = 10%
- Renfort = heures supplémentaires spécifiques

Contexte utilisateur :
${JSON.stringify(contexte, null, 2)}

Analyse cette fiche de paie.

Réponds UNIQUEMENT avec du JSON valide.

Format :
{
  "resume": "",
  "anomalies": [],
  "heuresDetectees": 0,
  "salaireDetecte": 0,
  "conseil": ""
}
`

  const text = await callGemini(
    prompt,
    imageBase64,
    mimeType
  )

  try {
    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    return JSON.parse(cleaned)
  } catch (err) {
    console.log('Erreur parsing JSON')
    console.log(text)

    return {
      resume: 'Analyse partielle',
      anomalies: [],
      heuresDetectees: 0,
      salaireDetecte: 0,
      conseil: text
    }
  }
}

// ─────────────────────────────────────────────
// ASSISTANT IA
// ─────────────────────────────────────────────

export async function repondreAssistant(
  messages,
  contexte
) {
  const prompt = `
Tu es "Heures IA".

Tu aides un intérimaire UPS France.

Contexte :
${JSON.stringify(contexte, null, 2)}

Conversation :
${JSON.stringify(messages, null, 2)}

Réponds de façon concise et utile.
`

  return await callGemini(prompt)
}