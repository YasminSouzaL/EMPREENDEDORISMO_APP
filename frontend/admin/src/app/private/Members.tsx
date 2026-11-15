import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Avatar, Button, Field, Status } from '@atoms'
import { PageHeading } from '@molecules'
import { getPortalPermissions, usePortal } from '@context'
import { useProfessionals, useStudents } from '@hook'
import type { MemberInput } from '@api'
import { courses } from '@app/academic'
import type { Member, Role } from '@/types/portal'
import { roleLabels } from '@/types/portal'
import { classLabels } from './academicAccess'
import { Families } from './Families'

function ProfessionalForm({ account, onClose, save }: {
  account?: Member
  onClose: () => void
  save: (input: MemberInput, id?: string) => Promise<void>
}) {
  const [role, setRole] = useState<Role>(account?.role ?? 'teacher')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const email = String(data.get('email')).trim()
    const password = String(data.get('password') ?? '')
    setError('')
    if (!name) { setError('Informe o nome do profissional.'); return }
    setPending(true)
    try {
      await save({
        name, email, role,
        courseIds: role === 'teacher' ? data.getAll('courses').map(String) : [],
        classIds: role === 'teacher' ? data.getAll('classes').map(String) : [],
        password: password || undefined,
      }, account?.id)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o profissional.')
    } finally {
      setPending(false)
    }
  }

  return <section className="portal-panel">
    <h2>{account ? 'Editar profissional' : 'Adicionar profissional'}</h2>
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Nome" name="name" defaultValue={account?.name} maxLength={80} required />
        <Field label="E-mail" name="email" type="email" defaultValue={account?.email} required />
        <label className="field"><span>Cargo</span><select value={role} onChange={(event) => setRole(event.target.value as Role)}>
          {Object.entries(roleLabels).filter(([key]) => key !== 'parent' && key !== 'student').map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
        <Field label={account ? 'Nova senha (opcional)' : 'Senha inicial'} name="password" type="password" autoComplete="new-password" minLength={8} required={!account} />
      </div>
      <div hidden={role !== 'teacher'}>
        <p className="subtle">Marque uma disciplina para liberar todas as suas turmas ou selecione apenas as turmas desejadas.</p>
        <div className="assignment-grid">
          {courses.map((course) => <fieldset key={course.id}>
            <legend>{course.name}</legend>
            <label className="check-row"><input type="checkbox" name="courses" value={course.id} defaultChecked={account?.courseIds.includes(course.id)} /> Todas as turmas</label>
            {course.classes.map((room) => <label className="check-row" key={room.id}><input type="checkbox" name="classes" value={room.id} defaultChecked={account?.classIds.includes(room.id)} /> {room.label}</label>)}
          </fieldset>)}
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="button-row">
        <Button type="submit" className="button-primary" disabled={pending}>{pending ? 'Salvando…' : 'Salvar profissional'}</Button>
        <Button onClick={onClose} disabled={pending}>Cancelar</Button>
      </div>
    </form>
  </section>
}

function Professionals({ editable }: { editable: boolean }) {
  const { token } = usePortal()
  const { members, loading, error, save, retry } = useProfessionals(token)
  const [editing, setEditing] = useState<Member | 'new' | null>(null)

  return <>
    {editing && <ProfessionalForm key={editing === 'new' ? 'new' : editing.id} account={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} save={save} />}
    <section className="portal-panel">
      <div className="panel-heading"><h2>Profissionais <Status>{members.length}</Status></h2>
        {editable && !editing && <Button className="button-primary" iconBefore={Plus} disabled={loading || error} onClick={() => setEditing('new')}>Adicionar profissional</Button>}
      </div>
      {loading && <p role="status">Carregando profissionais…</p>}
      {error && <div className="panel-alert" role="status"><p>A lista de profissionais está indisponível.</p><Button onClick={retry}>Tentar novamente</Button></div>}
      {!loading && !error && members.length === 0 && <p className="subtle">Nenhum profissional cadastrado.</p>}
      {members.length > 0 && <div className="table-wrap"><table>
        <thead><tr><th>Profissional</th><th>Cargo</th><th>Vínculos</th>{editable && <th>Ações</th>}</tr></thead>
        <tbody>{members.map((account) => <tr key={account.id}>
          <td><div className="table-person"><Avatar name={account.name} /><div><strong>{account.name}</strong><span>{account.email}</span></div></div></td>
          <td><Status tone={account.role === 'admin' || account.role === 'director' ? 'amber' : 'neutral'}>{roleLabels[account.role]}</Status></td>
          <td>{account.role === 'teacher' ? account.courseIds.length + ' disciplinas · ' + account.classIds.length + ' turmas avulsas' : '—'}</td>
          {editable && <td><Button aria-label={'Editar ' + account.name} onClick={() => setEditing(account)}>Editar</Button></td>}
        </tr>)}</tbody>
      </table></div>}
    </section>
  </>
}

