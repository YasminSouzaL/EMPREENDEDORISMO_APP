import { useEffect, useState, type FormEvent } from 'react'
import { usePortal } from '@context'
import { request } from '@api/client'
import { getLearning } from '@api/learning'
import type { LearningQuestion } from '@/types/learning'

interface Assignment { id: string; title?: string; type?: string; courseId: string; classId: string; dueAt: string; completedAt?: string; status: string }
interface Material { id: string; courseId: string; classId: string; title: string; body: string; url?: string }
export function TeachingPublications({ courseId, classrooms }: { courseId: string; classrooms: {id: string; label: string}[] }) {
  const { token, visitor } = usePortal()
  const [items, setItems] = useState<Material[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [questions, setQuestions] = useState<LearningQuestion[]>([])
  const [editing, setEditing] = useState<Material | null>(null)
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!token || visitor) return
    const controller = new AbortController()
    void Promise.all([request('/teaching/contents', { signal: controller.signal }, token).then(r => r.json()), getLearning(token, controller.signal), request('/gamification/extras', {signal:controller.signal}, token).then(r => r.json())]).then(([contents, learning, extras]) => { if (!controller.signal.aborted) { setItems(contents); setQuestions(learning.questions); setAssignments(extras) } }).catch(() => { if (!controller.signal.aborted) setStatus('Falha ao carregar publicações. Atualize para tentar novamente.') })
    return () => controller.abort()
  }, [token, visitor, version])
  if (!token || visitor) return null
  const approved = questions.filter(q => q.courseId === courseId && q.status === 'approved')
  async function run(path: string, method: string, body?: unknown) {
    setPending(true); setStatus('')
    try { await request(path, { method, ...(body ? {body: JSON.stringify(body)} : {}) }, token!); setVersion(v => v + 1); setEditing(null); setStatus('Publicação atualizada no portal dos alunos.') }
    catch { setStatus('Não foi possível concluir. Confira os campos, as questões e o prazo.') }
    finally { setPending(false) }
  }
  function save(event: FormEvent<HTMLFormElement>, content: boolean) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const common = {courseId, classId: String(data.get('classId')), title: String(data.get('title')).trim()}
    if (!content && !data.getAll('questionIds').length) { setStatus('Selecione ao menos uma questão.'); return }
    const body = content ? {...common, body: String(data.get('body')), url: String(data.get('url') ?? '')} : {...common, type: data.get('type'), questionIds: data.getAll('questionIds'), dueAt: new Date(String(data.get('dueAt'))).toISOString()}
    void run(content ? `/teaching/contents${editing ? `/${editing.id}` : ''}` : '/teaching/activities', content && editing ? 'PATCH' : 'POST', body)
  }
  const classField = <label className="academic-field">Turma<select name="classId" defaultValue={editing?.classId}>{classrooms.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
  return <section className="grid gap-5"><h2>Publicações para os alunos</h2><button className="workspace-button" onClick={() => setVersion(v => v + 1)}>Atualizar</button>{status && <p role="status">{status}</p>}
    <div className="grid gap-5 lg:grid-cols-2">
      <form key={editing?.id ?? 'new'} className="academic-panel grid gap-3 p-5" onSubmit={e => save(e, true)}><h3>{editing ? 'Editar conteúdo' : 'Novo conteúdo'}</h3>{classField}<label className="academic-field">Título<input name="title" required defaultValue={editing?.title} /></label><label className="academic-field">Conteúdo<textarea name="body" required rows={4} defaultValue={editing?.body} /></label><label className="academic-field">Link complementar<input name="url" type="url" defaultValue={editing?.url} /></label><button className="workspace-button" disabled={pending}>Salvar conteúdo</button>{editing && <button type="button" onClick={() => setEditing(null)}>Cancelar edição</button>}</form>
      <form className="academic-panel grid gap-3 p-5" onSubmit={e => save(e, false)}><h3>Enviar atividade ou simulado</h3>{classField}<label className="academic-field">Título<input name="title" required /></label><label className="academic-field">Formato<select name="type"><option value="activity">Atividade</option><option value="simulation">Simulado</option></select></label><label className="academic-field">Prazo<input name="dueAt" type="datetime-local" required /></label><fieldset className="grid gap-2"><legend>Questões aprovadas</legend>{approved.map(q => <label className="flex gap-2" key={q.id}><input type="checkbox" name="questionIds" value={q.id} /><span>{q.prompt}</span></label>)}{!approved.length && <p>Aprove questões em Learning Analytics antes de publicar.</p>}</fieldset><button className="workspace-button" disabled={pending || !approved.length}>Publicar para toda a turma</button></form>
    </div>
    <section className="academic-panel grid gap-3 p-5"><h3>Atividades e simulados enviados</h3>{[...assignments.filter(item => item.courseId === courseId).reduce((groups, item) => { const key = JSON.stringify([item.title ?? 'Reforço', item.classId, item.dueAt, item.type]); groups.set(key, [...(groups.get(key) ?? []), item]); return groups }, new Map<string, Assignment[]>())].map(([key, entries]) => { const items = entries!; const first = items[0]; return <article key={key} className="border-b pb-3"><strong>{first.title ?? 'Atividade de reforço'}</strong><p>{first.type === 'simulation' ? 'Simulado' : 'Atividade'} · {classrooms.find(item => item.id === first.classId)?.label ?? first.classId} · Prazo {new Date(first.dueAt).toLocaleString('pt-BR')}</p><p>{items.filter(item => item.completedAt).length}/{items.length} entregas concluídas · {items.filter(item => item.status === 'published' && !item.completedAt).length} pendentes</p></article>})}{!assignments.some(item => item.courseId === courseId) && <p>Nenhuma atividade enviada.</p>}</section>
    <div className="academic-panel grid gap-3 p-5"><h3>Conteúdos publicados</h3>{items.filter(i => i.courseId === courseId).map(i => <article key={i.id} className="border-b pb-3"><strong>{i.title}</strong><p className="whitespace-pre-wrap">{i.body}</p><div className="flex gap-3"><button disabled={pending} onClick={() => setEditing(i)}>Editar</button><button disabled={pending} onClick={() => void run(`/teaching/contents/${i.id}`, 'DELETE')}>Excluir</button></div></article>)}{!items.some(i => i.courseId === courseId) && <p>Nenhum conteúdo publicado.</p>}</div>
  </section>
}
