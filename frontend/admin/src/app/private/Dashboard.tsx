import { ArrowRight, BookOpen, CalendarDays, Settings2, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeading } from '@molecules'
import { getPortalPermissions, usePortal } from '@context'
import { courses, canAccessCourse } from '@app/academic'
import { accessibleClassCount, getAcademicAccess } from './academicAccess'
import { roleLabels } from '@/types/portal'

export function Dashboard() {
  const { school, member, visitor } = usePortal()
  if (!visitor && (!member || !school)) return null
  const access = member ? getAcademicAccess(member) : { allowedCourseIds: null }
  const { manageSchool, viewMembers, viewAcademics, manageLearning, viewFamily } = getPortalPermissions(member?.role ?? 'visitor')
  const shortcuts = [
    { to: '/portal/agenda', icon: CalendarDays, label: 'Agenda escolar', description: 'Consulte dias letivos, feriados e férias.', visible: true },
    { to: '/portal/disciplinas', icon: BookOpen, label: 'Disciplinas e turmas', description: visitor ? 'Consulte disciplinas, turmas e horários de exemplo.' : 'Veja horários, estudantes e atividades.', visible: viewAcademics },
    { to: '/portal/integrantes', icon: UsersRound, label: 'Integrantes', description: 'Consulte os profissionais e os alunos.', visible: viewMembers },
    { to: '/portal/configuracoes', icon: Settings2, label: 'Identidade da escola', description: 'Personalize o nome, o logotipo e a cor.', visible: manageSchool },
    { to: '/portal/aprendizagem', icon: BookOpen, label: 'Learning Analytics', description: 'Registre resultados, questões e observações.', visible: manageLearning },
    { to: '/portal/grupos', icon: UsersRound, label: 'Grupos e desafios', description: 'Organize equipes, pontuações e reforço.', visible: manageLearning },
    { to: '/portal/familia', icon: UsersRound, label: 'Meu vínculo escolar', description: 'Consulte seus vínculos confirmados.', visible: viewFamily },
  ]
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())

  return <>
    <PageHeading
      eyebrow="Área de trabalho / Visão geral"
      title={member ? 'Olá, ' + member.name.split(' ')[0] + '.' : 'Conheça o portal'}
      description={school ? school.name + ' · ' + date : 'Explore a agenda e o catálogo de exemplo.'}
    />
    <section className="dashboard-summary" aria-label="Resumo da escola">
      {viewAcademics && <>
        <div><span>Disciplinas acessíveis</span><strong>{courses.filter((course) => canAccessCourse(course, access)).length}</strong></div>
        <div><span>Turmas acessíveis</span><strong>{accessibleClassCount(access)}</strong></div>
      </>}
      {viewMembers && school && <div><span>Unidade escolar</span><strong className="profile-metric">{school.name}</strong></div>}
      <div><span>Seu perfil</span><strong className="profile-metric">{member ? roleLabels[member.role] : 'Visitante'}</strong></div>
    </section>
    <h2 className="private-section-heading">Acesso rápido</h2>
    <div className="shortcut-grid">
      {shortcuts.filter(({ visible }) => visible).map(({ to, icon: Icon, label, description }) => <Link className="shortcut" key={to} to={to}>
        <Icon size={20} /><div><strong>{label}</strong><span>{description}</span></div><ArrowRight size={18} />
      </Link>)}
    </div>
  </>
}
