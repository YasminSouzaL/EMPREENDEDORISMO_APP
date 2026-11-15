import type { CSSProperties } from 'react'
import { BookOpen, CalendarDays, LayoutDashboard, LogOut, Settings2, UsersRound } from 'lucide-react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { Avatar, Brand, Button, ThemeToggle } from '@atoms'
import { getPortalPermissions, usePortal } from '@context'
import { roleLabels } from '@/types/portal'

export function PortalLayout() {
  const { school, member, visitor, signOut } = usePortal()
  if (!visitor && (!school || !member)) return <Navigate replace to="/entrar" />
  const { viewAcademics, viewMembers, manageSchool, manageLearning, viewFamily } = getPortalPermissions(member?.role ?? 'visitor')
  const navigation = [
    { to: '/portal', label: 'Visão geral', icon: LayoutDashboard, visible: true },
    { to: '/portal/agenda', label: 'Agenda', icon: CalendarDays, visible: true },
    { to: '/portal/disciplinas', label: 'Disciplinas', icon: BookOpen, visible: viewAcademics },
    { to: '/portal/integrantes', label: 'Integrantes', icon: UsersRound, visible: viewMembers },
    { to: '/portal/aprendizagem', label: 'Aprendizagem', icon: BookOpen, visible: manageLearning },
    { to: '/portal/grupos', label: 'Grupos e desafios', icon: UsersRound, visible: manageLearning },
    { to: '/portal/familia', label: 'Meu vínculo', icon: UsersRound, visible: viewFamily },
    { to: '/portal/configuracoes', label: 'Escola', icon: Settings2, visible: manageSchool },
  ]
  const theme = school ? { '--school-accent': school.accent } as CSSProperties : undefined
  const displayName = member?.name ?? 'Visitante'

  return <div className="portal-shell" style={theme}>
    <header className="portal-header">
      <div className="portal-container portal-header-inner">
        <Brand to="/portal" name={school?.name} logo={school?.logo} />
        <div className="portal-account"><ThemeToggle />
          <Avatar name={displayName} />
          <div><strong>{displayName}</strong><span>{member ? roleLabels[member.role] : 'Modo de consulta'}</span></div>
          <Button aria-label="Sair do portal" title="Sair do portal" onClick={signOut}><LogOut size={16} /></Button>
        </div>
      </div>
      <nav className="portal-container portal-nav" aria-label="Navegação da escola">
        {navigation.filter(({ visible }) => visible).map(({ to, label, icon: Icon }) =>
          <NavLink key={to} to={to} end={to === '/portal'}><Icon size={17} />{label}</NavLink>
        )}
      </nav>
    </header>
    <main id="conteudo" className="portal-container portal-content" tabIndex={-1} key={school?.id}>
      <div className="portal-banner">{visitor ? 'Modo visitante · Conteúdo ilustrativo' : 'Área de trabalho · ' + school?.name}</div>
      <Outlet />
    </main>
  </div>
}
