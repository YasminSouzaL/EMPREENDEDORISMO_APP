import '@styles/portal.css'
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { getPortalPermissions, usePortal } from '@context'
import { useStudents } from '@hook'
import { Button } from '@atoms'
import { PageHeading } from '@molecules'
import { PortalLayout } from '@organisms'
import { Activities, Agenda, Classroom, CourseDetails, Disciplines, courses, getAccessibleClasses } from '@app/academic'
import type { AcademicAccess } from '@app/academic'
import { Dashboard } from './Dashboard'
import { Members } from './Members'
import { SchoolSettings } from './SchoolSettings'
import { getAcademicAccess, normalizeClassLabel } from './academicAccess'

function ClassroomRoster({ access }: { access: AcademicAccess }) {
  const { courseId, classId } = useParams()
  const course = courses.find(({ id }) => id === courseId)
  const room = course && getAccessibleClasses(course, access).find(({ id }) => id === classId)

  return room ? <LoadedRoster key={room.id} access={access} room={room} /> : <Classroom {...access} students={[]} />
}

function LoadedRoster({ access, room }: { access: AcademicAccess; room: { id: string; label: string } }) {
  const { token } = usePortal()
  const data = useStudents(token)
  const assigned = data.students.filter(({ turma }) => turma === room.id || normalizeClassLabel(turma) === normalizeClassLabel(room.label))
  const students = assigned.map(({ id, nome }) => ({ id, name: nome, classId: room.id }))

  return <>
    {data.loading && <p className="subtle" role="status">Carregando alunos…</p>}
    {data.studentError && <div className="panel-alert" role="status">
      <p>O cadastro de alunos está indisponível.</p>
      <Button disabled={data.loading} onClick={data.reload}>Tentar novamente</Button>
    </div>}
    <Classroom {...access} students={students} />
  </>
}

function MissingPage() {
  return <>
    <PageHeading title="Página não encontrada" description="O endereço informado não corresponde a uma tela do portal." />
    <Link className="text-link" to="/portal">Voltar à visão geral</Link>
  </>
}

export default function PrivateRoutes() {
  const { member, school, visitor, loadingSession, sessionError, signedOut, retrySession, signOut } = usePortal()
  const { pathname, search, hash } = useLocation()
  if (loadingSession) return <p className="p-6" role="status">Verificando sessão…</p>
  if (sessionError) return <main id="conteudo" className="portal-container portal-content" tabIndex={-1}>
    <PageHeading title="Sessão indisponível" description="Não foi possível verificar seu acesso com o servidor." />
    <div className="button-row"><Button onClick={retrySession}>Tentar novamente</Button><Button onClick={signOut}>Voltar ao login</Button></div>
  </main>
  if (!visitor && (!member || !school)) return <Navigate to="/entrar" replace state={signedOut ? undefined : { returnTo: pathname + search + hash }} />
  const { editAgenda, viewAcademics, viewMembers, manageSchool } = getPortalPermissions(member?.role ?? 'visitor')
  const access = member ? getAcademicAccess(member) : { allowedCourseIds: null }
  const goHome = <Navigate to="/portal" replace />

  return <Routes>
    <Route element={<PortalLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="agenda" element={<Agenda schoolId={school?.id} editable={editAgenda} />} />
      <Route path="disciplinas" element={viewAcademics ? <Disciplines {...access} /> : goHome} />
      <Route path="disciplinas/:courseId" element={viewAcademics ? <CourseDetails {...access} showActivities={!visitor} /> : goHome} />
      <Route path="disciplinas/:courseId/turmas/:classId" element={viewAcademics ? (
        visitor
          ? <Classroom {...access} students={[]} emptyMessage="Entre com uma conta da escola para consultar os estudantes." />
          : <ClassroomRoster access={access} />
      ) : goHome} />
      <Route path="disciplinas/:courseId/atividades" element={viewAcademics && school ? <Activities {...access} schoolId={school.id} /> : goHome} />
      <Route path="integrantes" element={viewMembers ? <Members /> : goHome} />
      <Route path="configuracoes" element={manageSchool ? <SchoolSettings /> : goHome} />
      <Route path="*" element={<MissingPage />} />
    </Route>
  </Routes>
}
