// src/pages/MissionFormPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { createMission, updateMission } from '../services/db'
import { ArrowLeft, Save } from 'lucide-react'
import { Spinner } from '../components/ui'
import { DateInput } from '../components/calendar/DatePicker'

export default function MissionFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const { missions, reload } = useData()
  const nav = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nomMission: '', entreprise: 'UPS France', agenceInterim: '',
    dateDebutMission: '', dateFinMission: '',
    tauxHoraire: '12.527', primeNuitParHeure: '2.49',
  })

  useEffect(() => {
    if (isEdit) {
      const m = missions.find(x => x.id === id)
      if (m) setForm({
        nomMission: m.nomMission || '', entreprise: m.entreprise || '', agenceInterim: m.agenceInterim || '',
        dateDebutMission: m.dateDebutMission || '', dateFinMission: m.dateFinMission || '',
        tauxHoraire: String(m.params?.tauxHoraire ?? 12.527), primeNuitParHeure: String(m.params?.primeNuitParHeure ?? 2.49),
      })
    }
  }, [missions, id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const data = {
        nomMission: form.nomMission, entreprise: form.entreprise, agenceInterim: form.agenceInterim,
        dateDebutMission: form.dateDebutMission, dateFinMission: form.dateFinMission,
        params: { tauxHoraire: parseFloat(form.tauxHoraire) || 12.527, primeNuitParHeure: parseFloat(form.primeNuitParHeure) || 2.49 }
      }
      if (isEdit) await updateMission(id, data); else await createMission(user.uid, data)
      await reload(); nav('/missions')
    } catch (e) { alert('Erreur : ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="page">
      <header className="topbar">
        <button onClick={() => nav(-1)} className="btn-icon"><ArrowLeft size={20} /></button>
        <h1 className="font-display font-bold text-xl text-white flex-1">{isEdit ? 'Modifier' : 'Nouveau contrat'}</h1>
      </header>
      <form onSubmit={submit} className="page-body !space-y-5">
        <div><label>Nom du contrat *</label><input type="text" value={form.nomMission} onChange={e => set('nomMission', e.target.value)} placeholder="UPS Hub Corbeil 2026" required /></div>
        <div><label>Entreprise</label><input type="text" value={form.entreprise} onChange={e => set('entreprise', e.target.value)} /></div>
        <div><label>Agence intérim</label><input type="text" value={form.agenceInterim} onChange={e => set('agenceInterim', e.target.value)} placeholder="Adecco, Randstad..." /></div>
        <div className="grid grid-cols-2 gap-3">
          <DateInput label="Début" value={form.dateDebutMission} onChange={v => set('dateDebutMission', v)} />
          <DateInput label="Fin prévue" value={form.dateFinMission} onChange={v => set('dateFinMission', v)} />
        </div>
        <div className="card-p !bg-zinc-900 space-y-3">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Taux de rémunération</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label>Taux horaire (€/h)</label><input type="number" step="0.001" value={form.tauxHoraire} onChange={e => set('tauxHoraire', e.target.value)} inputMode="decimal" /></div>
            <div><label>Prime nuit (€/h)</label><input type="number" step="0.01" value={form.primeNuitParHeure} onChange={e => set('primeNuitParHeure', e.target.value)} inputMode="decimal" /></div>
          </div>
          <p className="text-zinc-700 text-xs">IFM (10%) et ICP (10%) versées en fin de contrat.</p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary !rounded-3xl">
          {saving ? <Spinner size={20} /> : <><Save size={20} />{isEdit ? 'Mettre à jour' : 'Créer'}</>}
        </button>
      </form>
    </div>
  )
}
