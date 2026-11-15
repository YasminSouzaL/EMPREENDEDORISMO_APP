import { request } from './client'

export interface Guardian {
  id: string
  name: string
  email: string
  phone: string
  relationship: string
  studentIds: number[]
}

export interface FamilyProfile {
  students: { id: number; name: string; classroom: string }[]
  guardians: Guardian[]
}

export async function getGuardians(token: string, signal?: AbortSignal): Promise<Guardian[]> {
  return (await request('/responsaveis', { signal }, token)).json()
}

export async function saveGuardian(token: string, input: Omit<Guardian, 'id'>, id?: string): Promise<Guardian> {
  return (await request('/responsaveis' + (id ? '/' + encodeURIComponent(id) : ''), {
    method: id ? 'PATCH' : 'POST', body: JSON.stringify(input),
  }, token)).json()
}

export async function getFamilyProfile(token: string, signal?: AbortSignal): Promise<FamilyProfile> {
  return (await request('/familia/me', { signal }, token)).json()
}

export async function registerFamilyAccount(input: { name: string; email: string; password: string; invitationCode: string; role: 'parent' | 'student' }) {
  await request('/auth/register-family', { method: 'POST', body: JSON.stringify(input) })
}
export async function createInvitation(token: string, input: { role: 'parent' | 'student'; email: string; studentIds: number[] }): Promise<{ code: string }> {
  return (await request('/convites', { method: 'POST', body: JSON.stringify(input) }, token)).json()
}
