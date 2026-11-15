import type { LearningResult } from '@/types/learning'

export function summarizeResults(results: LearningResult[]) {
  const total = results.reduce((sum, result) => sum + result.totalQuestions, 0)
  const correct = results.reduce((sum, result) => sum + result.correctAnswers, 0)
  const errorRate = total ? (total - correct) / total : null
  // Intervalo de Wilson descritivo; respostas repetidas não são amostras independentes.
  const z = 1.96
  const denominator = 1 + z * z / Math.max(total, 1)
  const center = errorRate === null ? 0 : (errorRate + z * z / (2 * total)) / denominator
  const margin = errorRate === null ? 0 : z * Math.sqrt(errorRate * (1 - errorRate) / total + z * z / (4 * total * total)) / denominator
  return { total, correct, records: results.length, students: new Set(results.map((result) => result.studentId)).size, errorRate, lower: Math.max(0, center - margin), upper: Math.min(1, center + margin) }
}

export function compareExtraResults(results: LearningResult[]) {
  // Pareia aluno e conteúdo e usa somente registros posteriores à primeira atividade extra.
  const groups = new Map<string, LearningResult[]>()
  for (const result of results) {
    const key = `${result.studentId}|${result.courseId}|${result.content}|${result.skill}`
    groups.set(key, [...(groups.get(key) ?? []), result])
  }
  const before: LearningResult[] = []
  const after: LearningResult[] = []
  let matched = 0
  for (const entries of groups.values()) {
    const firstExtra = entries.filter((entry) => entry.extra).map((entry) => entry.recordedAt).sort()[0]
    if (!firstExtra) continue
    const prior = entries.filter((entry) => !entry.extra && entry.recordedAt < firstExtra)
    const later = entries.filter((entry) => !entry.extra && entry.recordedAt > firstExtra)
    if (prior.length && later.length) { before.push(...prior); after.push(...later); matched++ }
  }
  return { before: summarizeResults(before), after: summarizeResults(after), matched }
}

export function hasPersistentDifficulty(results: LearningResult[]) {
  const latest = [...results].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, 3)
  return latest.length === 3 && latest.every((result) => result.totalQuestions > 0 && result.correctAnswers / result.totalQuestions < .6)
}

// Usa todos os registros do escopo; agregados não são atribuídos a questões específicas.
export function analyzeDifficulties(results: LearningResult[]) {
  const areas = new Map<string, LearningResult[]>()
  const questions = new Map<string, LearningResult[]>()
  for (const result of results) {
    const key = JSON.stringify([result.courseId, result.content, result.skill])
    const area = areas.get(key) ?? []; area.push(result); areas.set(key, area)
    if (result.questionId && result.totalQuestions === 1) {
      const entries = questions.get(result.questionId) ?? []
      entries.push(result); questions.set(result.questionId, entries)
    }
  }
  const summarize = (entries: LearningResult[]) => {
    const summary = summarizeResults(entries)
    const errors = summary.total - summary.correct
    return { ...summary, errors, lastAt: entries.reduce((last, entry) => entry.recordedAt > last ? entry.recordedAt : last, ''),
      recommendation: summary.total < 3 ? 'Evidência inicial: propor mais questões variadas desta habilidade.' :
        (summary.errorRate ?? 0) >= .4 ? 'Retomar os pré-requisitos com exemplos guiados, propor reforço e reavaliar a habilidade.' :
        'Manter prática espaçada e conferir a retenção em outra atividade.' }
  }
  return {
    areas: [...areas].map(([key, entries]) => { const [courseId, content, skill] = JSON.parse(key) as [string, string, string]; return { courseId, content, skill, ...summarize(entries) } }).sort((a, b) => (b.errorRate ?? 0) - (a.errorRate ?? 0) || b.total - a.total),
    questions: [...questions].map(([questionId, entries]) => ({ questionId, content: entries[0].content, skill: entries[0].skill, ...summarize(entries) })).sort((a, b) => b.errors - a.errors || (b.errorRate ?? 0) - (a.errorRate ?? 0)),
    detailed: results.filter((entry) => entry.questionId && entry.totalQuestions === 1).length,
    aggregate: results.filter((entry) => !entry.questionId || entry.totalQuestions !== 1).length,
  }
}
