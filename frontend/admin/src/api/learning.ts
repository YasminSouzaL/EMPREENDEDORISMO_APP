import { ApiError, request } from '@api/client'
import type { LearningData } from '@/types/learning'

export async function getLearning(token: string, signal?: AbortSignal): Promise<LearningData> {
  const response = await request('/learning', { signal }, token)
  const data = await response.json() as LearningData
  if (!Array.isArray(data.questions) || !Array.isArray(data.results) || !Array.isArray(data.observations)) throw new Error('Resposta de aprendizagem inválida.')
  return data
}
export async function saveLearning(token: string, data: LearningData): Promise<LearningData> {
  try {
    const response = await request('/learning', { method: 'PUT', body: JSON.stringify({ ...data, revision: data.revision ?? 0 }) }, token)
    return response.json() as Promise<LearningData>
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) throw new Error('Outra pessoa atualizou os registros. Recarregue a página e confira os dados antes de salvar novamente.')
    throw new Error('Não foi possível salvar os registros na escola. Verifique sua conexão e tente novamente.')
  }
}
