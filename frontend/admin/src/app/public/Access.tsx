import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Field } from '@atoms'
import { usePortal } from '@context'

export function Access({ registration = false }: { registration?: boolean }) {
  const portal = usePortal()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const field = (key: string) => String(data.get(key) ?? '').trim()
    const password = String(data.get('password') ?? '')
    setError('')
    setPending(true)
    try {
      if (registration) {
        if (!field('school') || !field('name')) throw new Error('Preencha o nome da escola e o seu nome.')
        await portal.registerSchool(field('school'), field('name'), field('email'), password)
        navigate('/entrar', { replace: true, state: { registered: true } })
      } else {
        await portal.signIn(field('email'), password)
        const returnTo = typeof state?.returnTo === 'string' && /^\/portal(?:\/|\?|#|$)/.test(state.returnTo)
          ? state.returnTo
          : '/portal'
        navigate(returnTo, { replace: true })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível concluir o acesso.')
    } finally {
      setPending(false)
    }
  }

  return <section className="public-container access-layout">
    <div className="access-card">
      <p className="eyebrow">Portal Enigma / Acesso</p>
      <h1>{registration ? 'Cadastrar escola' : 'Entrar no portal'}</h1>
      <p>{registration ? 'Crie a escola e a primeira conta de administração.' : 'Entre com o e-mail e a senha da sua conta.'}</p>
      {registration && <p><Link className="text-link" to="/entrar">Já tenho conta. Entrar <ArrowRight size={16} aria-hidden="true" /></Link></p>}
      {!registration && state?.registered && <p className="form-success" role="status">Escola cadastrada. Entre com o seu e-mail e senha.</p>}
      {!registration && state?.familyRegistered && <p className="form-success" role="status">Conta cadastrada. Entre com seu e-mail e senha.</p>}
      <form className="form-stack" onSubmit={submit}>
        {registration && <>
          <Field label="Nome da escola" name="school" autoComplete="organization" maxLength={80} required />
          <Field label="Seu nome" name="name" autoComplete="name" maxLength={80} required />
        </>}
        <Field label="E-mail" type="email" name="email" autoComplete="email" required />
        <Field label="Senha" name="password" type="password" autoComplete={registration ? 'new-password' : 'current-password'} minLength={registration ? 8 : undefined} required />
        {registration && <small>Use pelo menos 8 caracteres.</small>}
        {error && <p role="alert" className="form-error">{error}</p>}
        <Button type="submit" className="button-primary" disabled={pending} iconAfter={ArrowRight}>{pending ? 'Aguarde…' : registration ? 'Criar escola' : 'Entrar'}</Button>
      </form>
      {!registration && <>
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <Button disabled={pending} onClick={() => { portal.enterAsVisitor(); navigate('/portal', { replace: true }) }}>
            Entrar como visitante
          </Button>
          <small className="text-muted">Consulte o portal com dados de exemplo, sem fazer login.</small>
        </div>
        <p>Primeiro acesso? <Link to="/cadastro">Cadastre sua escola</Link>.</p>
        <p>É responsável? <Link to="/cadastro/pessoa">Cadastre-se com seu convite</Link>.</p>
        <p>É estudante? <a href={import.meta.env.VITE_STUDENT_URL ?? 'http://localhost:5174'}>Entre no ava.enigma</a>.</p>
      </>}
    </div>
  </section>
}
