import type { Answer, Assignment, Attempt, Course, Profile, Question, Ranking, StudentGroup } from '@/types/student'
const base = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
async function request<T>(path: string, token = '', body?: unknown, signal?: AbortSignal, method?: string): Promise<T> {
  const response = await fetch(base + path, { method: method ?? (body === undefined ? 'GET' : 'POST'), signal, headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.message || (response.status === 401 ? 'Entre novamente para continuar.' : 'Não foi possível concluir. Tente novamente.')) }
  return response.status === 204 || response.headers.get('content-length') === '0' ? undefined as T : response.json()
}
export const login = (email: string, password: string) => request<{ accessToken: string }>('/auth/login', '', { email, password })
export const profile = (token: string, signal?: AbortSignal) => request<Profile>('/auth/me', token, undefined, signal)
export const logout = (token: string) => request<void>('/auth/logout', token, {})
export const register = (body: { name: string; email: string; password: string; invitationCode: string }) => request<void>('/auth/register-family', '', { ...body, role: 'student' })
export const assignments = (token: string, signal?: AbortSignal) => request<Assignment[]>('/student/activities', token, undefined, signal)
export const courses = (token: string, signal?: AbortSignal) => request<Course[]>('/student/courses', token, undefined, signal)
export const groups = (token: string, signal?: AbortSignal) => request<StudentGroup[]>('/student/groups', token, undefined, signal)
export const renameGroup = (token: string, id: string, name: string) => request<StudentGroup>(`/student/groups/${encodeURIComponent(id)}`, token, { name }, undefined, 'PATCH')
export const ranking = (token: string, signal?: AbortSignal) => request<Ranking>('/student/ranking', token, undefined, signal)
export const attempts = (token: string, id: string) => request<Attempt[]>(`/student/activities/${encodeURIComponent(id)}/attempts`, token)
export const startQuestion = (token: string, id: string, questionId: string) => request<Question>(`/student/activities/${encodeURIComponent(id)}/questions/${encodeURIComponent(questionId)}/start`, token, {})
export const answerQuestion = (token: string, id: string, questionId: string, optionId: string) => request<Answer>(`/student/activities/${encodeURIComponent(id)}/questions/${encodeURIComponent(questionId)}/answer`, token, { optionId })
