import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button, Status } from '@atoms'
import { PageHeading } from '@molecules'
import { readLocal, writeLocal } from './data'

const dayTypes = {
  school: { label: 'Dia letivo', tone: 'green' },
  holiday: { label: 'Feriado', tone: 'red' },
  vacation: { label: 'Férias', tone: 'amber' },
  none: { label: 'Sem classificação', tone: 'neutral' },
} as const

type DayType = keyof typeof dayTypes
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const weekdays = [
  ['Dom', 'Domingo'], ['Seg', 'Segunda-feira'], ['Ter', 'Terça-feira'], ['Qua', 'Quarta-feira'],
  ['Qui', 'Quinta-feira'], ['Sex', 'Sexta-feira'], ['Sáb', 'Sábado'],
]

function dateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function defaultDayType(date: Date): DayType {
  return date.getDay() === 0 || date.getDay() === 6 ? 'none' : 'school'
}

interface AgendaProps {
  schoolId?: string
  editable: boolean
}

export function Agenda({ schoolId, editable }: AgendaProps) {
  return <SchoolAgenda key={schoolId} schoolId={schoolId} editable={editable} />
}

function SchoolAgenda({ schoolId, editable }: AgendaProps) {
  const storageKey = schoolId && `enigma.agenda.v1.${encodeURIComponent(schoolId)}`
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [month, setMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const [daySettings, setDaySettings] = useState<Record<string, DayType>>(() => storageKey ? readLocal(storageKey, {}) : {})
  const [draftType, setDraftType] = useState<DayType>(() => daySettings[dateKey(selectedDate)] ?? defaultDayType(selectedDate))
  const [feedback, setFeedback] = useState('')
  const firstWeekday = month.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const selectedKey = dateKey(selectedDate)
  const todayKey = dateKey(new Date())
  const selectedType = dayTypes[daySettings[selectedKey] ?? defaultDayType(selectedDate)]

  function selectDate(date: Date) {
    setSelectedDate(date)
    setDraftType(daySettings[dateKey(date)] ?? defaultDayType(date))
    setFeedback('')
  }

  function changeMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1)
    setMonth(next)
    selectDate(next)
  }

  function saveDay() {
    if (!storageKey) return
    const next = { ...readLocal<Record<string, DayType>>(storageKey, {}), [selectedKey]: draftType }
    try {
      writeLocal(storageKey, next)
      setDaySettings(next)
      setFeedback('Classificação salva.')
    } catch {
      setFeedback('Não foi possível salvar a classificação neste navegador.')
    }
  }

  return (
    <section className="academic-page">
      <PageHeading eyebrow="Organização escolar" title="Agenda" description={editable ? 'Consulte o calendário escolar e configure as datas do período letivo.' : 'Consulte o calendário escolar e as datas do período letivo.'} />
      <div className="academic-agenda">
        <section className="academic-panel academic-calendar" aria-label="Calendário escolar">
          <div className="academic-calendar-header">
            <h2 aria-live="polite">{monthFormatter.format(month)}</h2>
            <div className="academic-month-controls">
              <button type="button" className="academic-icon-button" onClick={() => changeMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
              <button type="button" className="academic-icon-button" onClick={() => changeMonth(1)} aria-label="Próximo mês"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="academic-calendar-grid">
            {weekdays.map(([short, full]) => <abbr key={full} className="academic-weekday" title={full}>{short}</abbr>)}
            {Array.from({ length: cellCount }, (_, index) => {
              const day = index - firstWeekday + 1
              if (day < 1 || day > daysInMonth) return <span key={index} aria-hidden="true" />
              const date = new Date(month.getFullYear(), month.getMonth(), day)
              const key = dateKey(date)
              const type = daySettings[key] ?? defaultDayType(date)
              return (
                <button
                  key={index}
                  type="button"
                  className="academic-day"
                  aria-label={`${dateFormatter.format(date)}, ${dayTypes[type].label}`}
                  aria-pressed={key === selectedKey}
                  aria-current={key === todayKey ? 'date' : undefined}
                  onClick={() => selectDate(date)}
                >
                  <span>{day}</span>
                  <span className="academic-day-marker" data-type={type} aria-hidden="true" />
                </button>
              )
            })}
          </div>
          <div className="academic-calendar-legend">
            {Object.entries(dayTypes).filter(([key]) => key !== 'none').map(([key, value]) =>
              <span key={key}><i className="academic-day-marker" data-type={key} aria-hidden="true" />{value.label}</span>,
            )}
          </div>
        </section>
        <section className="academic-panel academic-day-settings" aria-labelledby="selected-date">
          <span className="academic-symbol"><CalendarDays size={22} aria-hidden="true" /></span>
          <div>
            <p className="academic-kicker">Data selecionada</p>
            <h2 id="selected-date">{dateFormatter.format(selectedDate)}</h2>
          </div>
          <div><Status tone={selectedType.tone}>{selectedType.label}</Status></div>
          {editable && (
            <>
              <label className="academic-field">
                Classificação do dia
                <select value={draftType} onChange={(event) => { setDraftType(event.target.value as DayType); setFeedback('') }}>
                  {Object.entries(dayTypes).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <Button onClick={saveDay}>Salvar classificação</Button>
              <p className="academic-feedback" role="status">{feedback}</p>
            </>
          )}
        </section>
      </div>
    </section>
  )
}
