import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Clock3, ClipboardList, UsersRound } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Avatar, Status } from '@atoms'
import { PageHeading } from '@molecules'
import { canAccessCourse, courses, getAccessibleClasses, grades } from './data'
import type { AcademicAccess } from './data'

export const disciplinesPath = '/portal/disciplinas'

export function AcademicUnavailable({ message = 'Esta disciplina não está disponível para o seu perfil.' }: { message?: string }) {
  return (
    <section className="academic-page">
      <PageHeading eyebrow="Organização escolar" title="Acesso indisponível" description={message} />
      <Link className="academic-back" to={disciplinesPath}><ArrowLeft size={16} /> Voltar para disciplinas</Link>
    </section>
  )
}

export function Disciplines(access: AcademicAccess) {
  const [grade, setGrade] = useState('')
  const visibleCourses = courses.filter((course) => canAccessCourse(course, access))
  const visibleGrades = grades.filter((grade) =>
    visibleCourses.some((course) => getAccessibleClasses(course, access).some((classroom) => classroom.grade === grade)),
  )
  const activeGrade = visibleGrades.includes(grade) ? grade : ''
  const courseCards = visibleCourses.map((course) => ({
    course,
    classes: getAccessibleClasses(course, access).filter((classroom) => !activeGrade || classroom.grade === activeGrade),
  })).filter(({ classes }) => classes.length)

  return (
    <section className="academic-page">
      <PageHeading eyebrow="Organização escolar" title="Disciplinas" description="Explore os componentes curriculares e encontre as turmas de cada disciplina." />
      <label className="academic-field academic-grade-filter">
        Filtrar por ano ou série
        <select value={activeGrade} onChange={(event) => setGrade(event.target.value)}>
          <option value="">Todos os anos e séries</option>
          {visibleGrades.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <div className="academic-course-grid">
        {courseCards.map(({ course, classes }) => (
          <article className="academic-panel academic-course-card" key={course.id}>
            <Link className="academic-course-title" to={`${disciplinesPath}/${course.id}`}>
              <span className="academic-symbol"><BookOpen size={20} aria-hidden="true" /></span>
              <h2>{course.name}</h2><ArrowRight size={16} aria-hidden="true" />
            </Link>
            <div className="academic-course-copy"><p>{course.summary}</p></div>
            <div className="academic-grade-links" aria-label={'Anos e séries de ' + course.name}>
              {[...new Set(classes.map(({ grade }) => grade))].map((item) => <Link key={item}
                to={`${disciplinesPath}/${course.id}?${new URLSearchParams({ serie: item })}`}>{item}</Link>)}
            </div>
            <p className="academic-course-meta">{classes.length} {classes.length === 1 ? 'turma' : 'turmas'}</p>
          </article>
        ))}
      </div>
      {!courseCards.length && <p className="academic-panel academic-empty">Nenhuma disciplina disponível para este perfil.</p>}
    </section>
  )
}

export function CourseDetails({ showActivities, ...access }: AcademicAccess & { showActivities: boolean }) {
  const { courseId } = useParams()
  const [search] = useSearchParams()
  const course = courses.find((item) => item.id === courseId)

  if (!course || !canAccessCourse(course, access)) return <AcademicUnavailable />

  const coursePath = `${disciplinesPath}/${course.id}`
  const available = getAccessibleClasses(course, access)
  const grade = search.get('serie')
  const classrooms = grade ? available.filter((classroom) => classroom.grade === grade) : available
  if (!classrooms.length) return <AcademicUnavailable message="Este ano ou série não está disponível para o seu perfil." />
  return (
    <section className="academic-page">
      <Link className="academic-back" to={disciplinesPath}><ArrowLeft size={16} /> Disciplinas</Link>
      <PageHeading
        eyebrow="Disciplina"
        title={grade ? `${course.name} · ${grade}` : course.name}
        description={course.summary}
        action={showActivities && <Link className="academic-action" to={`${coursePath}/atividades`}><ClipboardList size={18} /> Atividades</Link>}
      />
      <section className="academic-panel academic-classrooms">
        <header className="academic-panel-header">
          <h2><UsersRound size={20} aria-hidden="true" /> Turmas e horários</h2>
          {grade && <Link className="text-link" to={coursePath}>Ver todas as turmas</Link>}
        </header>
        <ul className="academic-class-list">
          {classrooms.map((classroom) => (
            <li key={classroom.id}>
              <Link to={`${coursePath}/turmas/${classroom.id}`}>
                <div>
                  <strong>{classroom.label}</strong>
                  <span className="academic-class-time"><Clock3 size={14} aria-hidden="true" />{classroom.schedule}</span>
                </div>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export interface AcademicStudent {
  id: number
  name: string
  classId?: string
  online?: boolean
}

function Desk({ online }: Pick<AcademicStudent, 'online'>) {
  const marker = online === undefined ? 'var(--muted)' : online ? 'var(--green)' : 'var(--amber)'

  return (
    <svg className="academic-desk" viewBox="0 0 140 84" fill="none" aria-hidden="true">
      <rect x="27" y="46" width="86" height="18" rx="3" fill="var(--accent-soft)" stroke="currentColor" strokeWidth="2" />
      <path d="M36 64v13m68-13v13M49 46v-7a9 9 0 0 1 9-9h24a9 9 0 0 1 9 9v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="104" cy="20" r="5" fill={marker} />
    </svg>
  )
}

export function Classroom({ students, emptyMessage = 'Nenhum estudante vinculado a esta turma.', ...access }: AcademicAccess & { students: AcademicStudent[]; emptyMessage?: string }) {
  const { courseId, classId } = useParams()
  const course = courses.find((item) => item.id === courseId)
  const classroom = course && getAccessibleClasses(course, access).find((item) => item.id === classId)

  if (!course || !classroom) return <AcademicUnavailable message="Esta turma não está disponível para o seu perfil." />

  const classStudents = students.filter((student) => student.classId === classroom.id)
  return (
    <section className="academic-page">
      <Link className="academic-back" to={`${disciplinesPath}/${course.id}`}><ArrowLeft size={16} /> {course.name}</Link>
      <PageHeading eyebrow={course.name} title={classroom.label} description={classroom.schedule} />
      <section className="academic-panel academic-classrooms">
        <header className="academic-panel-header">
          <h2><UsersRound size={20} aria-hidden="true" /> Mapa da turma</h2>
          <span>{classStudents.length} {classStudents.length === 1 ? 'estudante' : 'estudantes'}</span>
        </header>
        {classStudents.length ? (
          <ul className="academic-desks">
            {classStudents.map((student) => (
              <li key={student.id}>
                <div className="academic-seat"><Desk online={student.online} /><Avatar name={student.name} /></div>
                <strong>{student.name}</strong>
                {student.online === undefined
                  ? <Status tone="neutral">Presença indisponível</Status>
                  : student.online
                    ? <Status tone="green">Online</Status>
                    : <Status tone="amber">Offline</Status>}
              </li>
            ))}
          </ul>
        ) : <p className="academic-empty">{emptyMessage}</p>}
      </section>
    </section>
  )
}
