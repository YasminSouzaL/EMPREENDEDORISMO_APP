import type { Student, StudentInput, Track } from '@/types/portal'
import { request } from './client'

export async function getStudents(token: string, signal?: AbortSignal): Promise<Student[]> {
  const response = await request('/alunos', { signal }, token)
  return response.json()
}

export async function getTracks(token: string, signal?: AbortSignal): Promise<Track[]> {
  const response = await request('/trilhas', { signal }, token)
  return response.json()
}

export async function createStudent(token: string, input: StudentInput): Promise<Student> {
  const response = await request('/alunos', { method: 'POST', body: JSON.stringify(input) }, token)
  return response.json()
}
