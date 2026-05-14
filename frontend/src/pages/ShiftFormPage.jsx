// src/pages/ShiftFormPage.jsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { getShifts, createShift, updateShift, deleteShift } from '../services/db'
import { calcShift, fmtH, fmtEur, toMin, today } from '../utils/calc'
import { DateInput } from '../components/calendar/DatePicker'
import { Toggle, Spinner, ConfirmSheet } from '../components/ui'
import { ArrowLeft, Trash2, Save, Moon, Clock } from 'lucide-react'

export default function ShiftFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const { missions, activeMission, params, reload } = useData()
  const nav = useNavigate()

  const [missionId, setMissionId] = useState(activeMission?.id || '')
  const [form, setForm] = useState({
    date: today(),
    heureDebut: '17:00',
    heureFin: '21:30',
    pauseMinutes: '',
    estFerie: false,
    renfort: { enabled: false, heureDebut: '', heureFin: '' },
    commentaire: '',
  })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (activeMission?.id && !missionId) setMissionId(activeMission.id)
  }, [activeMission])

  useEffect(() => {
    if (!isEdit) return
    getShifts(user.uid).then(all => {
      const s = all.find(x => x.id === id)
      if (s) {
        setMissionId(s.missionId || activeMission?.id || '')
        setForm({
          date: s.date,
          heureDebut: s.heureDebut,
          heureFin: s.heureFin,
          pauseMinutes: s.pauseMinutes || '',
          estFerie: s.estFerie || false,
          renfort: s.renfort || { enabled: false, heureDebut: '', heureFin: '' },
          commentaire: s.commentaire || '',
        })
      }
      setLoading(false)
    })
  }, [id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setRenfort = (k, v) => setForm(f => ({ ...f, renfort: { ...f.renfort, [k]: v } }))

  // Params du contrat sélectionné
  const selParams = missions.find(m => m.id === missionId)?.params ?? params

  // Preview temps réel
  const preview = useMemo(() => {
    if (!form.heureDebut || !form.heureFin) return null
    try { return calcShift(form, selParams) } catch { return null }
  }, [form, selParams])

  async function save(e) {
    e.preventDefault()
    if (!missionId) return
    setSaving(true)
    try {
      if (isEdit) await updateShift(id, form)
      else await createShift(user.uid, missionId, form)
      await reload()
      nav(-1)
    } catch (e) { alert('Erreur : ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    await deleteShift(id)
    await reload()
    nav(-1)
  }

  if (loading) return <div className="page items-center justify-center"><Spinner size={32} className="text-amber-400" /></div>

  return (
    <div className="page">
      <header className="topbar">
        <button onClick={() => nav(-1)} className="btn-icon"><ArrowLeft size={20} /></button>
        <h1 className="font-display font-bold text-xl text-white flex-1">
          {isEdit ? 'Modifier le shift' : 'Nouveau shift'}
        </h1>
        {isEdit && (
          <button onClick={() => setConfirmDel(true)} className="btn-icon text-red-400/70 hover:text-red-400">
            <Trash2 size={18} />
          </button>
        )}
      </header>

      <form onSubmit={save} className="page-body !space-y-5">
        {/* ── Preview ── */}
        {preview && (
          <div className="rounded-3xl p-5 animate-in"
            style={{ background: 'linear-gradient(145deg,#131309,#13131c)', border: '1px solid #2a250e' }}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-zinc-500 text-xs mb-0.5">Brut estimé</p>
                <p className="font-display font-bold text-4xl text-amber-400 leading-none">{fmtEur(preview.brutTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 text-xs">Net ~78%</p>
                <p className="font-display font-bold text-2xl text-emerald-400">{fmtEur(preview.netEstime)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className="flex items-center gap-1 text-zinc-300 text-sm">
                <Clock size={13} />{fmtH(preview.totalReelMin)} travaillés
              </span>
              {preview.nuitH > 0 && (
                <span className="badge-night">
                  <Moon size={9} />{fmtH(preview.nuitMin)} nuit +{fmtEur(preview.pNuit)}
                </span>
              )}
              {preview.hasRenfort && (
                <span className="badge-renfort">⚡ Renfort {fmtH(preview.renfortMin)}</span>
              )}
              {preview.ferieMin > 0 && (
                <span className="badge-ferie">★ {fmtH(preview.ferieMin)} férie</span>
              )}
            </div>

            {/* Détail */}
            <div className="space-y-1.5 border-t border-zinc-800 pt-3 text-xs">
              <Row label="Base" val={fmtEur(preview.base)} />
              {preview.pNuit > 0 && <Row label={`Prime nuit (${selParams?.primeNuitParHeure ?? 2.49}€/h)`} val={`+${fmtEur(preview.pNuit)}`} green />}
              {preview.ferieMin > 0 && (
                <Row label="⚠ Heures fériées (jusqu'à minuit)" val={fmtH(preview.ferieMin)} />
              )}
            </div>
          </div>
        )}

        {/* Contrat si plusieurs */}
        {missions.length > 1 && (
          <div>
            <label>Contrat</label>
            <select value={missionId} onChange={e => setMissionId(e.target.value)}>
              {missions.map(m => <option key={m.id} value={m.id}>{m.nomMission}</option>)}
            </select>
          </div>
        )}

        {missions.length === 0 && (
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3 text-amber-300 text-sm text-center">
            Crée d'abord un contrat.
          </div>
        )}

        {/* Date — calendrier mobile */}
        <DateInput label="Date du shift" value={form.date} onChange={v => set('date', v)} />

        {/* Horaires */}
        <div className="grid grid-cols-2 gap-3">
          <div><label>Début</label>
            <input type="time" value={form.heureDebut} onChange={e => set('heureDebut', e.target.value)} required />
          </div>
          <div><label>Fin</label>
            <input type="time" value={form.heureFin} onChange={e => set('heureFin', e.target.value)} required />
          </div>
        </div>

        {/* Pause */}
        <div>
          <label>Pause (minutes)</label>
          <input type="number" inputMode="numeric" value={form.pauseMinutes}
            onChange={e => set('pauseMinutes', e.target.value)} placeholder="0" min="0" max="120" />
        </div>

        {/* Jour férié — avec explication */}
        <Toggle
          checked={form.estFerie}
          onChange={v => set('estFerie', v)}
          label="Jour férié"
          sub="Majoration appliquée uniquement jusqu'à minuit (règle UPS)"
        />

        {/* Renfort — NOUVEAU : heures dédiées, pas un % */}
        <Toggle
          checked={form.renfort.enabled}
          onChange={v => setRenfort('enabled', v)}
          label="Renfort (heures supplémentaires)"
          sub="Indiquer les horaires de la période de renfort"
        />

        {form.renfort.enabled && (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-700 space-y-3 animate-in-up">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Horaires de renfort
            </p>
            <p className="text-zinc-600 text-xs">
              Ex : shift normal 17h→22h, renfort 22h15→2h45
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div><label>Début renfort</label>
                <input type="time" value={form.renfort.heureDebut}
                  onChange={e => setRenfort('heureDebut', e.target.value)} />
              </div>
              <div><label>Fin renfort</label>
                <input type="time" value={form.renfort.heureFin}
                  onChange={e => setRenfort('heureFin', e.target.value)} />
              </div>
            </div>
            {form.renfort.heureDebut && form.renfort.heureFin && (
              <p className="text-emerald-400 text-xs font-mono">
                ≈ {fmtH(Math.max(0, toMin(form.renfort.heureFin) - toMin(form.renfort.heureDebut) + (toMin(form.renfort.heureFin) < toMin(form.renfort.heureDebut) ? 1440 : 0)))} de renfort
              </p>
            )}
          </div>
        )}

        {/* Commentaire */}
        <div>
          <label>Commentaire (optionnel)</label>
          <input type="text" value={form.commentaire} onChange={e => set('commentaire', e.target.value)}
            placeholder="Notes..." />
        </div>

        <button type="submit" disabled={saving || !missionId} className="btn-primary !rounded-3xl">
          {saving ? <Spinner size={20} /> : <><Save size={20} />{isEdit ? 'Enregistrer' : 'Ajouter le shift'}</>}
        </button>
      </form>

      {confirmDel && (
        <ConfirmSheet title="Supprimer ce shift ?" message="Action irréversible."
          onConfirm={handleDelete} onCancel={() => setConfirmDel(false)} danger />
      )}
    </div>
  )
}

function Row({ label, val, green }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-mono ${green ? 'text-emerald-400' : 'text-zinc-300'}`}>{val}</span>
    </div>
  )
}
