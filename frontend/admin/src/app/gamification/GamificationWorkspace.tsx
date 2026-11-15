import { useState } from 'react'
import type { FormEvent } from 'react'
import { usePortal } from '@context/PortalContext'
import { courses, getAccessibleClasses } from '@app/academic'
import { getAcademicAccess, normalizeClassLabel } from '@app/private/academicAccess'
import { useStudents } from '@hook/useStudents'
import { useLearning } from '@hook/useLearning'
import { useGamification } from '@hook/useGamification'
import { getLearning } from '@api/learning'
import type { GameRound, Reward } from '@/types/gamification'
import { rankAcademicGroups, rankGroups, scoreResult, validateScoreBounds } from './scoring'
import { ExtraAssignments } from './ExtraAssignments'
import { PageHeading } from '@molecules'

const inputClass = 'workspace-input'
const panelClass = 'workspace-panel space-y-4'
const buttonClass = 'workspace-button'
const icons: Record<Reward['icon'], string> = { star: '⭐', rocket: '🚀', gem: '💎', medal: '🏅' }
function fields(event: FormEvent<HTMLFormElement>) { event.preventDefault(); return new FormData(event.currentTarget) }
function num(data: FormData, name: string) { return Number(data.get(name)) }
function str(data: FormData, name: string) { return String(data.get(name) ?? '').trim() }
function NumberField({ name, label, value, min = 0, max = 100000 }: { name: string; label: string; value: number; min?: number; max?: number }) {
  return <label className="grid gap-1 text-sm">{label}<input className={inputClass} name={name} type="number" min={min} max={max} defaultValue={value} required /></label>
}

export function GamificationWorkspace() {
  const { member } = usePortal()
  if (!member || !['admin', 'director', 'teacher'].includes(member.role)) return <p role="status">Área restrita à equipe docente e à gestão.</p>
  return <TeacherGamification />
}

