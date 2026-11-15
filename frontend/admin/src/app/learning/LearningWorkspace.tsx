import { useState, type FormEvent, type ReactNode } from 'react'

import { usePortal } from '@context'

import { courses, getAccessibleClasses } from '@app/academic'

import { getAcademicAccess, normalizeClassLabel } from '@app/private/academicAccess'

import { useStudents } from '@hook/useStudents'

import { useLearning } from '@hook/useLearning'

import type { LearningQuestion, LearningResult } from '@/types/learning'

import { analyzeDifficulties, compareExtraResults, hasPersistentDifficulty, summarizeResults } from './analytics'

import { PublicQuestionBank } from './PublicQuestionBank'

import { PageHeading } from '@molecules'



const inputClass = 'workspace-input'

const buttonClass = 'workspace-button'

function Field({ label, children }: { label: string; children: ReactNode }) {

  return <label className="grid gap-1 text-sm font-medium">{label}{children}</label>

}

function percent(value: number | null) { return value === null ? 'Sem dados' : `${(value * 100).toFixed(1)}%` }

function split(value: FormDataEntryValue | null) { return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean) }



export default function LearningWorkspace() {

  const { member, token, visitor } = usePortal()

  if (!member || !token || visitor) return <p className="p-6">Entre com uma conta da escola para consultar a aprendizagem.</p>

  return <LearningContent token={token} member={member} />

}



