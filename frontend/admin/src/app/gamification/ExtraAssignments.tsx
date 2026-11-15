import { useEffect, useState } from 'react'
import { Button } from '@atoms'
import { approveExtraAssignment, generateExtraAssignment, getExtraAssignments } from '@api/gamification'
import type { ExtraAssignment } from '@/types/gamification'
import type { Student } from '@/types/portal'
export function ExtraAssignments({ token, policyId, courseId, classId, students }: { token: string; policyId?: string; courseId: string; classId: string; students: Student[] }) {
  const [items, setItems] = useState<ExtraAssignment[]>([])
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController(); setItems([]); setMessage('')
    void getExtraAssignments(token, controller.signal).then((items) => { if (!controller.signal.aborted) setItems(items) }).catch(() => { if (!controller.signal.aborted) setMessage('Não foi possível consultar atividades geradas.') })
    return () => controller.abort()
  }, [token, version])
  async function run(operation: () => Promise<ExtraAssignment>) {
    setPending(true); setMessage('')
    try { const saved = await operation(); setItems((items) => [...items.filter((item) => item.id !== saved.id), saved]); setMessage(saved.status === 'published' ? 'Atividade disponível no site do estudante.' : 'Atividade criada. Revise antes de publicar.') }
    catch { setMessage('Não foi possível concluir. Confira o banco aprovado, a quantidade de questões e o prazo.') }
    finally { setPending(false) }
  }
  return <div className="grid gap-3 border-t border-line pt-4"><h3 className="font-semibold">Gerar e publicar</h3><p className="text-sm">O servidor verifica as políticas a cada hora enquanto estiver em execução. As atividades ficam no site do estudante; não há envio de mensagens. Repetições no mesmo período retornam a atividade já criada.</p><Button disabled={pending} onClick={() => setVersion((v) => v + 1)}>Atualizar atividades</Button>{policyId && students.map((student) => <div className="flex flex-wrap justify-between gap-2" key={student.id}><span>{student.nome}</span><Button disabled={pending} onClick={() => void run(() => generateExtraAssignment(token, policyId, student.id))}>Gerar para {student.nome}</Button></div>)}
    {items.filter((item) => item.courseId === courseId && item.classId === classId).map((item) => <article className="border border-line p-3 grid gap-2" key={item.id}><strong>{students.find((student) => student.id === item.studentId)?.nome ?? 'Aluno'}</strong><p>{item.questionIds.length} questões · Até {new Date(item.dueAt).toLocaleDateString('pt-BR')} · {item.completedAt ? 'Concluída' : item.status === 'published' ? 'Publicada' : 'Aguardando aprovação'}</p>{item.status === 'pending_approval' && <Button disabled={pending} onClick={() => void run(() => approveExtraAssignment(token, item.id))}>Aprovar e publicar</Button>}</article>)}{message && <p role="status">{message}</p>}
  </div>
}