function Students() {
  const { token } = usePortal()
  const data = useStudents(token)
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const registration = String(form.get('registration') ?? '').trim()
    const classroom = String(form.get('class') ?? '')
    const trackId = Number(form.get('track'))
    if (!name || !registration) { setError('Preencha o nome e a matrícula.'); return }
    setPending(true)
    setError('')
    try {
      await data.register({ nome: name, matricula: registration, turma: classroom, trilhaId: trackId })
      setEditing(false)
      setSaved(true)
    } catch {
      setError('Não foi possível cadastrar o aluno na API.')
    } finally {
      setPending(false)
    }
  }

  return <section className="portal-panel">
    <div className="panel-heading"><h2>Alunos <Status>{data.students.length}</Status></h2>
      <Button iconBefore={Plus} className="button-primary" disabled={data.loading || data.trackError || !data.tracks.length || editing} onClick={() => { setSaved(false); setError(''); setEditing(true) }}>Cadastrar aluno</Button>
    </div>
    <p className="subtle">O cadastro de alunos e as trilhas usam a base compartilhada do servidor de testes.</p>
    {data.loading && <p role="status">Carregando alunos e trilhas…</p>}
    {(data.studentError || data.trackError) && <div className="panel-alert" role="status">
      <p>{data.studentError && data.trackError ? 'A API de alunos e trilhas está indisponível.' : data.studentError ? 'A lista de alunos está indisponível.' : 'A lista de trilhas está indisponível.'}</p>
      <Button disabled={pending || data.loading} onClick={data.reload}>Tentar novamente</Button>
    </div>}
    {!data.loading && !data.trackError && !data.tracks.length && <p className="subtle">A API precisa ter uma trilha cadastrada para receber novos alunos.</p>}
    {saved && <p role="status" className="form-success">Aluno cadastrado com sucesso.</p>}
    {editing && <form className="form-stack student-form" onSubmit={submit}>
      <div className="form-grid">
        <Field label="Nome do aluno" name="name" required maxLength={120} />
        <Field label="Matrícula" name="registration" required maxLength={80} />
        <label className="field"><span>Turma</span><select name="class" required defaultValue=""><option value="" disabled>Selecione</option>{classLabels.map((label) => <option key={label}>{label}</option>)}</select></label>
        <label className="field"><span>Trilha</span><select name="track" required defaultValue=""><option value="" disabled>Selecione</option>{data.tracks.map((track) => <option key={track.id} value={track.id}>{track.nome}</option>)}</select></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="button-row">
        <Button type="submit" className="button-primary" disabled={pending}>{pending ? 'Cadastrando…' : 'Salvar aluno'}</Button>
        <Button disabled={pending} onClick={() => setEditing(false)}>Cancelar</Button>
      </div>
    </form>}
    {!data.loading && !data.studentError && !data.students.length && <p className="subtle">Nenhum aluno cadastrado.</p>}
    {data.students.length > 0 && <div className="table-wrap"><table>
      <thead><tr><th>Aluno</th><th>Matrícula</th><th>Turma</th><th>Trilha</th></tr></thead>
      <tbody>{data.students.map((student) => <tr key={student.id}><td>{student.nome}</td><td>{student.matricula}</td><td>{student.turma}</td><td>{student.trilha?.nome ?? '—'}</td></tr>)}</tbody>
    </table></div>}
  </section>
}

export function Members() {
  const { member } = usePortal()
  const [tab, setTab] = useState<'professionals' | 'students' | 'families'>('professionals')
  if (!member) return null

  return <>
    <PageHeading eyebrow="Área de trabalho / Cadastros" title="Integrantes" description="Consulte os alunos e organize os cargos e vínculos da equipe escolar." />
    <div className="segmented button-row" aria-label="Tipo de integrante" role="group">
      <Button aria-pressed={tab === 'professionals'} onClick={() => setTab('professionals')}>Profissionais</Button>
      <Button aria-pressed={tab === 'students'} onClick={() => setTab('students')}>Alunos</Button>
      <Button aria-pressed={tab === 'families'} onClick={() => setTab('families')}>Responsáveis e vínculos</Button>
    </div>
    {tab === 'professionals' ? <Professionals editable={getPortalPermissions(member.role).manageMembers} /> : tab === 'students' ? <Students /> : <Families />}
  </>
}
