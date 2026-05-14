// src/components/calendar/DatePicker.jsx
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  // 0=Lundi, 6=Dimanche
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7
}

/**
 * DatePicker mobile moderne — inline ou en sheet
 */
export function CalendarPicker({ value, onChange, maxDate, minDate }) {
  const [viewing, setViewing] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const selected = value ? new Date(value + 'T00:00:00') : null
  const todayStr = new Date().toISOString().slice(0, 10)

  const daysInMonth = getDaysInMonth(viewing.year, viewing.month)
  const firstDay = getFirstDayOfMonth(viewing.year, viewing.month)

  function prevMonth() {
    setViewing(v => {
      if (v.month === 0) return { year: v.year - 1, month: 11 }
      return { ...v, month: v.month - 1 }
    })
  }

  function nextMonth() {
    setViewing(v => {
      if (v.month === 11) return { year: v.year + 1, month: 0 }
      return { ...v, month: v.month + 1 }
    })
  }

  function selectDay(day) {
    const m = String(viewing.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const dateStr = `${viewing.year}-${m}-${d}`
    if (minDate && dateStr < minDate) return
    if (maxDate && dateStr > maxDate) return
    onChange(dateStr)
  }

  function isToday(day) {
    const m = String(viewing.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${viewing.year}-${m}-${d}` === todayStr
  }

  function isSelected(day) {
    if (!selected) return false
    return selected.getFullYear() === viewing.year &&
      selected.getMonth() === viewing.month &&
      selected.getDate() === day
  }

  function isDisabled(day) {
    const m = String(viewing.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const dateStr = `${viewing.year}-${m}-${d}`
    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true
    return false
  }

  // Grille : padding + jours du mois
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-700 select-none">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="btn-icon !w-8 !h-8">
          <ChevronLeft size={16} />
        </button>
        <p className="text-white font-display font-bold">
          {MOIS[viewing.month]} {viewing.year}
        </p>
        <button onClick={nextMonth} className="btn-icon !w-8 !h-8">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {JOURS.map((j, i) => (
          <div key={i} className="flex items-center justify-center text-zinc-600 text-xs font-bold h-8">
            {j}
          </div>
        ))}
      </div>

      {/* Grille jours */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const disabled = isDisabled(day)
          const selected_ = isSelected(day)
          const today_ = isToday(day)
          return (
            <button
              key={day}
              onClick={() => !disabled && selectDay(day)}
              className={`cal-day ${today_ && !selected_ ? 'today' : ''} ${selected_ ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Accès rapide */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
        <button
          onClick={() => onChange(todayStr)}
          className="flex-1 text-xs text-amber-400 font-semibold py-2 bg-amber-500/8 rounded-xl border border-amber-500/15"
        >
          Aujourd'hui
        </button>
        {selected && (
          <button
            onClick={() => {
              const y = selected.getFullYear(), mo = selected.getMonth()
              const prev = new Date(y, mo, selected.getDate() - 1)
              onChange(prev.toISOString().slice(0, 10))
            }}
            className="flex-1 text-xs text-zinc-400 font-semibold py-2 bg-zinc-800 rounded-xl border border-zinc-700"
          >
            Hier
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Champ date avec calendrier en sheet
 */
export function DateInput({ label, value, onChange, maxDate, minDate }) {
  const [open, setOpen] = useState(false)

  function fmtDisplay(v) {
    if (!v) return 'Choisir une date'
    const d = new Date(v + 'T00:00:00')
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <>
      <div>
        {label && <label>{label}</label>}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
          style={{ background: '#13131c', border: '1.5px solid #22222e', borderRadius: 14 }}
        >
          <Calendar size={18} className="text-zinc-500 shrink-0" />
          <span className={value ? 'text-white' : 'text-zinc-600'}>
            {fmtDisplay(value)}
          </span>
        </button>
      </div>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <p className="font-display font-bold text-white text-lg mb-4">{label || 'Choisir une date'}</p>
            <CalendarPicker
              value={value}
              onChange={v => { onChange(v); setOpen(false) }}
              maxDate={maxDate}
              minDate={minDate}
            />
          </div>
        </div>
      )}
    </>
  )
}
