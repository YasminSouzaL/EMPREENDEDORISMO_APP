export interface LearningQuestion {
  id: string
  courseId: string
  content: string
  skill: string
  tags: string[]
  prerequisites: string[]
  prompt: string
  options: { id: string; text: string; distractor: string }[]
  correctOptionId: string
  minSeconds: number
  maxSeconds: number
  status: 'draft' | 'approved'
}
export interface LearningResult {
  id: string
  studentId: number
  courseId: string
  classId: string
  questionId?: string
  correct?: boolean
  seconds: number
  grade: number
  totalQuestions: number
  correctAnswers: number
  recordedAt: string
  extra: boolean
  content: string
  skill: string
}
export interface LearningObservation {
  id: string
  studentId?: number
  classId: string
  courseId: string
  type: 'observation' | 'incident'
  text: string
  recordedAt: string
}
export interface LearningData {
  revision?: number
  questions: LearningQuestion[]
  results: LearningResult[]
  observations: LearningObservation[]
}
