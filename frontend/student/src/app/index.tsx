import { lazy, Suspense, useState, type FormEvent } from 'react'
import { Button, Field } from '@atoms'
import { LearningIllustration } from '@molecules'
import { Header } from '@organisms'
import { useStudentPortal } from '@hook/useStudentPortal'
import { register } from '@api'
import type { Assignment } from '@/types/student'
const Activity = lazy(() => import('./Activity').then((module) => ({ default: module.Activity })))
const Dashboard = lazy(() => import('./Dashboard').then((module) => ({ default: module.Dashboard })))
export function App() {
  const portal = useStudentPortal()
  const [registration, setRegistration] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [active, setActive] = useState<Assignment | null>(null)
  async function access(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      const email = String(form.get('email')).trim(), password = String(form.get('password'))
      if (registration) { await register({ email, password, name: String(form.get('name')).trim(), invitationCode: String(form.get('code')).trim() }); setRegistration(false); setMessage('Conta criada! Entre com seu e-mail e senha para começar.') }
      else await portal.signIn(email, password)
    } catch (error) { setMessage((error as Error).message) }
    finally { setPending(false) }
  }
  return <div className="student-shell"><a href="#conteudo" className="skip-link">Ir ao conteúdo</a><Header name={portal.profile?.member.name} school={portal.profile?.school.name} logo={portal.profile?.school.logo} onLogout={portal.token ? () => { setActive(null); void portal.signOut() } : undefined} /><main id="conteudo" className="shell py-6 md:py-8">
    {!portal.token ? <div className="student-access"><aside className="student-welcome"><p className="eyebrow">SUA AVENTURA COMEÇA AQUI ✦</p><h2>Aprender é uma<br /><em>grande aventura!</em></h2><p>Explore novas ideias, enfrente desafios e conquiste descobertas incríveis com a sua equipe.</p><LearningIllustration /><div className="welcome-footnote"><span>🚀 EXPLORE</span><span>⚡ PRATIQUE</span><span>🏆 CONQUISTE</span></div></aside><section className="student-access-form grid gap-5"><span className="access-symbol" aria-hidden="true">✦</span><p className="eyebrow">SEU PRÓXIMO NÍVEL TE ESPERA</p><h1 className="text-3xl font-bold">{registration ? 'Vamos começar sua jornada?' : 'Que bom ter você aqui!'}</h1><p className="text-muted">Atividades, descobertas e conquistas em um espaço só seu.</p><form className="grid gap-4" onSubmit={access}>{registration && <><Field label="Nome completo" name="name" required maxLength={120} /><Field label="Convite da escola" name="code" required autoComplete="off" /></>}<Field label="E-mail" name="email" type="email" autoComplete="email" required /><Field label="Senha" name="password" type="password" autoComplete={registration ? 'new-password' : 'current-password'} minLength={registration ? 8 : undefined} required /><Button type="submit" disabled={pending}>{pending ? 'Aguarde…' : registration ? 'Criar minha conta' : 'Começar a aventura →'}</Button></form>{message && <p className="feedback" role="status">{message}</p>}<Button onClick={() => { setRegistration(!registration); setMessage('') }}>{registration ? 'Já tenho conta' : 'Tenho um convite da escola'}</Button><a className="text-sm underline" href={import.meta.env.VITE_ADMIN_URL ?? 'http://localhost:5173'}>Administração e responsáveis: Portal Enigma</a></section></div> : portal.loading ? <div className="loading-state" role="status"><span aria-hidden="true">🚀</span><p>Preparando sua próxima aventura…</p></div> : portal.error ? <div className="panel grid gap-4" role="alert"><h1 className="font-bold text-xl">Vamos tentar de novo?</h1><p>{portal.error}</p><Button onClick={portal.reload}>Tentar novamente</Button></div> : <Suspense fallback={<p role="status">Carregando sua missão…</p>}>{active ? <Activity key={active.id} token={portal.token} activity={active} onClose={() => { setActive(null); portal.reload() }} /> : <Dashboard token={portal.token} profile={portal.profile} assignments={portal.assignments} courses={portal.courses} groups={portal.groups} ranking={portal.ranking} onOpen={setActive} onReload={portal.reload} />}</Suspense>}
  </main><footer className="shell student-footer"><strong>ava.enigma ✦</strong><span>Uma descoberta de cada vez.</span></footer></div>
}
