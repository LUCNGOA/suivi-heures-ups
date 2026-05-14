// src/pages/AuthPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { Spinner } from '../components/ui'

const ERRS = {
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/email-already-in-use': 'Email déjà utilisé.',
  'auth/weak-password': 'Mot de passe trop faible.',
  'auth/invalid-email': 'Email invalide.',
  'auth/too-many-requests': 'Trop de tentatives.',
}

export default function AuthPage() {
  const { login, register, resetPw } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setErr(''); setInfo(''); setBusy(true)
    try {
      if (mode === 'login') { await login(email, pw); nav('/') }
      else if (mode === 'register') { await register(email, pw, name); nav('/') }
      else { await resetPw(email); setInfo('Email envoyé !'); setMode('login') }
    } catch (e) { setErr(ERRS[e.code] || 'Erreur.') }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#08080e', paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex flex-col items-center justify-center flex-1 px-6 pt-8 pb-6">
        <div className="w-18 h-18 rounded-3xl mb-5 flex items-center justify-center"
          style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#d97706,#f5a623)', boxShadow: '0 8px 32px rgba(245,166,35,.3)' }}>
          <Zap size={36} className="text-zinc-950" fill="currentColor" />
        </div>
        <h1 className="font-display font-bold text-3xl text-white mb-1">Suivi Heures UPS</h1>
        <p className="text-zinc-500 text-sm text-center">Tes shifts, ta paie, sous contrôle.</p>
      </div>

      <div className="px-5 pb-10 w-full max-w-sm mx-auto">
        {mode !== 'reset' && (
          <div className="flex bg-zinc-900 rounded-2xl p-1 mb-5 border border-zinc-800">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr('') }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === m ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>
        )}

        {info && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl px-4 py-3 text-sm mb-4 text-center">{info}</div>}
        {err && <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl px-4 py-3 text-sm mb-4 text-center">{err}</div>}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div><label>Prénom</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jean" required autoComplete="name" /></div>
          )}
          <div><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@exemple.fr" required /></div>
          {mode !== 'reset' && (
            <div><label>Mot de passe</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
                  placeholder="••••••••" required style={{ paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}
          <button type="submit" disabled={busy} className="btn-primary mt-2">
            {busy ? <Spinner size={18} /> : mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Créer mon compte' : 'Envoyer'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3 mt-4">
          {mode === 'login' && (
            <button onClick={() => { setMode('reset'); setErr('') }} className="text-zinc-600 text-sm hover:text-zinc-400">
              Mot de passe oublié ?
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setErr('') }} className="text-zinc-500 text-sm">← Retour</button>
          )}
        </div>
      </div>
    </div>
  )
}