function TeacherGamification() {
  const { member, token } = usePortal()
  const learning = useLearning(token)
  const { data, loading, saving, error, save, reload } = useGamification(token)
  const { students, loading: studentsLoading, studentError } = useStudents(token)
  const access = getAcademicAccess(member!)
  const classrooms = courses.flatMap((course) => getAccessibleClasses(course, access).map((classroom) => ({ ...classroom, courseId: course.id, courseName: course.name })))
  const [classId, setClassId] = useState('')
  const selectedClass = classrooms.find((item) => `${item.courseId}/${item.id}` === classId) ?? classrooms[0]
  const [feedback, setFeedback] = useState('')
  const [section, setSection] = useState<'groups' | 'rounds' | 'extras' | 'rewards'>('groups')
  const [roundId, setRoundId] = useState('')
  const [editingGroupId, setEditingGroupId] = useState('')
  const [extraPreview, setExtraPreview] = useState<{ name: string; prompts: string[] }[]>([])
  const [selecting, setSelecting] = useState(false)
  const roster = students.filter((student) => selectedClass && (student.turma === selectedClass.id || normalizeClassLabel(student.turma) === normalizeClassLabel(selectedClass.label)))
  const groups = data?.groups.filter((group) => group.classId === selectedClass?.id && group.courseId === selectedClass?.courseId) ?? []
  const rounds = data?.rounds.filter((round) => round.classId === selectedClass?.id && round.courseId === selectedClass?.courseId) ?? []
  const currentRound = rounds.find((round) => round.id === roundId) ?? rounds[0]
  const policy = data?.policies.find((item) => item.classId === selectedClass?.id && item.courseId === selectedClass?.courseId)
  const editingGroup = groups.find((group) => group.id === editingGroupId)

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    const form = fields(event)
    if (!data || !selectedClass) return
    const ids = form.getAll('students').map(Number)
    const capacity = num(form, 'capacity')
    if (!str(form, 'name') || !Number.isInteger(capacity) || capacity < 1 || capacity > 100 || ids.length === 0 || ids.length > capacity || new Set(ids).size !== ids.length || ids.some((id) => !roster.some((student) => student.id === id) || groups.some((group) => group.id !== editingGroup?.id && group.studentIds.includes(id)))) {
      setFeedback('Escolha alunos da mesma turma, sem repetição e dentro do tamanho definido.'); return
    }
    if (await save({ ...data, groups: [...data.groups.filter((group) => group.id !== editingGroup?.id), { id: editingGroup?.id ?? crypto.randomUUID(), name: str(form, 'name'), courseId: selectedClass.courseId, classId: selectedClass.id, classLabel: selectedClass.label, capacity, studentIds: ids }] })) { setEditingGroupId(''); setFeedback('Grupo salvo. Rodadas anteriores mantêm seus participantes.') }
  }
  async function createRound(event: FormEvent<HTMLFormElement>) {
    const form = fields(event)
    if (!data || !selectedClass) return
    const round: GameRound = { id: crypto.randomUUID(), title: str(form, 'title'), courseId: selectedClass.courseId, classId: selectedClass.id, minSeconds: num(form, 'minSeconds'), maxSeconds: num(form, 'maxSeconds'), minPoints: num(form, 'minPoints'), maxPoints: num(form, 'maxPoints'), groups: groups.map((group) => ({ groupId: group.id, name: group.name, studentIds: [...group.studentIds] })), results: [] }
    if (!round.title || !groups.length || !validateScoreBounds(round)) { setFeedback('Cadastre grupos e informe limites válidos: tempo máximo maior que mínimo e pontos máximos maiores ou iguais aos mínimos.'); return }
    if (await save({ ...data, rounds: [...data.rounds, round] })) { setRoundId(round.id); setFeedback('Rodada salva com os participantes atuais congelados.') }
  }
  async function recordResult(event: FormEvent<HTMLFormElement>) {
    const form = fields(event)
    if (!data || !currentRound) return
    const result = { studentId: num(form, 'studentId'), correct: form.get('correct') === 'on', elapsedSeconds: num(form, 'elapsedSeconds') }
    if (!Number.isFinite(result.elapsedSeconds) || result.elapsedSeconds < 0 || !currentRound.groups.some((group) => group.studentIds.includes(result.studentId))) { setFeedback('Selecione um participante da rodada e um tempo válido.'); return }
    if (await save({ ...data, rounds: data.rounds.map((round) => round.id === currentRound.id ? { ...round, results: [...round.results.filter((item) => item.studentId !== result.studentId), result] } : round) })) setFeedback('Resultado salvo. Um registro anterior deste aluno foi substituído.')
  }
  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    const form = fields(event)
    if (!data || !selectedClass) return
    const next = { id: policy?.id ?? crypto.randomUUID(), courseId: selectedClass.courseId, classId: selectedClass.id, periodDays: num(form, 'periodDays'), deadlineDays: num(form, 'deadlineDays'), questionCount: num(form, 'questionCount'), bonusPoints: num(form, 'bonusPoints'), approvalMode: str(form, 'approvalMode') as 'teacher' | 'automatic' }
    if (![next.periodDays, next.deadlineDays, next.questionCount].every((value) => Number.isInteger(value) && value > 0 && value <= 365) || !Number.isFinite(next.bonusPoints) || next.bonusPoints < 0) { setFeedback('Informe números válidos para a política.'); return }
    if (await save({ ...data, policies: [...data.policies.filter((item) => item.id !== next.id), next] })) setFeedback('Política salva. O agendamento depende de execução no servidor.')
  }
  async function previewExtras() {
    if (!policy) { setFeedback('Salve uma política antes de selecionar questões.'); return }
    setSelecting(true); setExtraPreview([])
    try {
      const learning = await getLearning(token)
      const approved = learning.questions.filter((question) => question.status === 'approved' && question.courseId === selectedClass.courseId)
      setExtraPreview(roster.map((student) => {
        const results = learning.results.filter((result) => result.studentId === student.id && result.classId === selectedClass.id && result.courseId === selectedClass.courseId)
        const weaknesses = new Set(results.filter((result) => result.totalQuestions > 0 && result.correctAnswers / result.totalQuestions < 0.6).map((result) => result.skill))
        const seen = new Set(results.map((result) => result.questionId))
        const ordered = [...approved].sort((a, b) => (Number(weaknesses.has(b.skill)) * 2 + Number(!seen.has(b.id))) - (Number(weaknesses.has(a.skill)) * 2 + Number(!seen.has(a.id))) || a.id.localeCompare(b.id))
        return { name: student.nome, prompts: ordered.slice(0, policy.questionCount).map((question) => question.prompt) }
      }))
      setFeedback('Prévia selecionada por habilidades com menos de 60% de acerto, priorizando questões inéditas. Não foi publicada nem agendada.')
    } catch { setFeedback('Não foi possível consultar as questões e os resultados de aprendizagem.') }
    finally { setSelecting(false) }
  }
  async function createReward(event: FormEvent<HTMLFormElement>) {
    const form = fields(event)
    if (!data) return
    const reward: Reward = { id: crypto.randomUUID(), name: str(form, 'name'), icon: str(form, 'icon') as Reward['icon'], minimumScore: num(form, 'minimumScore') }
    if (!reward.name || !icons[reward.icon] || !Number.isFinite(reward.minimumScore) || reward.minimumScore < 0) { setFeedback('Informe uma recompensa e uma pontuação mínima válida.'); return }
    if (await save({ ...data, rewards: [...data.rewards, reward] })) setFeedback('Recompensa salva.')
  }
  async function awardReward(event: FormEvent<HTMLFormElement>) {
    const form = fields(event)
    if (!data || !currentRound) return
    const studentId = num(form, 'studentId'), rewardId = str(form, 'rewardId')
    const reward = data.rewards.find((item) => item.id === rewardId)
    const result = currentRound.results.find((item) => item.studentId === studentId)
    if (!reward || !result || !currentRound.groups.some((group) => group.studentIds.includes(studentId)) || scoreResult(currentRound, result) < reward.minimumScore || data.awards.some((item) => item.studentId === studentId && item.roundId === currentRound.id && item.rewardId === rewardId)) { setFeedback('O aluno precisa ter resultado, cumprir o critério e não ter recebido essa recompensa nesta rodada.'); return }
    if (await save({ ...data, awards: [...data.awards, { id: crypto.randomUUID(), rewardId, studentId, roundId: currentRound.id }] })) setFeedback('Recompensa atribuída.')
  }
  if (loading) return <p role="status">Carregando gamificação…</p>
  if (!data) return <div role="alert"><p>{error}</p><button className={buttonClass} onClick={reload}>Tentar novamente</button></div>
  if (!selectedClass) return <p>Nenhuma turma disponível para seu vínculo.</p>
  const participantIds = currentRound?.groups.flatMap((group) => group.studentIds) ?? []
  const participantOptions = participantIds.map((id) => <option key={id} value={id}>{students.find((student) => student.id === id)?.nome ?? `Aluno ${id}`}</option>)
  return <section className="space-y-6 p-1">
    <PageHeading eyebrow="Aprendizagem em equipe" title="Grupos e desafios" description="Organize equipes, acompanhe as rodadas e reconheça cada conquista." />
    <label className="grid gap-1">Disciplina e turma<select className={inputClass} value={`${selectedClass.courseId}/${selectedClass.id}`} onChange={(event) => { setClassId(event.target.value); setRoundId(''); setExtraPreview([]); setFeedback('') }}>{classrooms.map((item) => <option key={`${item.courseId}/${item.id}`} value={`${item.courseId}/${item.id}`}>{item.courseName} · {item.label}</option>)}</select></label>
    {error && <p role="alert" className="text-red">{error}</p>}{feedback && <p role="status" className="rounded bg-amber-soft p-3">{feedback}</p>}
    {studentError && <p role="alert">Não foi possível carregar os alunos. Tente recarregar a página.</p>}
    <nav className="workspace-tabs" aria-label="Seções de grupos e desafios">{([['groups', 'Equipes'], ['rounds', 'Rodadas e ranking'], ['extras', 'Atividades extras'], ['rewards', 'Recompensas']] as const).map(([id, label]) => <button key={id} className={section === id ? buttonClass : 'workspace-button workspace-button-secondary'} aria-pressed={section === id} onClick={() => setSection(id)}>{label}</button>)}</nav>
    <section className={panelClass} aria-label="Ranking acadêmico"><h2 className="text-lg font-semibold">Ranking dos grupos · atividades e simulados</h2><p>Nota individual: 10 × acertos ÷ questões respondidas em todo o histórico desta disciplina e turma. A nota do grupo é a média dos integrantes; quem não respondeu conta como zero. As rodadas manuais ficam separadas.</p><button className={buttonClass} onClick={() => { learning.reload(); reload() }}>Atualizar ranking</button>
      {learning.loading ? <p role="status">Carregando notas…</p> : learning.error ? <p role="alert">{learning.error}</p> : <ol className="space-y-2">{rankAcademicGroups(groups, learning.data.results).map((group, index) => <li key={group.id} className="rounded bg-canvas p-3"><div className="flex justify-between gap-3"><strong>{index + 1}. {group.name}</strong><strong>{group.average.toFixed(2)} / 10</strong></div><p className="text-sm">{group.studentGrades.map((student) => `${students.find((item) => item.id === student.studentId)?.nome ?? `Aluno ${student.studentId}`}: ${student.grade.toFixed(2)} (${student.total} respostas)`).join(' · ')}</p></li>)}</ol>}{!groups.length && <p>Cadastre grupos para acompanhar o ranking.</p>}
    </section>
    <fieldset disabled={saving || studentsLoading || studentError} className="space-y-6 disabled:opacity-70">
      <section hidden={section !== 'groups'} className={panelClass}><h2 className="text-lg font-semibold">Composição dos grupos</h2><p className="text-sm">Cada aluno participa de um grupo por disciplina e turma. Alterações futuras não modificam rodadas já registradas.</p>
        <ul className="space-y-2">{groups.map((group) => <li key={group.id}><strong>{group.name}</strong> · {group.studentIds.length}/{group.capacity} — {group.studentIds.map((id) => students.find((student) => student.id === id)?.nome ?? `Aluno ${id}`).join(', ')} <button type="button" className="workspace-button workspace-button-secondary" onClick={() => setEditingGroupId(group.id)}>Editar equipe</button></li>)}</ul>{!groups.length && <p>Nenhum grupo cadastrado.</p>}
        <form key={editingGroup?.id ?? selectedClass.id} onSubmit={createGroup} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1">Nome do grupo<input className={inputClass} name="name" defaultValue={editingGroup?.name} maxLength={100} required /></label><NumberField name="capacity" label="Tamanho máximo" value={editingGroup?.capacity ?? 4} min={1} max={100} /></div>
          <fieldset><legend>Alunos disponíveis</legend><div className="grid gap-2 sm:grid-cols-2">{roster.filter((student) => !groups.some((group) => group.id !== editingGroup?.id && group.studentIds.includes(student.id))).map((student) => <label key={student.id} className="flex items-center gap-2"><input type="checkbox" name="students" value={student.id} defaultChecked={editingGroup?.studentIds.includes(student.id)} />{student.nome}</label>)}</div>{!roster.length && <p>Nenhum aluno vinculado a esta turma.</p>}</fieldset><div className="button-row"><button className={buttonClass}>{editingGroup ? 'Salvar equipe' : 'Criar equipe'}</button>{editingGroup && <button type="button" className="workspace-button workspace-button-secondary" onClick={() => setEditingGroupId('')}>Cancelar</button>}</div></form>
      </section>
      <section hidden={section !== 'rounds'} className={panelClass}><h2 className="text-lg font-semibold">Rodadas manuais · pontuação por tempo</h2><p className="text-sm">Acerto: pontos decrescem linearmente entre os limites de tempo e ficam limitados aos pontos mínimo e máximo. Erro ou ausência: zero. A média inclui todos os participantes congelados na criação.</p>
        <form onSubmit={createRound} className="space-y-3"><label className="grid gap-1">Título da rodada<input name="title" className={inputClass} required maxLength={120} /></label><div className="grid gap-3 sm:grid-cols-4"><NumberField name="minSeconds" label="Tempo mínimo (s)" value={10} /><NumberField name="maxSeconds" label="Tempo máximo (s)" value={60} min={1} /><NumberField name="minPoints" label="Pontos mínimos" value={10} /><NumberField name="maxPoints" label="Pontos máximos" value={100} /></div><button className={buttonClass}>Registrar rodada</button></form>
        {currentRound ? <><label className="grid gap-1">Rodada<select className={inputClass} value={currentRound.id} onChange={(event) => setRoundId(event.target.value)}>{rounds.map((round) => <option key={round.id} value={round.id}>{round.title}</option>)}</select></label>
          <ol className="space-y-2">{rankGroups(currentRound).map((group, index) => <li key={group.groupId} className="flex justify-between rounded bg-canvas p-3"><span>{index + 1}. {group.name} · {group.studentIds.length} participantes</span><strong>{group.average.toFixed(2)} pontos</strong></li>)}</ol>
          <form onSubmit={recordResult} className="grid items-end gap-3 sm:grid-cols-4"><label className="grid gap-1">Participante<select name="studentId" className={inputClass} required>{participantOptions}</select></label><NumberField name="elapsedSeconds" label="Tempo da resposta (s)" value={30} /><label className="flex gap-2 py-2"><input type="checkbox" name="correct" />Resposta correta</label><button className={buttonClass}>Salvar resultado</button></form>
        </> : <p>Nenhuma rodada registrada.</p>}
      </section>
      <section hidden={section !== 'extras'} className={panelClass}><h2 className="text-lg font-semibold">Atividades extras personalizadas</h2><p>Configure a política e confira a seleção a partir de questões aprovadas e dificuldades registradas.</p><p className="rounded bg-amber-soft p-3 text-sm">As listas usam questões aprovadas. Escolha a revisão do professor para conferir cada atividade antes da publicação.</p>
        <form key={policy?.id ?? selectedClass.id} onSubmit={savePolicy} className="space-y-3"><div className="grid gap-3 sm:grid-cols-4"><NumberField name="periodDays" label="Periodicidade (dias)" value={policy?.periodDays ?? 7} min={1} max={365} /><NumberField name="deadlineDays" label="Prazo (dias)" value={policy?.deadlineDays ?? 3} min={1} max={365} /><NumberField name="questionCount" label="Quantidade de questões" value={policy?.questionCount ?? 5} min={1} max={365} /><NumberField name="bonusPoints" label="Bônus por atividade" value={policy?.bonusPoints ?? 10} /></div><label className="grid gap-1">Aprovação<select className={inputClass} name="approvalMode" defaultValue={policy?.approvalMode ?? 'teacher'}><option value="teacher">Revisão do professor</option><option value="automatic">Automática</option></select></label><button className={buttonClass}>Salvar política</button></form><button type="button" className={buttonClass} disabled={selecting || !policy} onClick={() => void previewExtras()}>{selecting ? 'Selecionando…' : 'Gerar prévia personalizada'}</button>
        {extraPreview.map((item, index) => <details key={index} className="rounded border p-3"><summary>{item.name} · {item.prompts.length} questões</summary>{item.prompts.length ? <ol className="list-inside list-decimal">{item.prompts.map((prompt, position) => <li key={position}>{prompt}</li>)}</ol> : <p>Não há questões aprovadas para esta disciplina.</p>}{policy && item.prompts.length < policy.questionCount && <p className="text-sm text-amber">Banco aprovado insuficiente para a quantidade solicitada.</p>}</details>)}
      </section>
      <div hidden={section !== 'extras'}><ExtraAssignments token={token} policyId={policy?.id} courseId={selectedClass.courseId} classId={selectedClass.id} students={roster} /></div>
      <section hidden={section !== 'rewards'} className={panelClass}><h2 className="text-lg font-semibold">Recompensas</h2><p>Emojis e selo geométrico original, sem personagens licenciados. Critério: pontos individuais na rodada selecionada.</p><div className="flex flex-wrap gap-3">{data.rewards.map((reward) => <span key={reward.id} className="inline-flex items-center gap-2 rounded border p-3"><svg width="28" height="28" viewBox="0 0 28 28" role="img" aria-label="Selo Enigma"><path d="M14 2 25 8v12l-11 6L3 20V8Z" fill="#fcd4a0" /><path d="m8 14 4 4 8-9" fill="none" stroke="#30475e" strokeWidth="3" /></svg>{icons[reward.icon]} {reward.name} · ≥ {reward.minimumScore}</span>)}</div>{!data.rewards.length && <p>Nenhuma recompensa cadastrada.</p>}
        <form onSubmit={createReward} className="grid items-end gap-3 sm:grid-cols-4"><label className="grid gap-1">Nome<input name="name" className={inputClass} required maxLength={100} /></label><label className="grid gap-1">Emoji<select name="icon" className={inputClass}>{Object.entries(icons).map(([key, icon]) => <option key={key} value={key}>{icon}</option>)}</select></label><NumberField name="minimumScore" label="Pontos mínimos" value={80} /><button className={buttonClass}>Criar recompensa</button></form>
        {currentRound && data.rewards.length > 0 && <form onSubmit={awardReward} className="grid items-end gap-3 sm:grid-cols-3"><label className="grid gap-1">Participante<select name="studentId" className={inputClass}>{participantOptions}</select></label><label className="grid gap-1">Recompensa<select name="rewardId" className={inputClass}>{data.rewards.map((reward) => <option key={reward.id} value={reward.id}>{reward.name}</option>)}</select></label><button className={buttonClass}>Atribuir recompensa</button></form>}
        <ul>{data.awards.filter((award) => rounds.some((round) => round.id === award.roundId)).map((award) => <li key={award.id}>{students.find((student) => student.id === award.studentId)?.nome ?? 'Aluno'} — {data.rewards.find((reward) => reward.id === award.rewardId)?.name ?? 'Recompensa'} ({rounds.find((round) => round.id === award.roundId)?.title})</li>)}</ul>
      </section>
    </fieldset>
  </section>
}
