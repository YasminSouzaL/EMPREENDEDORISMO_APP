import { roleLabels } from '@/types/portal'
import type { Member, School } from '@/types/portal'
import { ApiError, request } from './client'

export interface Profile {
  member: Member
  school: School
}

export async function authenticate(email: string, password: string) {
  try {
    const response = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    const { accessToken } = await response.json()
    if (typeof accessToken === 'string' && accessToken.trim()) return accessToken
  } catch (reason) {
    if (reason instanceof ApiError && (reason.status === 401 || reason.status === 403)) {
      throw new Error('E-mail ou senha inválidos.')
    }
  }
  throw new Error('O serviço de acesso está indisponível. Tente novamente mais tarde.')
}

export async function getProfile(token: string, signal: AbortSignal): Promise<Profile> {
  const response = await request('/auth/me', { signal }, token)
  const { member, school } = await response.json() as Partial<Profile>
  if (!member || !school || !Object.hasOwn(roleLabels, member.role)
    || typeof member.id !== 'string' || member.schoolId !== school.id
    || typeof school.id !== 'string' || typeof member.name !== 'string' || typeof member.email !== 'string'
    || typeof school.name !== 'string' || typeof school.accent !== 'string' || typeof school.logo !== 'string'
    || !Array.isArray(member.courseIds) || !Array.isArray(member.classIds)) {
    throw new Error('O serviço de acesso retornou um perfil inválido.')
  }
  return { member, school }
}

export async function registerSchool(schoolName: string, name: string, email: string, password: string) {
  try {
    await request('/escolas', { method: 'POST', body: JSON.stringify({ schoolName, name, email, password }) })
  } catch (reason) {
    if (reason instanceof ApiError && reason.status === 409) throw new Error('Este e-mail já está cadastrado.')
    throw new Error('Não foi possível cadastrar a escola. Tente novamente mais tarde.')
  }
}
