import assert from 'node:assert/strict'

// Execute somente em uma escola de demonstração: o teste publica uma nova atividade.
const base = (process.env.ENIGMA_TEST_API_BASE || 'http://localhost:8080').replace(/\/$/, '')
const password = process.env.ENIGMA_DEMO_PASSWORD
assert.ok(password, 'Defina ENIGMA_DEMO_PASSWORD com a senha da escola demonstrativa.')
async function request(path, token, method = 'GET', body, status = 200) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  })
  const text = await response.text()
  assert.equal(response.status, status, `${method} ${path}: ${response.status} ${text}`)
  return text ? JSON.parse(text) : null
}
const login = async email => (await request('/auth/login', null, 'POST', { email, password })).accessToken
await request('/auth/me', null, 'GET', undefined, 401)
const teacher = await login('professor@demo.enigma')
const student = await login('aluno@demo.enigma')
const before = await request('/learning', teacher)
const groups = await request('/student/groups', student)
const own = groups.find(group => group.own && group.courseId === 'matematica')
assert.ok(own, 'Aluno precisa de um grupo de matemática.')
await request(`/student/groups/${own.id}`, student, 'PATCH', { name: 'Exploradores do MVP' })
assert.equal((await request('/student/groups', student)).find(group => group.id === own.id).name, 'Exploradores do MVP')
await request(`/student/groups/${own.id}`, student, 'PATCH', { name: own.name })
await request('/teaching/contents', student, 'POST', {}, 403)
const content = await request('/teaching/contents', teacher, 'POST', { courseId: 'matematica', classId: 'matematica-3-a', title: 'Revisão de frações · QA', body: 'Metade equivale a 1/2.' }, 201)
await request(`/teaching/contents/${content.id}`, teacher, 'PATCH', { title: 'Revisão atualizada · QA' })
const courses = await request('/student/courses', student)
assert.ok(courses.find(course => course.id === 'matematica').contents.some(item => item.id === content.id && item.title === 'Revisão atualizada · QA'))
await request(`/teaching/contents/${content.id}`, teacher, 'DELETE', undefined, 204)
assert.ok(!(await request('/student/courses', student)).find(course => course.id === 'matematica').contents.some(item => item.id === content.id))
const published = await request('/teaching/activities', teacher, 'POST', { title: 'Simulado integrado · QA', type: 'simulation', courseId: 'matematica', classId: 'matematica-3-a', questionIds: ['demo-fraction', 'demo-percent'] }, 201)
const assignments = await request('/student/activities', student)
const assignment = assignments.find(item => published.some(created => created.id === item.id))
assert.ok(assignment, 'Simulado publicado precisa chegar ao aluno.')
for (const [index, id] of assignment.questionIds.entries()) {
  const question = await request(`/student/activities/${assignment.id}/questions/${id}/start`, student, 'POST', {})
  assert.equal(question.correctOptionId, undefined, 'Gabarito não pode ser exposto antes de responder.')
  const answer = await request(`/student/activities/${assignment.id}/questions/${id}/answer`, student, 'POST', { optionId: index === 0 ? 'a' : 'b' })
  assert.equal(answer.correct, index === 0)
}
const after = await request('/learning', teacher)
assert.equal(after.results.length, before.results.length + 2)
const results = after.results.filter(result => result.assignmentId === assignment.id)
assert.equal(results.length, 2)
assert.equal(results.reduce((sum, result) => sum + result.correctAnswers, 0), 1)
assert.ok(results.every(result => result.content && result.skill && result.questionId))
const ranking = await request('/student/ranking', student)
const group = ranking.rounds.flatMap(round => round.groups).find(item => item.id === own.id)
const grades = own.studentIds.map(id => {
  const entries = after.results.filter(result => result.studentId === id && result.courseId === 'matematica' && result.classId === 'matematica-3-a')
  const total = entries.reduce((sum, result) => sum + result.totalQuestions, 0)
  return total ? 10 * entries.reduce((sum, result) => sum + result.correctAnswers, 0) / total : 0
})
assert.ok(Math.abs(group.average - grades.reduce((sum, grade) => sum + grade, 0) / grades.length) < 1e-8)
assert.ok((await request('/student/activities', student)).find(item => item.id === assignment.id).completedAt)
console.log(JSON.stringify({ verified: ['autenticação', 'autorização', 'CRUD de conteúdos', 'publicação de simulado', 'respostas e conclusão', 'evidências pedagógicas', 'nomeação de grupo', 'média do ranking'], answers: results.length, groupAverage: group.average }))
