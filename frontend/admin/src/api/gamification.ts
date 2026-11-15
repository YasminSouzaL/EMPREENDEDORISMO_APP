import { request } from './client'
import type { ExtraAssignment, GamificationData } from '@/types/gamification'

export async function getGamification(token: string, signal?: AbortSignal): Promise<GamificationData> {
  const response = await request('/gamification', { signal }, token)
  const value = await response.json() as GamificationData
  if (!['groups', 'policies', 'rewards', 'awards', 'rounds'].every((key) => Array.isArray(value[key as keyof GamificationData]))) throw new Error('Contrato de gamificação inválido.')
  return value
}
export async function saveGamification(token: string, value: GamificationData): Promise<GamificationData> {
  const response = await request('/gamification', { method: 'PUT', body: JSON.stringify(value) }, token)
  return response.json() as Promise<GamificationData>
}
export async function getExtraAssignments(token: string, signal?: AbortSignal): Promise<ExtraAssignment[]> { return (await request('/gamification/extras', { signal }, token)).json() }
export async function generateExtraAssignment(token: string, policyId: string, studentId: number): Promise<ExtraAssignment> { return (await request('/gamification/extras', { method: 'POST', body: JSON.stringify({ policyId, studentId }) }, token)).json() }
export async function approveExtraAssignment(token: string, id: string): Promise<ExtraAssignment> { return (await request(`/gamification/extras/${encodeURIComponent(id)}/approve`, { method: 'POST' }, token)).json() }
