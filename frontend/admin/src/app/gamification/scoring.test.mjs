import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rankAcademicGroups } from './scoring.ts'
const group = (overrides = {}) => ({id:'g', name:'Equipe', courseId:'math', classId:'a', studentIds:[1,2], ...overrides})
const result = (overrides = {}) => ({studentId:1, courseId:'math', classId:'a', totalQuestions:1, correctAnswers:1, ...overrides})
test('nota por respostas ponderadas e média inclui ausentes', () => {
  const [rank] = rankAcademicGroups([group()], [result(), result({totalQuestions:9, correctAnswers:0})])
  assert.equal(rank.studentGrades[0].grade, 1)
  assert.equal(rank.studentGrades[1].grade, 0)
  assert.equal(rank.average, .5)
})
test('isola disciplina e turma e ordena pela média acadêmica', () => {
  const ranks = rankAcademicGroups([group(),group({id:'b',name:'Outra',studentIds:[3]})], [result({studentId:3}),result({courseId:'history'}),result({classId:'b'})])
  assert.equal(ranks[0].id, 'b')
  assert.equal(ranks[0].average, 10)
  assert.equal(ranks[1].average, 0)
  assert.equal(rankAcademicGroups([group({studentIds:[]})],[])[0].average,0)
})
