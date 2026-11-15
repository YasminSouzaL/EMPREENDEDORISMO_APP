import { request } from './client'
import type { LearningQuestion } from '@/types/learning'
export type PublicQuestion = LearningQuestion & { level: string; images?: string[]; source: { url: string; provider: string; year: number } }
export async function getPublicQuestions(token: string, courseId: string, signal?: AbortSignal): Promise<PublicQuestion[]> { return (await request('/question-bank?courseId=' + encodeURIComponent(courseId), { signal }, token)).json() }
export async function importPublicQuestions(token: string, questionIds: string[]) { await request('/learning/import-public', { method: 'POST', body: JSON.stringify({ questionIds }) }, token) }
