// src/components/ai/AIFloatingButton.jsx
import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2 } from 'lucide-react'
import { chatAssistant } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'

const QUICK = ['Combien le 9 ?', 'Mon IFM ?', 'Heures ce mois ?', 'Anomalies ?']

export default function AIFloatingButton() {
  const [open, setOpen] = useState(false)
  const { getToken } = useAuth()
  const { activeMission } = useData()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Salut ! Demande-moi ton salaire estimé, tes primes, ton IFM... Je connais tes données.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [messages, open])

  async function send(text) {
    const content = text || input.trim()
    if (!content || loading) return
    const userMsg = { role: 'user', content }
    setMessages(p => [...p, userMsg])
    setInput('')
    setLoading(true)
    try {
      const token = await getToken()
      const { reponse } = await chatAssistant(
        [...messages, userMsg].slice(1), // enlever le message d'accueil
        activeMission?.id,
        token
      )
      setMessages(p => [...p, { role: 'assistant', content: reponse }])
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: `Erreur : ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'linear-gradient(135deg,#6d28d9,#a78bfa)', boxShadow: '0 4px 20px rgba(167,139,250,.4)' }}
        >
          <Sparkles size={24} className="text-white" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col animate-in" style={{ background: '#08080e', paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#6d28d9,#a78bfa)' }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-white">Assistant Paie</h2>
              <p className="text-purple-400 text-xs">Spécialiste UPS intérim</p>
            </div>
            <button onClick={() => setOpen(false)} className="btn-icon"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex'}>
                <div className={m.role === 'user' ? 'bubble-user' : 'bubble-ai'}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="flex">
                <div className="bubble-ai flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-purple-400" />
                  <span className="text-zinc-400">Réflexion...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-zinc-800" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom)+12px)' }}>
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="whitespace-nowrap text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-xl px-3 py-1.5 shrink-0">
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ton salaire estimé ?" className="flex-1" autoFocus />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-all active:scale-90"
                style={{ background: 'linear-gradient(135deg,#6d28d9,#a78bfa)' }}>
                <Send size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
