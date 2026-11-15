import type { Member } from '@/types/portal'
import { request } from './client'

export type MemberInput = Pick<Member, 'name' | 'email' | 'role' | 'courseIds' | 'classIds'> & { password?: string }

export async function getProfessionals(token: string, signal: AbortSignal): Promise<Member[]> {
  const response = await request('/integrantes', { signal }, token)
  return response.json()
}

export async function saveProfessional(token: string, input: MemberInput, id?: string): Promise<Member> {
  const response = await request(id ? '/integrantes/' + encodeURIComponent(id) : '/integrantes', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(input),
  }, token)
  return response.json()
}
