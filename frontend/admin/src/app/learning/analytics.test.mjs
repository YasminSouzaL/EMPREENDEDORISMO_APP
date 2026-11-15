import assert from 'node:assert/strict'
import { test } from 'node:test'
import { summarizeResults, compareExtraResults, hasPersistentDifficulty, analyzeDifficulties } from './analytics.ts'

const result = (overrides = {}) => ({ id: 'r', studentId: 1, courseId: 'math', classId: 'class', seconds: 30, grade: 5, totalQuestions: 10, correctAnswers: 5, recordedAt: '2026-01-01T00:00:00Z', extra: false, content: 'Frações', skill: 'Comparar', ...overrides })
test('pondera por respostas, sem tratar cada avaliação como mesmo denominador', () => {
  const summary = summarizeResults([result({ totalQuestions: 2, correctAnswers: 0 }), result({ totalQuestions: 8, correctAnswers: 8 })])
  assert.equal(summary.errorRate, .2)
  assert.equal(summary.total, 10)
  assert.ok(summary.lower < .2 && summary.upper > .2)
  assert.equal(summarizeResults([]).errorRate, null)
})
test('compara apenas pares completos, sem usar a própria atividade extra como depois', () => {
  const entries = [result(), result({ extra: true, recordedAt: '2026-01-02T00:00:00Z' }), result({ correctAnswers: 9, recordedAt: '2026-01-03T00:00:00Z' }), result({ studentId: 2, correctAnswers: 0 })]
  const comparison = compareExtraResults(entries)
  assert.equal(comparison.matched, 1)
  assert.equal(comparison.before.errorRate, .5)
  assert.equal(comparison.after.errorRate, .1)
  assert.equal(compareExtraResults(entries.slice(0, 2)).matched, 0)
})
test('persistência exige três registros recentes abaixo do limiar', () => {
  assert.equal(hasPersistentDifficulty([result(), result()]), false)
  assert.equal(hasPersistentDifficulty([result(), result(), result()]), true)
  assert.equal(hasPersistentDifficulty([result(), result(), result({ correctAnswers: 6 })]), false)
})

test('analisa todas as respostas e mantém agregados somente nas áreas', () => {
  const analysis = analyzeDifficulties([
    result({ questionId: 'q1', totalQuestions: 1, correctAnswers: 0 }),
    result({ questionId: 'q1', totalQuestions: 1, correctAnswers: 1 }),
    result({ questionId: 'q2', totalQuestions: 1, correctAnswers: 0, content: 'Geometria' }),
    result({ totalQuestions: 8, correctAnswers: 4 }),
  ])
  assert.equal(analysis.detailed, 3)
  assert.equal(analysis.aggregate, 1)
  assert.equal(analysis.questions.find(q => q.questionId === 'q1').total, 2)
  assert.equal(analysis.areas.find(a => a.content === 'Frações').total, 10)
  assert.equal(analysis.areas.find(a => a.content === 'Frações').errors, 5)
  assert.match(analysis.areas.find(a => a.content === 'Frações').recommendation, /pré-requisitos/)
  assert.equal(analyzeDifficulties([]).areas.length, 0)
})

test('separa areas com nomes iguais entre disciplinas', () => {
  const analysis = analyzeDifficulties([result(), result({courseId:'science', correctAnswers:0})])
  assert.equal(analysis.areas.length, 2)
  assert.equal(analysis.areas.find(a => a.courseId === 'math').errorRate, .5)
  assert.equal(analysis.areas.find(a => a.courseId === 'science').errorRate, 1)
})