function LearningContent({ token, member }: { token: string; member: NonNullable<ReturnType<typeof usePortal>['member']> }) {

  const learning = useLearning(token)

  const roster = useStudents(token)

  const access = getAcademicAccess(member)

  const availableCourses = courses.filter((course) => getAccessibleClasses(course, access).length)

  const [courseId, setCourseId] = useState(availableCourses[0]?.id ?? '')

  const course = availableCourses.find((item) => item.id === courseId)

  const classrooms = course ? getAccessibleClasses(course, access) : []

  const [classId, setClassId] = useState('')

  const selectedClass = classrooms.find((item) => item.id === classId) ?? classrooms[0]

  const students = roster.students.filter((student) => selectedClass && (student.turma === selectedClass.id || normalizeClassLabel(student.turma) === normalizeClassLabel(selectedClass.label)))

  const [tab, setTab] = useState<'analytics' | 'questions' | 'results' | 'observations'>('analytics')

  const [editing, setEditing] = useState<LearningQuestion | null>(null)

  const [message, setMessage] = useState('')

  const [formError, setFormError] = useState('')

  const [detail, setDetail] = useState(false)

  const [analyticsStudent, setAnalyticsStudent] = useState('')
  const [allCourses, setAllCourses] = useState(true)

  const questions = learning.data.questions.filter((question) => question.courseId === courseId)

  const results = learning.data.results.filter((result) => result.courseId === courseId && result.classId === selectedClass?.id && students.some((student) => student.id === result.studentId))

  const observations = learning.data.observations.filter((item) => item.courseId === courseId && item.classId === selectedClass?.id && (item.studentId === undefined || students.some((student) => student.id === item.studentId)))

  const evidence = (allCourses ? learning.data.results.filter((result) => result.classId === selectedClass?.id && students.some((student) => student.id === result.studentId)) : results).filter((result) => !analyticsStudent || String(result.studentId) === analyticsStudent)

  const difficulties = analyzeDifficulties(evidence)

  const summary = summarizeResults(evidence)

  const comparison = compareExtraResults(evidence)



  async function submit(event: FormEvent<HTMLFormElement>, operation: (form: FormData) => Promise<void>) {

    event.preventDefault()

    const element = event.currentTarget

    setMessage(''); setFormError('')

    try { await operation(new FormData(element)); setMessage('Registro salvo na escola.'); element.reset() }

    catch (error) { setFormError(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.') }

  }

  function checkScope() { if (!course || !selectedClass) throw new Error('Selecione uma disciplina e turma vinculadas ao seu perfil.') }

  function studentId(form: FormData) {

    const id = Number(form.get('studentId'))

    if (!students.some((student) => student.id === id)) throw new Error('Selecione um aluno desta turma.')

    return id

  }

  function number(form: FormData, key: string, min: number, max: number, integer = false) {

    const raw = String(form.get(key) ?? '').trim()

    const value = Number(raw)

    if (!raw || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new Error('Verifique os números: respeite os limites indicados e use inteiros para quantidades.')

    return value

  }

  const studentSelect = <select name="studentId" required className={inputClass} defaultValue=""><option value="" disabled>Selecione o aluno</option>{students.map((student) => <option key={student.id} value={student.id}>{student.nome}</option>)}</select>

  const report = (entries: LearningResult[]) => {

    const stats = summarizeResults(entries)

    return `${percent(stats.errorRate)} de erro · ${stats.total} respostas · ${stats.records} registros · ${stats.students} alunos`

  }



  if (!availableCourses.length) return <p className="p-6">Seu perfil ainda não possui disciplinas ou turmas vinculadas.</p>

  return <section className="learning-workspace grid gap-6 min-w-0">

    <PageHeading eyebrow="Acompanhamento pedagógico" title="Learning Analytics" description="Questões, resultados e próximos passos para a aprendizagem da turma." />

    <div className="grid gap-4 sm:grid-cols-2"><Field label="Disciplina"><select className={inputClass} value={courseId} onChange={(event) => { setCourseId(event.target.value); setClassId(''); setAnalyticsStudent(''); setEditing(null) }}>{availableCourses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Turma"><select className={inputClass} value={selectedClass?.id ?? ''} onChange={(event) => { setClassId(event.target.value); setAnalyticsStudent('') }}>{classrooms.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field></div>

    <nav aria-label="Seções de aprendizagem" className="workspace-tabs">{([['analytics', 'Análises'], ['questions', 'Banco de questões'], ['results', 'Registrar resultados'], ['observations', 'Observações e ocorrências']] as const).map(([id, label]) => <button key={id} aria-pressed={tab === id} onClick={() => { setTab(id); setFormError(''); setMessage('') }} className={tab === id ? buttonClass : 'workspace-button workspace-button-secondary'}>{label}</button>)}</nav>

    {message && <p role="status" className="rounded bg-green-soft p-3 text-green">{message}</p>}{formError && <p role="alert" className="rounded bg-red-soft p-3 text-red">{formError}</p>}

    {(learning.loading || roster.loading) ? <p role="status">Carregando registros e alunos…</p> : learning.error || roster.studentError ? <div role="alert"><p>{learning.error || 'Não foi possível carregar os alunos da turma.'}</p><button className={buttonClass} onClick={() => { learning.reload(); roster.reload() }}>Tentar novamente</button></div> : <>

      {tab === 'analytics' && <div className="grid gap-5">

        <Field label="Analisar aluno"><select className={inputClass} value={analyticsStudent} onChange={(event) => setAnalyticsStudent(event.target.value)}><option value="">Toda a turma</option>{students.map((student) => <option key={student.id} value={student.id}>{student.nome}</option>)}</select></Field>

        <label className="flex gap-2"><input type="checkbox" checked={allCourses} onChange={(event) => setAllCourses(event.target.checked)} />Incluir todas as disciplinas autorizadas no histórico da turma</label>
        <div className="rounded border bg-[var(--surface)] p-5"><h2 className="text-xl font-semibold">Evidências de atividades e simulados</h2><p className="mt-2">Todo o histórico autorizado do recorte selecionado: {difficulties.detailed} respostas individuais e {difficulties.aggregate} registros agregados.</p><p className="text-sm text-[var(--muted)]">As respostas enviadas no portal do aluno entram automaticamente. Agregados contribuem para as áreas, sem atribuir erros a uma questão. Recomendações seguem regras de acerto, sem diagnóstico por IA.</p>

          <h3 className="mt-4 font-semibold">Áreas para acompanhamento</h3>{difficulties.areas.map((area) => <article className="border-b py-3" key={JSON.stringify([area.courseId, area.content, area.skill])}><strong>{courses.find((course) => course.id === area.courseId)?.name ?? area.courseId} · {area.content} · {area.skill}</strong><p>{area.errors} erros em {area.total} respostas · {percent(area.errorRate)} de erro · {area.students} alunos</p><p className="text-sm">{area.recommendation}</p></article>)}

          <h3 className="mt-4 font-semibold">Questões com mais erros</h3>{difficulties.questions.filter((question) => question.errors > 0).map((question) => <article className="border-b py-3" key={question.questionId}><strong>{learning.data.questions.find((item) => item.id === question.questionId)?.prompt ?? `Questão ${question.questionId}`}</strong><p>{question.content} · {question.skill}</p><p>{question.errors} erros em {question.total} respostas · {percent(question.errorRate)} de erro · Última resposta {new Date(question.lastAt).toLocaleDateString('pt-BR')}</p><p className="text-sm">{question.recommendation}</p></article>)}{!difficulties.questions.some((question) => question.errors > 0) && <p className="mt-2">Sem erros por questão registrados neste recorte.</p>}

        </div>

        <div className="rounded border bg-[var(--surface)] p-5"><h2 className="text-xl font-semibold">Panorama do recorte selecionado</h2><p className="mt-3 text-2xl font-bold">{percent(summary.errorRate)} de erro</p><p>{summary.total} respostas registradas · {summary.records} registros · {summary.students} alunos</p>{summary.total > 0 && <p>Intervalo descritivo de 95%: {percent(summary.lower)}–{percent(summary.upper)}.</p>}<p className="mt-3 text-sm text-[var(--muted)]">Mais questões e maior diversidade de conteúdos melhoram a precisão. O intervalo usa Wilson e pressupõe respostas independentes; repetições e resultados agregados podem reduzir essa confiança. Não representa diagnóstico individual.</p></div>

        {!results.length && <p>Nenhum resultado nesta turma. Registre uma avaliação para iniciar a análise.</p>}

        <div className="grid gap-5 lg:grid-cols-2"><div className="rounded border bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">Por conteúdo e habilidade</h2>{[...new Set(evidence.map((result) => JSON.stringify([result.courseId, result.content, result.skill])))].map((key) => { const [areaCourseId, content, skill] = JSON.parse(key) as [string, string, string]; const entries = evidence.filter((result) => result.courseId === areaCourseId && result.content === content && result.skill === skill); const stats = summarizeResults(entries); return <article key={key} className="border-b py-3"><h3 className="font-semibold">{content} · {skill}</h3><p className="text-sm">{report(entries)}</p><p className="mt-2 text-sm text-[var(--muted)]">{stats.total < 10 ? 'Evidência inicial: aplique mais questões variadas antes de concluir.' : (stats.errorRate ?? 0) >= .4 ? 'Sugestão por regra: revisar pré-requisitos e aplicar uma atividade extra focalizada; depois reavaliar.' : 'Sugestão por regra: manter prática espaçada e verificar a retenção em nova avaliação.'}</p></article> })}</div>

        <div className="rounded border bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">Por aluno</h2>{students.map((student) => <article className="border-b py-3" key={student.id}><h3 className="font-semibold">{student.nome}</h3><p className="text-sm">{report(results.filter((result) => result.studentId === student.id))}</p></article>)}{!students.length && <p>Nenhum aluno cadastrado nesta turma.</p>}</div></div>

        <div className="rounded border bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">Sinais de dificuldade persistente</h2><p className="text-sm text-[var(--muted)]">Regra de acompanhamento: menos de 60% de acerto nos três registros mais recentes do mesmo aluno, conteúdo e habilidade. Não equivale a diagnóstico.</p>{students.map((student) => { const entries = results.filter((result) => result.studentId === student.id); const keys = [...new Set(entries.map((entry) => JSON.stringify([entry.content, entry.skill])))]; const flagged = keys.filter((key) => { const [content, skill] = JSON.parse(key) as [string, string]; return hasPersistentDifficulty(entries.filter((entry) => entry.content === content && entry.skill === skill)) }); return flagged.length ? <p className="mt-3" key={student.id}><strong>{student.nome}:</strong> {flagged.map((key) => (JSON.parse(key) as string[]).join(' / ')).join('; ')}. Recomenda-se revisar os registros e conversar com o aluno antes de ajustar o apoio.</p> : null })}<p className="mt-3 text-sm">A ausência de sinal pode significar dados insuficientes.</p></div>

        <div className="rounded border bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">Antes e depois de atividades extras</h2>{comparison.matched ? <><p>{comparison.matched} pares aluno/conteúdo/habilidade com avaliações regulares antes e após a primeira atividade extra.</p><p>Antes: {percent(comparison.before.errorRate)} de erro ({comparison.before.total} respostas).</p><p>Depois: {percent(comparison.after.errorRate)} de erro ({comparison.after.total} respostas).</p><p>Variação: {(((comparison.after.errorRate ?? 0) - (comparison.before.errorRate ?? 0)) * 100).toFixed(1)} pontos percentuais.</p></> : <p>Sem comparação disponível. É necessário registrar uma avaliação regular, uma atividade extra e outra avaliação regular posterior para o mesmo aluno, conteúdo e habilidade.</p>}<p className="mt-2 text-sm text-[var(--muted)]">Comparação observacional, sem atribuir causalidade. Dificuldade, quantidade de questões e tempo entre avaliações podem mudar.</p></div>

      </div>}

      {tab === 'questions' && <PublicQuestionBank token={token} courseId={courseId} onImported={learning.reload} />}

      {tab === 'questions' && <div className="grid gap-6 lg:grid-cols-2">

        <form key={`${courseId}-${editing?.id ?? 'new'}`} className="grid content-start gap-3 rounded border bg-[var(--surface)] p-5" onSubmit={(event) => void submit(event, async (form) => {

          checkScope()

          const minSeconds = number(form, 'minSeconds', 0, 86400)

          const maxSeconds = number(form, 'maxSeconds', minSeconds, 86400)

          const options = (editing?.options.map((option) => option.id) ?? ['a', 'b', 'c', 'd']).map((id) => ({ ...editing?.options.find((option) => option.id === id), id, text: String(form.get(`option-${id}`) ?? '').trim(), distractor: String(form.get(`distractor-${id}`) ?? '').trim() }))

          const correctOptionId = String(form.get('correctOptionId'))

          if (options.some((option) => !option.text)) throw new Error('Preencha todas as alternativas.')

          const question: LearningQuestion = { ...editing, id: editing?.id ?? crypto.randomUUID(), courseId, content: String(form.get('content')).trim(), skill: String(form.get('skill')).trim(), prompt: String(form.get('prompt')).trim(), tags: split(form.get('tags')), prerequisites: split(form.get('prerequisites')), options, correctOptionId, minSeconds, maxSeconds, status: form.get('status') === 'approved' ? 'approved' : 'draft' }

          if (!question.content || !question.skill || !question.prompt || !options.some((option) => option.id === correctOptionId)) throw new Error('Preencha conteúdo, habilidade, enunciado e gabarito.')

          await learning.save({ ...learning.data, questions: [...learning.data.questions.filter((item) => item.id !== question.id), question] }); setEditing(null)

        })}>

          <h2 className="text-xl font-semibold">{editing ? 'Editar e revisar questão' : 'Nova questão'}</h2>

          <Field label="Conteúdo"><input className={inputClass} name="content" required defaultValue={editing?.content} /></Field><Field label="Habilidade"><input className={inputClass} name="skill" required defaultValue={editing?.skill} /></Field><Field label="Enunciado"><textarea className={inputClass} name="prompt" required defaultValue={editing?.prompt} /></Field>

          <Field label="Tags (separadas por vírgula)"><input className={inputClass} name="tags" defaultValue={editing?.tags.join(', ')} /></Field><Field label="Pré-requisitos (separados por vírgula)"><input className={inputClass} name="prerequisites" defaultValue={editing?.prerequisites.join(', ')} /></Field>

          {(editing?.options.map((option) => option.id) ?? ['a', 'b', 'c', 'd']).map((id) => <fieldset className="grid gap-2 rounded border p-3" key={id}><legend>Alternativa {id.toUpperCase()}</legend><Field label="Texto"><input className={inputClass} name={`option-${id}`} required defaultValue={editing?.options.find((option) => option.id === id)?.text} /></Field><Field label="Interpretação do distrator (quando conhecida)"><input className={inputClass} name={`distractor-${id}`} defaultValue={editing?.options.find((option) => option.id === id)?.distractor} /></Field></fieldset>)}

          <Field label="Gabarito"><select className={inputClass} name="correctOptionId" defaultValue={editing?.correctOptionId ?? 'a'}>{(editing?.options.map((option) => option.id) ?? ['a', 'b', 'c', 'd']).map((id) => <option key={id} value={id}>{id.toUpperCase()}</option>)}</select></Field>

          <div className="grid grid-cols-2 gap-3"><Field label="Tempo mínimo (segundos)"><input className={inputClass} name="minSeconds" type="number" min="0" max="86400" required defaultValue={editing?.minSeconds ?? 15} /></Field><Field label="Tempo máximo (segundos)"><input className={inputClass} name="maxSeconds" type="number" min="0" max="86400" required defaultValue={editing?.maxSeconds ?? 180} /></Field></div>

          <Field label="Revisão"><select className={inputClass} name="status" defaultValue={editing?.status ?? 'draft'}><option value="draft">Rascunho</option><option value="approved">Revisada e aprovada</option></select></Field><button disabled={learning.saving} className={buttonClass}>{learning.saving ? 'Salvando…' : 'Salvar questão'}</button>{editing && <button type="button" onClick={() => setEditing(null)}>Cancelar edição</button>}

        </form>

        <div className="grid content-start gap-3"><h2 className="text-xl font-semibold">Questões da disciplina</h2>{!questions.length && <p>Nenhuma questão cadastrada.</p>}{questions.map((question) => { const entries = results.filter((result) => result.questionId === question.id); const stats = summarizeResults(entries); return <article key={question.id} className="rounded border bg-[var(--surface)] p-5"><p className="text-xs uppercase">{question.status === 'approved' ? 'Aprovada' : 'Rascunho'}</p><h3 className="font-semibold">{question.prompt}</h3><p>{question.content} · {question.skill}</p><p className="text-sm">Acerto: {stats.errorRate === null ? 'Sem dados' : percent(1 - stats.errorRate)} · Erro: {percent(stats.errorRate)} · {stats.total} respostas na turma</p><p className="text-sm">Tempo esperado: {question.minSeconds}–{question.maxSeconds}s</p><button className="mt-3 rounded border px-3 py-2" onClick={() => setEditing(question)}>Editar / revisar</button></article> })}</div>

      </div>}

      {tab === 'results' && <div className="grid gap-6 lg:grid-cols-2"><form className="grid content-start gap-3 rounded border bg-[var(--surface)] p-5" onSubmit={(event) => void submit(event, async (form) => {

        checkScope()

        const question = detail ? questions.find((item) => item.id === form.get('questionId') && item.status === 'approved') : undefined

        if (detail && !question) throw new Error('Selecione uma questão aprovada desta disciplina.')

        const totalQuestions = detail ? 1 : number(form, 'totalQuestions', 1, 10000, true)

        const correctAnswers = detail ? (form.get('correct') === 'true' ? 1 : 0) : number(form, 'correctAnswers', 0, totalQuestions, true)

        const recordedAt = new Date(String(form.get('recordedAt')))

        if (!Number.isFinite(recordedAt.getTime()) || recordedAt.getTime() > Date.now()) throw new Error('Informe uma data válida, que não esteja no futuro.')

        const result: LearningResult = { id: crypto.randomUUID(), studentId: studentId(form), courseId, classId: selectedClass!.id, ...(question ? { questionId: question.id, correct: correctAnswers === 1 } : {}), seconds: number(form, 'seconds', 0, 86400), grade: number(form, 'grade', 0, 10), totalQuestions, correctAnswers, recordedAt: recordedAt.toISOString(), extra: form.get('extra') === 'on', content: question?.content ?? String(form.get('content')).trim(), skill: question?.skill ?? String(form.get('skill')).trim() }

        if (!result.content || !result.skill) throw new Error('Informe conteúdo e habilidade.')

        await learning.save({ ...learning.data, results: [...learning.data.results, result] })

      })}><h2 className="text-xl font-semibold">Registrar evidência real</h2><Field label="Aluno">{studentSelect}</Field><Field label="Tipo de registro"><select className={inputClass} value={detail ? 'detail' : 'aggregate'} onChange={(event) => setDetail(event.target.value === 'detail')}><option value="aggregate">Avaliação agregada</option><option value="detail">Resposta por questão</option></select></Field>

        {detail ? <><Field label="Questão aprovada"><select required className={inputClass} name="questionId" defaultValue=""><option value="" disabled>Selecione</option>{questions.filter((question) => question.status === 'approved').map((question) => <option key={question.id} value={question.id}>{question.prompt}</option>)}</select></Field><Field label="Resposta observada"><select name="correct" className={inputClass}><option value="true">Correta</option><option value="false">Incorreta</option></select></Field></> : <><Field label="Conteúdo avaliado"><input name="content" className={inputClass} required /></Field><Field label="Habilidade avaliada"><input name="skill" className={inputClass} required /></Field><Field label="Total de questões"><input type="number" name="totalQuestions" min="1" max="10000" className={inputClass} required /></Field><Field label="Acertos"><input type="number" name="correctAnswers" min="0" max="10000" className={inputClass} required /></Field><p className="text-sm text-[var(--muted)]">O agregado informa apenas totais; não permite atribuir erros a questões específicas.</p></>}

        <Field label="Tempo total observado (segundos)"><input name="seconds" type="number" min="0" max="86400" step="any" className={inputClass} required /></Field><Field label="Nota (0 a 10)"><input name="grade" type="number" min="0" max="10" step="0.01" className={inputClass} required /></Field><Field label="Data e hora da avaliação"><input name="recordedAt" type="datetime-local" className={inputClass} required /></Field><label className="flex gap-2"><input name="extra" type="checkbox" />Atividade extra de reforço</label><button disabled={learning.saving || !students.length} className={buttonClass}>{learning.saving ? 'Salvando…' : 'Salvar resultado'}</button></form>

        <div><h2 className="text-xl font-semibold">Histórico de avaliações</h2>{!results.length && <p>Nenhum resultado registrado.</p>}{[...results].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).map((result) => <article className="mt-3 rounded border bg-[var(--surface)] p-4" key={result.id}><h3 className="font-semibold">{students.find((student) => student.id === result.studentId)?.nome} · {result.content}</h3><p>{result.correctAnswers}/{result.totalQuestions} acertos · Nota {result.grade} · {result.seconds}s</p><p className="text-sm">{result.questionId ? 'Por questão' : 'Agregado'} · {result.extra ? 'Atividade extra' : 'Avaliação regular'} · {new Date(result.recordedAt).toLocaleString('pt-BR')}</p></article>)}</div></div>}

      {tab === 'observations' && <div className="grid gap-6 lg:grid-cols-2"><form className="grid content-start gap-3 rounded border bg-[var(--surface)] p-5" onSubmit={(event) => void submit(event, async (form) => {

        checkScope()

        const text = String(form.get('text') ?? '').trim()

        if (!text) throw new Error('Descreva a observação ou ocorrência.')

        const selectedStudent = String(form.get('studentId') ?? '')

        const observation = { id: crypto.randomUUID(), courseId, classId: selectedClass!.id, ...(selectedStudent ? { studentId: studentId(form) } : {}), type: form.get('type') === 'incident' ? 'incident' as const : 'observation' as const, text, recordedAt: new Date().toISOString() }

        await learning.save({ ...learning.data, observations: [...learning.data.observations, observation] })

      })}><h2 className="text-xl font-semibold">Novo registro pedagógico</h2><Field label="Destinatário"><select className={inputClass} name="studentId"><option value="">Turma inteira</option>{students.map((student) => <option key={student.id} value={student.id}>{student.nome}</option>)}</select></Field><Field label="Tipo"><select className={inputClass} name="type"><option value="observation">Observação</option><option value="incident">Ocorrência</option></select></Field><Field label="Descrição"><textarea className={inputClass} rows={5} maxLength={5000} required name="text" /></Field><button disabled={learning.saving} className={buttonClass}>{learning.saving ? 'Salvando…' : 'Salvar registro'}</button></form><div><h2 className="text-xl font-semibold">Histórico da turma</h2>{!observations.length && <p>Nenhuma observação ou ocorrência registrada.</p>}{[...observations].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).map((item) => <article key={item.id} className="mt-3 rounded border bg-[var(--surface)] p-4"><h3 className="font-semibold">{item.type === 'incident' ? 'Ocorrência' : 'Observação'} · {item.studentId ? students.find((student) => student.id === item.studentId)?.nome : 'Turma inteira'}</h3><p className="whitespace-pre-wrap">{item.text}</p><p className="mt-2 text-sm text-[var(--muted)]">{new Date(item.recordedAt).toLocaleString('pt-BR')}</p></article>)}</div></div>}

    </>}

  </section>

}
