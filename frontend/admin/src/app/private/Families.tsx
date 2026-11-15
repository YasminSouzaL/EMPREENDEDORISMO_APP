import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Field } from '@atoms'
import { PageHeading } from '@molecules'
import { usePortal } from '@context'
import { useStudents } from '@hook'
import { useFamilies } from '@hook/useFamilies'
import type { Guardian } from '@api/families'
import { AccountInvitations } from './AccountInvitations'

export function Families() {
  const { token, member } = usePortal()
  const data = useFamilies(token)
  const roster = useStudents(token)
  const [editing, setEditing] = useState<Guardian | 'new' | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const editable = member?.role === 'admin' || member?.role === 'director'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const studentIds = fields.getAll('studentIds').map(Number)
    if (!studentIds.length || studentIds.some((id) => !roster.students.some((student) => student.id === id))) {
      setMessage('Selecione pelo menos um aluno da escola.'); return
    }
    const name = String(fields.get('name') ?? '').trim()
    const relationship = String(fields.get('relationship') ?? '').trim()
    if (!name || !relationship) { setMessage('Informe o nome e o parentesco.'); return }
    setPending(true)
    setMessage('')
    try {
      await data.save({ name, relationship, email: String(fields.get('email')).trim(), phone: String(fields.get('phone') ?? '').trim(), studentIds }, editing && editing !== 'new' ? editing.id : undefined)
      setEditing(null)
      setMessage('Responsável salvo com seus vínculos.')
    } catch { setMessage('Não foi possível salvar o responsável. Nenhum vínculo foi confirmado.') }
    finally { setPending(false) }
  }
  const record = editing && editing !== 'new' ? editing : undefined
  return <section className="portal-panel">
    <div className="panel-heading"><h2>Responsáveis e vínculos</h2>{editable && <Button disabled={data.loading || !!data.error || roster.loading || roster.studentError || !!editing} onClick={() => { setEditing('new'); setMessage('') }}>Cadastrar responsável</Button>}</div>
    <p className="subtle">Responsáveis e alunos têm perfis distintos. O acesso aos dados depende do vínculo confirmado pela escola.</p>
    {data.loading && <p role="status">Carregando responsáveis…</p>}
    {data.error && <div role="alert"><p>{data.error}</p><Button onClick={data.reload}>Tentar novamente</Button></div>}
    {roster.studentError && <p role="alert">Não foi possível consultar os alunos para vincular responsáveis.</p>}
    {editing && <form className="form-stack" onSubmit={submit} key={record?.id ?? 'new'}>
      <h3>{record ? 'Editar responsável' : 'Novo responsável'}</h3>
      <div className="form-grid">
        <Field label="Nome completo" name="name" defaultValue={record?.name} required maxLength={120} />
        <Field label="E-mail" name="email" type="email" defaultValue={record?.email} required maxLength={254} />
        <Field label="Telefone (opcional)" name="phone" type="tel" defaultValue={record?.phone} maxLength={30} />
        <Field label="Parentesco ou relação" name="relationship" defaultValue={record?.relationship} required maxLength={80} />
      </div>
      <fieldset><legend>Alunos sob responsabilidade</legend>{roster.students.map((student) => <label className="check-row" key={student.id}><input name="studentIds" type="checkbox" value={student.id} defaultChecked={record?.studentIds.includes(student.id)} />{student.nome} · {student.turma}</label>)}</fieldset>
      {!roster.students.length && <p>Cadastre um aluno antes de criar o vínculo.</p>}
      <div className="button-row"><Button type="submit" disabled={pending || !roster.students.length}>{pending ? 'Salvando…' : 'Salvar responsável'}</Button><Button disabled={pending} onClick={() => setEditing(null)}>Cancelar</Button></div>
    </form>}
    {!data.loading && !data.error && !data.guardians.length && <p className="subtle">Nenhum responsável cadastrado.</p>}
    {!!data.guardians.length && <div className="table-wrap"><table><thead><tr><th>Responsável</th><th>Contato</th><th>Relação</th><th>Alunos</th>{editable && <th>Ações</th>}</tr></thead><tbody>{data.guardians.map((guardian) => <tr key={guardian.id}><td>{guardian.name}</td><td>{guardian.email}<br />{guardian.phone}</td><td>{guardian.relationship}</td><td>{guardian.studentIds.map((id) => roster.students.find((student) => student.id === id)?.nome ?? 'Aluno indisponível').join(', ')}</td>{editable && <td><Button onClick={() => { setEditing(guardian); setMessage('') }}>Editar</Button></td>}</tr>)}</tbody></table></div>}
    {message && <p role="status">{message}</p>}
    {editable && !roster.loading && !roster.studentError && <AccountInvitations token={token} students={roster.students} />}
  </section>
}

export function MyFamily() {
  const { token, member } = usePortal()
  const { profile, loading, error, reload } = useFamilies(token, true)
  return <>
    <PageHeading title={member?.role === 'student' ? 'Meu cadastro' : 'Minha família'} description="Consulte os vínculos confirmados pela escola." />
    {loading && <p role="status">Carregando vínculos…</p>}
    {error && <div role="alert"><p>{error}</p><Button onClick={reload}>Tentar novamente</Button></div>}
    {profile && <div className="grid gap-4 md:grid-cols-2"><section className="portal-panel"><h2>Alunos</h2>{profile.students.length ? profile.students.map((student) => <p key={student.id}><strong>{student.name}</strong> · {student.classroom}</p>) : <p>Nenhum vínculo confirmado. Procure a secretaria.</p>}</section><section className="portal-panel"><h2>Responsáveis</h2>{profile.guardians.map((guardian) => <p key={guardian.id}><strong>{guardian.name}</strong> · {guardian.relationship}</p>)}</section></div>}
  </>
}
