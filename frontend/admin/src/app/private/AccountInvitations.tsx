import { useState, type FormEvent } from 'react'
import { Button, Field } from '@atoms'
import { createInvitation } from '@api/families'
import type { Student } from '@/types/portal'
export function AccountInvitations({ token, students }: { token: string; students: Student[] }) {
  const [pending, setPending] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setCode(''); setError('')
    const form = new FormData(event.currentTarget)
    const role = form.get('role') === 'student' ? 'student' : 'parent'
    const studentIds = form.getAll('students').map(Number)
    try {
      if (!studentIds.length || (role === 'student' && studentIds.length !== 1)) throw new Error('Selecione um aluno para conta de estudante ou os alunos vinculados ao responsável.')
      setCode((await createInvitation(token, { role, email: String(form.get('email')).trim(), studentIds })).code)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível emitir o convite.') }
    finally { setPending(false) }
  }
  return <section className="border-t border-line mt-5 pt-5"><h3>Convite para criar conta</h3><p className="subtle">O convite vale 72 horas, é de uso único e só funciona com o e-mail informado. Entregue o código ao destinatário.</p><form className="form-stack" onSubmit={submit}><div className="form-grid"><Field label="E-mail do destinatário" name="email" type="email" required /><label className="field"><span>Perfil da conta</span><select name="role"><option value="parent">Responsável</option><option value="student">Aluno(a)</option></select></label></div><fieldset><legend>Alunos vinculados</legend>{students.map((student) => <label className="check-row" key={student.id}><input type="checkbox" name="students" value={student.id} />{student.nome} · {student.turma}</label>)}</fieldset><Button type="submit" disabled={pending || !students.length}>{pending ? 'Emitindo…' : 'Emitir convite'}</Button></form>{error && <p role="alert">{error}</p>}{code && <div className="panel-alert" role="status"><p>Convite emitido. Copie e entregue ao destinatário:</p><code className="break-all select-all">{code}</code><p>Estudantes devem se cadastrar no ava.enigma; responsáveis, no Portal Enigma.</p></div>}</section>
}
