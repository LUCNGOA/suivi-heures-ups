// src/pages/AnalysePage.jsx
import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { analyserFiche } from '../services/api'
import BottomNav from '../components/layout/BottomNav'
import { Spinner, Alert } from '../components/ui'
import { ScanText, Upload, CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { fmtEur } from '../utils/calc'

export default function AnalysePage() {
  const { user, getToken } = useAuth()
  const { activeMission, activeMissionId } = useData()
  const fileRef = useRef()
  const [file, setFile] = useState(null)
  const [imgPrev, setImgPrev] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  function onFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    setFile(f); setResult(null); setErr('')
    if (f.type.startsWith('image/')) { const r = new FileReader(); r.onload = ev => setImgPrev(ev.target.result); r.readAsDataURL(f) }
    else setImgPrev(null)
  }

  async function analyse() {
    if (!file || !activeMissionId) return
    setLoading(true); setErr('')
    try { const token = await getToken(); setResult(await analyserFiche(file, activeMissionId, token)) }
    catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  const anomalies = result?.comparaison?.anomalies || []
  const ext = result?.extraction
  const sev = s => ({ error: <AlertTriangle size={14} className="text-red-400 shrink-0" />, warning: <AlertTriangle size={14} className="text-amber-400 shrink-0" />, info: <Info size={14} className="text-blue-400 shrink-0" /> })[s]

  return (
    <div className="page">
      <header className="topbar">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <ScanText size={18} className="text-purple-300" />
        </div>
        <div className="flex-1"><h1 className="font-display font-bold text-xl text-white">Analyse fiche</h1><p className="text-zinc-500 text-xs">IA → détection anomalies</p></div>
      </header>
      <div className="page-body">
        {!activeMission && <Alert type="warning">Crée un contrat avec des shifts pour activer l'analyse.</Alert>}

        <div onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl flex flex-col items-center justify-center py-10 cursor-pointer transition-all ${file ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'}`}>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />
          {imgPrev ? <img src={imgPrev} alt="" className="max-h-40 rounded-2xl object-contain mb-3" /> : <Upload size={36} className={`mb-3 ${file ? 'text-amber-400' : 'text-zinc-600'}`} />}
          {file ? <div className="text-center"><p className="text-white font-semibold text-sm">{file.name}</p><p className="text-zinc-500 text-xs mt-1">Tap pour changer</p></div>
            : <div className="text-center"><p className="text-zinc-300 font-semibold">Importer une fiche de paie</p><p className="text-zinc-600 text-sm mt-1">JPEG, PNG, PDF · 10Mo max</p></div>}
        </div>

        {err && <Alert type="error">{err}</Alert>}
        {file && activeMissionId && (
          <button onClick={analyse} disabled={loading} className="btn-primary !rounded-3xl">
            {loading ? <><Spinner size={20} />Analyse IA en cours...</> : <><ScanText size={20} />Analyser avec l'IA</>}
          </button>
        )}

        {result && (
          <div className="space-y-4 animate-in-up">
            <div className="card-p" style={{ borderColor: 'rgba(167,139,250,.2)', background: 'rgba(167,139,250,.04)' }}>
              <span className="badge-ai mb-2 inline-flex">IA</span>
              <p className="text-zinc-200 text-sm leading-relaxed">{result.resume}</p>
              {result.conseil && <p className="text-zinc-500 text-xs mt-2 italic">{result.conseil}</p>}
            </div>

            {anomalies.length === 0 ? (
              <div className="card-p flex items-center gap-3"><CheckCircle size={22} className="text-emerald-400 shrink-0" /><div><p className="text-white font-bold">Aucune anomalie</p><p className="text-zinc-500 text-sm">Données cohérentes.</p></div></div>
            ) : (
              <div className="card-p space-y-2">
                <p className="text-white font-bold mb-1">{anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''}</p>
                {anomalies.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 bg-zinc-900 rounded-xl px-3 py-3 border border-zinc-800">
                    {sev(a.severite)}
                    <div><p className="text-zinc-200 text-xs font-bold">{a.type}</p><p className="text-zinc-400 text-xs">{a.detail}</p></div>
                  </div>
                ))}
              </div>
            )}

            {ext && (
              <div className="card-p">
                <button className="flex items-center justify-between w-full" onClick={() => setShowDetails(!showDetails)}>
                  <p className="text-white font-bold">Données extraites</p>
                  {showDetails ? <ChevronUp size={18} className="text-zinc-500" /> : <ChevronDown size={18} className="text-zinc-500" />}
                </button>
                {showDetails && (
                  <div className="mt-4 space-y-1.5 text-sm animate-in-up">
                    {ext.periode && <Row label="Période" val={ext.periode} />}
                    <Row label="H. normales" val={`${ext.heuresNormales}h`} />
                    <Row label="H. nuit" val={`${ext.heuresNuit}h`} />
                    <Row label="Salaire base" val={fmtEur(ext.salaireBase)} />
                    {ext.primeNuit > 0 && <Row label="Prime nuit" val={fmtEur(ext.primeNuit)} green />}
                    <div className="divider" />
                    <Row label="Brut total" val={fmtEur(ext.brutTotal)} bold />
                    {ext.ifm > 0 && <Row label="IFM" val={fmtEur(ext.ifm)} />}
                    <Row label="Cotisations" val={fmtEur(ext.cotisationsTotal)} />
                    <div className="divider" />
                    <Row label="NET À PAYER" val={fmtEur(ext.netAPayer)} bold green />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function Row({ label, val, bold, green }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-mono ${bold ? 'font-bold' : ''} ${green ? 'text-emerald-400' : 'text-zinc-200'}`}>{val}</span>
    </div>
  )
}
