import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ClipboardList, Plus, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@atoms'
import { PageHeading } from '@molecules'
import { AcademicUnavailable, disciplinesPath } from './Disciplines'
import { courses, getAccessibleClasses, readLocal, writeLocal } from './data'
import type { AcademicAccess, ClassroomDefinition, Course } from './data'

interface Activity {
  id: string
  classId: string
  title: string
  instructions: string
}

function CourseActivities({ course, classrooms, schoolId }: { course: Course; classrooms: ClassroomDefinition[]; schoolId: string }) {
  const storageKey = `enigma.atividades.v1.${encodeURIComponent(schoolId)}.${course.id}`
  const [activities, setActivities] = useState(() => readLocal<Activity[]>(storageKey, []))
  const [selectedId, setSelectedId] = useState('')
  const [creating, setCreating] = useState(false)
  const [feedback, setFeedback] = useState('')
  const visibleActivities = activities.filter((activity) => classrooms.some((classroom) => classroom.id === activity.classId))
  const selected = visibleActivities.find((activity) => activity.id === selectedId) ?? visibleActivities[0]

  function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const classId = String(fields.get('classId') ?? '')
    const title = String(fields.get('title') ?? '').trim()
    const instructions = String(fields.get('instructions') ?? '').trim()
    if (!title || !instructions || !classrooms.some((classroom) => classroom.id === classId)) {
      setFeedback('Preencha o título, as orientações e a turma.')
      return
    }

    const activity = { id: crypto.randomUUID?.() ?? crypto.getRandomValues(new Uint32Array(4)).join('-'), classId, title, instructions }
    const next = [...readLocal<Activity[]>(storageKey, []), activity]
    try {
      writeLocal(storageKey, next)
      setActivities(next)
      setSelectedId(activity.id)
      setCreating(false)
      setFeedback('Atividade criada.')
    } catch {
      setFeedback('Não foi possível salvar a atividade neste navegador.')
    }
  }

  function changeView(nextCreating: boolean) {
    setCreating(nextCreating)
    setFeedback('')
  }

  return (
    <section className="academic-page">
      <Link className="academic-back" to={`${disciplinesPath}/${course.id}`}><ArrowLeft size={16} /> {course.name}</Link>
      <PageHeading
        eyebrow={course.name}
        title="Atividades"
        description="Consulte e organize as atividades por turma."
        action={<Button onClick={() => changeView(!creating)}>{creating ? <X size={18} /> : <Plus size={18} />}{creating ? 'Cancelar' : 'Nova atividade'}</Button>}
      />
      <div className="academic-activities">
        <section className="academic-panel academic-activity-list">
          <header className="academic-panel-header"><h2><ClipboardList size={20} aria-hidden="true" /> Atividades da disciplina</h2></header>
          {visibleActivities.length ? (
            <ul>
              {visibleActivities.map((activity) => (
                <li key={activity.id}>
                  <button type="button" aria-pressed={!creating && selected?.id === activity.id} onClick={() => { setSelectedId(activity.id); changeView(false) }}>
                    <strong>{activity.title}</strong>
                    <span>{classrooms.find((classroom) => classroom.id === activity.classId)?.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="academic-empty">Nenhuma atividade cadastrada.</p>}
        </section>
        {creating ? (
          <form className="academic-panel academic-activity-detail" onSubmit={saveActivity}>
            <h2>Nova atividade</h2>
            <label className="academic-field">
              Turma
              <select name="classId" required>
                {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.label}</option>)}
              </select>
            </label>
            <label className="academic-field">Título<input name="title" required maxLength={120} /></label>
            <label className="academic-field">Orientações<textarea name="instructions" required rows={5} /></label>
            <Button type="submit">Salvar atividade</Button>
          </form>
        ) : (
          <section className="academic-panel academic-activity-detail">
            {selected ? (
              <>
                <p className="academic-kicker">{classrooms.find((classroom) => classroom.id === selected.classId)?.label}</p>
                <h2>{selected.title}</h2>
                <p className="academic-instructions">{selected.instructions}</p>
              </>
            ) : <p>Crie uma atividade para uma de suas turmas.</p>}
          </section>
        )}
      </div>
      <p className="academic-feedback" role="status">{feedback}</p>
    </section>
  )
}

export function Activities({ schoolId, ...access }: AcademicAccess & { schoolId: string }) {
  const { courseId } = useParams()
  const course = courses.find((item) => item.id === courseId)
  const classrooms = course ? getAccessibleClasses(course, access) : []

  if (!course || !classrooms.length) return <AcademicUnavailable />

  return <CourseActivities key={JSON.stringify([schoolId, course.id])} schoolId={schoolId} course={course} classrooms={classrooms} />
}
