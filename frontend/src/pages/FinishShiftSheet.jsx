// src/pages/FinishShiftSheet.jsx
import { useState } from 'react'
import { calcShift, fmtH, fmtEur, toMin, today } from '../utils/calc'
import { Toggle, Spinner } from '../components/ui'
import { CheckCircle, Moon, Clock } from 'lucide-react'

/**
 * Sheet de confirmation après FIN SHIFT depuis le timer
 * Permet de vérifier/ajuster les données avant sauvegarde
 */
export default function FinishShiftSheet({ data, params, onSave, onCancel }) {
  const toHHMM = ts => {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const startDate = new Date(data.startTimeLocal)
  const endDate = new Date(data.endTimeLocal)

  const [form, setForm] = useState({
    date: data.date || today(),
    heureDebut: toHHMM(startDate),
    heureFin: toHHMM(endDate),
    pauseMinutes: data.totalPauseMinutes || 0,
    estFerie: data.estFerie || false,
    renfort: data.renfort || { enabled: false, heureDebut: '', heureFin: '' },
    commentaire: data.commentaire || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setRenfort = (k, v) => setForm(f => ({ ...f, renfort: { ...f.renfort, [k]: v } }))

  const calc = calcShift(form, params)

  async function handleSave() {
    setSaving(true)
    await onSave({
      ...form,
      startTimeLocal: data.startTimeLocal,
      endTimeLocal: data.endTimeLocal,
      totalPauseMs: data.totalPauseMs,
      isFromTimer: true,
    })
    setSaving(false)
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Résumé calcul */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-700 mb-5">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-zinc-500 text-xs mb-0.5">Shift terminé ✅</p>
              <p className="text-amber-400 font-display font-bold text-3xl">{fmtEur(calc.brutTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs">Net ~78%</p>
              <p className="text-emerald-400 font-display font-bold text-xl">{fmtEur(calc.netEstime)}</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap text-sm">
            <span className="flex items-center gap-1 text-zinc-300">
              <Clock size={13} />{fmtH(calc.totalReelMin)} travaillés
            </span>
            {calc.nuitH > 0 && (
              <span className="flex items-center gap-1 text-blue-300">
                <Moon size={13} />{fmtH(calc.nuitMin)} nuit
              </span>
            )}
          </div>
        </div>

        {/* Horaires (vérification) */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Début</label>
              <input type="time" value={form.heureDebut} onChange={e => set('heureDebut', e.target.value)} />
            </div>
            <div>
              <label>Fin</label>
              <input type="time" value={form.heureFin} onChange={e => set('heureFin', e.target.value)} />
            </div>
          </div>

          <div>
            <label>Pause (minutes)</label>
            <input type="number" value={form.pauseMinutes} onChange={e => set('pauseMinutes', e.target.value)}
              inputMode="numeric" placeholder="0" />
          </div>

          <Toggle
            checked={form.estFerie}
            onChange={v => set('estFerie', v)}
            label="Jour férié"
            sub="Heures fériées jusqu'à minuit uniquement"
          />

          <Toggle
            checked={form.renfort.enabled}
            onChange={v => setRenfort('enabled', v)}
            label="Renfort ce shift"
            sub="Heures supplémentaires de renfort"
          />

          {form.renfort.enabled && (
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-700 space-y-3 animate-in-up">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Horaires renfort</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Début renfort</label>
                  <input type="time" value={form.renfort.heureDebut}
                    onChange={e => setRenfort('heureDebut', e.target.value)} />
                </div>
                <div>
                  <label>Fin renfort</label>
                  <input type="time" value={form.renfort.heureFin}
                    onChange={e => setRenfort('heureFin', e.target.value)} />
                </div>
              </div>
              {form.renfort.heureDebut && form.renfort.heureFin && (
                <p className="text-zinc-500 text-xs">
                  ≈ {fmtH(Math.max(0, (toMin(form.renfort.heureFin) - toMin(form.renfort.heureDebut) + 1440) % 1440))} de renfort
                </p>
              )}
            </div>
          )}

          <div>
            <label>Commentaire</label>
            <input type="text" value={form.commentaire} onChange={e => set('commentaire', e.target.value)}
              placeholder="Notes, remarques..." />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-ghost flex-1">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <Spinner size={18} /> : <><CheckCircle size={18} />Sauvegarder</>}
          </button>
        </div>
      </div>
    </div>
  )
}
