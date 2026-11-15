import type { GameRound, RoundResult } from '@/types/gamification'
import type { LearningResult } from '@/types/learning'

// A nota de cada aluno usa todas as respostas; integrantes sem respostas valem zero.
export function rankAcademicGroups<T extends { name: string; courseId: string; classId: string; studentIds: number[] }>(groups: T[], results: LearningResult[]) {
  return groups.map((group) => {
    const studentGrades = group.studentIds.map((studentId) => {
      const entries = results.filter((result) => result.studentId === studentId && result.courseId === group.courseId && result.classId === group.classId)
      const total = entries.reduce((sum, result) => sum + result.totalQuestions, 0)
      const correct = entries.reduce((sum, result) => sum + result.correctAnswers, 0)
      return { studentId, grade: total ? 10 * correct / total : 0, total }
    })
    return { ...group, studentGrades, average: studentGrades.length ? studentGrades.reduce((sum, student) => sum + student.grade, 0) / studentGrades.length : 0 }
  }).sort((a, b) => b.average - a.average || a.name.localeCompare(b.name))
}

export function validateScoreBounds(round: Pick<GameRound, 'minSeconds' | 'maxSeconds' | 'minPoints' | 'maxPoints'>) {
  return [round.minSeconds, round.maxSeconds, round.minPoints, round.maxPoints].every(Number.isFinite)
    && round.minSeconds >= 0 && round.maxSeconds > round.minSeconds && round.minPoints >= 0 && round.maxPoints >= round.minPoints
}
export function scoreResult(round: GameRound, result?: RoundResult) {
  if (!validateScoreBounds(round) || !result?.correct || !Number.isFinite(result.elapsedSeconds) || result.elapsedSeconds < 0) return 0
  const elapsed = Math.max(round.minSeconds, Math.min(round.maxSeconds, result.elapsedSeconds))
  return round.maxPoints - (elapsed - round.minSeconds) / (round.maxSeconds - round.minSeconds) * (round.maxPoints - round.minPoints)
}
export function rankGroups(round: GameRound) {
  return round.groups.map((group) => ({ ...group, average: group.studentIds.length ? group.studentIds.reduce((total, id) => total + scoreResult(round, round.results.find((result) => result.studentId === id)), 0) / group.studentIds.length : 0 })).sort((a, b) => b.average - a.average || a.name.localeCompare(b.name))
}
