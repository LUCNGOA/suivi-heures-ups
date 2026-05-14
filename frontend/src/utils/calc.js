// src/utils/calc.js
// ═══════════════════════════════════════════════════════════════
// LOGIQUE MÉTIER UPS INTÉRIM — VERSION CORRIGÉE
// ═══════════════════════════════════════════════════════════════

export const DEFAULTS = {
  tauxHoraire: 12.527,
  primeNuitParHeure: 2.49,   // prime fixe par heure de nuit
  heurDebNuit: 21,            // 21h → nuit commence
  heurFinNuit: 6,             // 6h → nuit se termine
  coeffNet: 0.78,
  ifmRate: 0.10,
  icpRate: 0.10,
}

// ── Utilitaires temps ─────────────────────────────────────────

/** "HH:MM" → minutes depuis minuit */
export const toMin = t => {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** timestamp ISO → minutes depuis minuit (heure locale) */
export const tsToMinLocal = ts => {
  const d = new Date(ts)
  return d.getHours() * 60 + d.getMinutes()
}

/** minutes → "Xh YYmin" */
export const fmtH = min => {
  if (!min || min <= 0) return '0h'
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.abs(min) % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/** nombre → "XX,XX €" */
export const fmtEur = n =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n ?? 0)

/** "YYYY-MM-DD" → Date locale */
export const parseDate = s => s ? new Date(s + 'T00:00:00') : new Date()

/** Today "YYYY-MM-DD" */
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/** Format date pour affichage */
export const fmtDate = (s, opts = {}) => {
  if (!s) return ''
  return parseDate(s).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', ...opts })
}

/** Format durée depuis secondes (pour timer live) */
export const fmtTimer = seconds => {
  const s = Math.abs(Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

// ── Logique nuit ───────────────────────────────────────────────

/**
 * Calcule les minutes de nuit dans un intervalle [startMin, endMin] (en minutes depuis minuit, peut dépasser 1440)
 * Nuit = [1260, 1440] ∪ [1440, 1800] soit 21h→6h
 */
function calcNightMin(startMin, endMin, nightStart = 21 * 60, nightEnd = 6 * 60) {
  // On travaille en minutes, endMin peut être > 1440 (passage minuit)
  const MIDNIGHT = 1440
  const NIGHT_END_NEXT = MIDNIGHT + nightEnd // 1800 min = 6h du lendemain

  let nuit = 0

  // Plage 1 : [nightStart .. MIDNIGHT] = [1260 .. 1440]
  const n1s = Math.max(startMin, nightStart)
  const n1e = Math.min(endMin, MIDNIGHT)
  if (n1e > n1s) nuit += n1e - n1s

  // Plage 2 : [MIDNIGHT .. NIGHT_END_NEXT] = [1440 .. 1800]
  const n2s = Math.max(startMin, MIDNIGHT)
  const n2e = Math.min(endMin, NIGHT_END_NEXT)
  if (n2e > n2s) nuit += n2e - n2s

  return Math.max(0, nuit)
}

// ── Logique jour férié ─────────────────────────────────────────

/**
 * Découpe un intervalle [startMin, endMin] selon la règle UPS :
 * Les heures fériées sont UNIQUEMENT celles qui tombent dans le jour J (jusqu'à minuit).
 * Si le shift passe minuit, les heures après minuit ne sont PLUS fériées.
 *
 * @param {boolean} estFerie - la date de début est un jour férié
 * @returns {{ ferieMin: number, normalMin: number }}
 */
export function splitFerie(startMin, endMin, estFerie) {
  if (!estFerie) return { ferieMin: 0, normalMin: endMin - startMin }

  const MIDNIGHT = 1440
  // Heures fériées = jusqu'à minuit
  const ferieMin = Math.max(0, Math.min(endMin, MIDNIGHT) - startMin)
  const normalMin = Math.max(0, endMin - MIDNIGHT)

  return { ferieMin, normalMin }
}

// ── Calcul principal d'un shift ────────────────────────────────

/**
 * Calcule un shift complet avec la logique UPS corrigée.
 *
 * @param {object} shift - données du shift
 * @param {object} params - { tauxHoraire, primeNuitParHeure }
 * @returns {object} - tous les montants calculés
 */
export function calcShift(shift, params = {}) {
  const taux = params.tauxHoraire ?? DEFAULTS.tauxHoraire
  const primeNuit = params.primeNuitParHeure ?? DEFAULTS.primeNuitParHeure
  const nightStart = (params.heurDebNuit ?? DEFAULTS.heurDebNuit) * 60

  // ─ Calcul durée principale ─
  const debut = toMin(shift.heureDebut)
  const fin = toMin(shift.heureFin)
  const pause = Number(shift.pauseMinutes) || shift.totalPauseMinutes || 0

  let brutDur = fin - debut
  if (brutDur <= 0) brutDur += 1440 // passage minuit
  const finAbs = debut + brutDur     // fin en absolu (peut > 1440)

  const reelMin = Math.max(0, brutDur - pause)
  const reelH = reelMin / 60

  // Heures de nuit sur durée brute → pro-ratée à durée réelle
  const nuitBrut = calcNightMin(debut, finAbs, nightStart)
  const ratio = brutDur > 0 ? reelMin / brutDur : 0
  const nuitMin = Math.round(nuitBrut * ratio)
  const nuitH = nuitMin / 60

  // Heures fériées (jusqu'à minuit seulement)
  const { ferieMin } = splitFerie(debut, finAbs, shift.estFerie || false)
  const ferieMinReel = Math.min(ferieMin, reelMin) // ne peut pas dépasser le réel

  // ─ Calcul renfort ─
  let renfortMin = 0, renfortNuitMin = 0, renfortFerieMin = 0
  const renfort = shift.renfort
  if (renfort?.enabled && renfort?.heureDebut && renfort?.heureFin) {
    const rDebut = toMin(renfort.heureDebut)
    const rFin = toMin(renfort.heureFin)
    let rBrut = rFin - rDebut
    if (rBrut <= 0) rBrut += 1440
    const rFinAbs = rDebut + rBrut

    renfortMin = rBrut
    renfortNuitMin = calcNightMin(rDebut, rFinAbs, nightStart)
    if (shift.estFerie) {
      const { ferieMin: rFerie } = splitFerie(rDebut, rFinAbs, shift.estFerie)
      renfortFerieMin = rFerie
    }
  }

  const totalReelMin = reelMin + renfortMin
  const totalReelH = totalReelMin / 60
  const totalNuitMin = nuitMin + renfortNuitMin
  const totalNuitH = totalNuitMin / 60
  const totalFerieMin = ferieMinReel + renfortFerieMin

  // ─ Calcul salaires ─
  const base = totalReelH * taux
  const pNuit = totalNuitH * primeNuit
  // Pas de pourcentage renfort — le renfort = heures supplémentaires déjà comptées dans totalReel
  const brutTotal = base + pNuit

  return {
    // Durées
    reelMin,
    totalReelMin,
    totalReelH: r3(totalReelH),
    nuitMin: totalNuitMin,
    nuitH: r3(totalNuitH),
    ferieMin: totalFerieMin,
    renfortMin,
    renfortNuitMin,
    // Montants
    base: r2(base),
    pNuit: r2(pNuit),
    brutTotal: r2(brutTotal),
    netEstime: r2(brutTotal * DEFAULTS.coeffNet),
    // Flags
    estFerie: shift.estFerie || false,
    hasRenfort: Boolean(renfort?.enabled && renfortMin > 0),
  }
}

// ── Agrégation ────────────────────────────────────────────────

export function sumCalcs(calcs) {
  const s = {
    totalReelMin: 0, nuitMin: 0, ferieMin: 0, renfortMin: 0,
    base: 0, pNuit: 0, brutTotal: 0,
    nbShifts: calcs.length, nbFerie: 0, nbRenfort: 0,
  }
  for (const c of calcs) {
    s.totalReelMin += c.totalReelMin
    s.nuitMin += c.nuitMin
    s.ferieMin += c.ferieMin
    s.renfortMin += c.renfortMin
    s.base += c.base
    s.pNuit += c.pNuit
    s.brutTotal += c.brutTotal
    if (c.estFerie) s.nbFerie++
    if (c.hasRenfort) s.nbRenfort++
  }
  s.totalReelH = s.totalReelMin / 60
  s.nuitH = s.nuitMin / 60
  s.netEstime = r2(s.brutTotal * DEFAULTS.coeffNet)
  s.ifm = r2(s.brutTotal * DEFAULTS.ifmRate)
  s.icp = r2((s.brutTotal + s.ifm) * DEFAULTS.icpRate)
  s.brutAvecPrimes = r2(s.brutTotal + s.ifm + s.icp)
  s.netFinal = r2(s.brutAvecPrimes * DEFAULTS.coeffNet)
  for (const k of Object.keys(s)) if (typeof s[k] === 'number') s[k] = r2(s[k])
  return s
}

// ── Filtres ───────────────────────────────────────────────────

export const filterByWeek = shifts => {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return shifts.filter(s => { const d = parseDate(s.date); return d >= monday && d <= sunday })
}

export const filterByMonth = shifts => {
  const now = new Date()
  return shifts.filter(s => {
    const d = parseDate(s.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
}

export const nextPayDate = () => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(9)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export const missionProgress = (debut, fin) => {
  if (!debut || !fin) return 0
  const s = parseDate(debut).getTime(), e = parseDate(fin).getTime(), n = Date.now()
  if (n <= s) return 0; if (n >= e) return 1
  return (n - s) / (e - s)
}

const r2 = n => Math.round(n * 100) / 100
const r3 = n => Math.round(n * 1000) / 1000
