import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock3, Trophy } from 'lucide-react'
import { Button } from '@atoms'
import * as api from '@api'
import type { Answer, Assignment, Attempt, Question } from '@/types/student'
export function Activity({ token, activity, onClose }: { token: string; activity: Assignment; onClose: () => void }) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [history, setHistory] = useState<Attempt[]>([])
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    let alive = true
    void api.attempts(token, activity.id).then((items) => { if (alive) { setHistory(items); setLoaded(true) } }).catch((reason: Error) => { if (alive) setError(reason.message) })
    return () => { alive = false }
  }, [token, activity.id])
  useEffect(() => {
    if (!question || answer) return
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(question.startedAt).getTime()) / 1000)))
    update(); const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [question, answer])
  async function load() { setPending(true); setError(''); try { setHistory(await api.attempts(token, activity.id)); setLoaded(true) } catch (e) { setError((e as Error).message) } finally { setPending(false) } }
  async function start(id: string) { setPending(true); setError(''); setAnswer(null); try { setQuestion(await api.startQuestion(token, activity.id, id)) } catch (e) { setError((e as Error).message) } finally { setPending(false) } }
  async function submit(optionId: string) {
    if (!question) return
    setPending(true); setError('')
    try { const result = await api.answerQuestion(token, activity.id, question.id, optionId); setAnswer(result); setHistory((items) => [...items.filter((item) => item.questionId !== question.id), { questionId: question.id, correct: result.correct, seconds: result.seconds, points: result.points, selectedOptionId: optionId }]) }
    catch (e) { setError((e as Error).message) }
    finally { setPending(false) }
  }
  const finished = loaded && history.length >= activity.questionIds.length
  const nextId = activity.questionIds.find((id) => !history.some((item) => item.questionId === id))
  const correct = history.filter((item) => item.correct).length
  return <section className="grid gap-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">SUA MISSÃO DE HOJE</p><h1 className="text-2xl font-bold mt-2">{activity.title || 'Desafio de aprendizagem'}</h1></div><Button disabled={pending} onClick={onClose}><ArrowLeft size={16} /> Voltar</Button></div><p className="text-sm text-muted">Leia com atenção e escolha uma alternativa. O tempo é registrado pelo servidor e seus acertos ajudam sua equipe a evoluir.</p>
    {error && <div role="alert" className="feedback error"><p>{error}</p>{!loaded && <Button className="mt-3" disabled={pending} onClick={() => void load()}>Tentar novamente</Button>}</div>}
    {!loaded ? !error && <p role="status">Preparando seu desafio…</p> : <div className="panel"><div className="flex flex-wrap justify-between gap-3 text-sm font-semibold"><span>{history.length} de {activity.questionIds.length} questões respondidas</span><span>{history.reduce((total, item) => total + item.points, 0).toFixed(1)} pontos conquistados</span></div><progress className="journey-progress" value={history.length} max={activity.questionIds.length || 1} aria-label="Progresso da atividade" /><div className="flex flex-wrap gap-2 mt-4">{activity.questionIds.map((id, index) => <span key={id} className="count-badge">{history.some((item) => item.questionId === id) ? '✓' : '○'} {index + 1}</span>)}</div>{!question && nextId && <Button className="mt-5" disabled={pending} onClick={() => void start(nextId)}>{pending ? 'Preparando…' : history.length ? 'Continuar missão →' : 'Vamos começar →'}</Button>}</div>}
    {question && <article className="panel grid gap-5"><div className="flex flex-wrap items-center justify-between gap-3"><span className="eyebrow">QUESTÃO {activity.questionIds.indexOf(question.id) + 1}</span><span className="count-badge flex items-center gap-2"><Clock3 size={14} />{answer ? `${answer.seconds.toFixed(0)}s` : `${elapsed}s`}</span></div><p className="text-xs text-muted">Tempo de referência: {question.minSeconds}–{question.maxSeconds}s. Dedique um tempo à leitura antes de responder.</p><div className="whitespace-pre-wrap leading-relaxed">{question.prompt}</div>{question.images?.map((image) => <img key={image} src={image} alt="Imagem de apoio da questão original" className="max-h-96 max-w-full object-contain" />)}<div className="grid gap-3">{question.options.map((option) => <Button className={`text-left justify-start !p-4 !leading-relaxed ${answer?.correctOptionId === option.id ? '!border-green-600' : ''}`} key={option.id} disabled={pending || !!answer} onClick={() => void submit(option.id)}><strong className="count-badge">{option.id.toUpperCase()}</strong><span>{option.text}{option.image && <img src={option.image} alt={'Alternativa ' + option.id.toUpperCase()} className="max-h-48 max-w-full mt-2" />}</span></Button>)}</div>{answer && <div className="feedback" role="status"><p className="font-bold">{answer.correct ? 'Mandou bem! Resposta correta! ✨' : `Mais uma descoberta! A alternativa correta é ${answer.correctOptionId.toUpperCase()}.`}</p><p className="mt-2">Você conquistou {answer.points.toFixed(1)} pontos. {answer.correct ? 'Continue assim!' : 'Cada tentativa faz parte do aprendizado.'}</p></div>}{answer && nextId && <Button disabled={pending} onClick={() => void start(nextId)}>{pending ? 'Preparando…' : 'Próxima questão →'}</Button>}{question.source && <a className="text-xs text-muted underline" href={question.source.url} target="_blank" rel="noreferrer">Fonte: {question.source.provider} · {question.source.year}</a>}</article>}
    {finished && <div className="panel grid gap-4 text-center justify-items-center"><span className="stat-icon !w-16 !h-16"><Trophy size={34} /></span><h2 className="text-2xl font-bold">Missão concluída! 🎉</h2><p>Você acertou {correct} de {activity.questionIds.length} questões.</p><strong className="text-3xl text-accent">Nota {activity.questionIds.length ? (correct / activity.questionIds.length * 10).toFixed(1) : '0,0'} / 10</strong><p className="text-sm text-muted">Seus resultados foram registrados. Seu professor e sua equipe já podem acompanhar sua evolução.</p><Button onClick={onClose}><CheckCircle2 size={17} /> Voltar para minha jornada</Button></div>}
  </section>
}
