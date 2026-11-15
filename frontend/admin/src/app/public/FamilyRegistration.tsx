import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field } from '@atoms'
import { registerFamilyAccount } from '@api/families'

export function FamilyRegistration() {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    if (!name) { setError('Informe seu nome.'); return }
    setPending(true); setError('')
    try {
      await registerFamilyAccount({ role: 'parent', name, email: String(data.get('email')).trim(), password: String(data.get('password')), invitationCode: String(data.get('code')).trim() })
      navigate('/entrar', { replace: true, state: { familyRegistered: true } })
    } catch { setError('Não foi possível cadastrar. Confira o convite, o e-mail e o perfil fornecidos pela escola.') }
    finally { setPending(false) }
  }
  return <section className="public-container public-section"><div className="access-card max-w-xl mx-auto">
    <p className="eyebrow">Portal Enigma / Primeiro acesso</p><h1>Cadastro de responsável</h1>
    <p>Use o convite entregue pela escola. Ele confirma seu perfil e o vínculo com o aluno.</p>
    <form className="form-stack" onSubmit={submit}>
      <Field label="Nome completo" name="name" required maxLength={120} autoComplete="name" />
      <Field label="E-mail do convite" name="email" type="email" required autoComplete="email" />
      <Field label="Código do convite" name="code" required maxLength={128} autoComplete="off" />
      <Field label="Senha" name="password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" />
      {error && <p role="alert" className="form-error">{error}</p>}
      <Button type="submit" className="button-primary" disabled={pending}>{pending ? 'Cadastrando…' : 'Criar conta'}</Button>
    </form><p>Já tem conta? <Link to="/entrar">Entrar</Link></p><p>É estudante? <a href={import.meta.env.VITE_STUDENT_URL ?? 'http://localhost:5174'}>Acesse o ava.enigma</a>.</p>
  </div></section>
}
