export interface StudentGroup { id: string; name: string; courseId: string; classId: string; classLabel: string; capacity: number; studentIds: number[] }
export interface ExtraPolicy { id: string; courseId: string; classId: string; periodDays: number; deadlineDays: number; questionCount: number; bonusPoints: number; approvalMode: 'teacher' | 'automatic' }
export interface Reward { id: string; name: string; icon: 'star' | 'rocket' | 'gem' | 'medal'; minimumScore: number }
export interface RewardAward { id: string; rewardId: string; studentId: number; roundId: string }
export interface RoundResult { studentId: number; correct: boolean; elapsedSeconds: number }
export interface GameRound {
  id: string; title: string; courseId: string; classId: string; minSeconds: number; maxSeconds: number; minPoints: number; maxPoints: number
  groups: { groupId: string; name: string; studentIds: number[] }[]
  results: RoundResult[]
}
export interface GamificationData { revision: number; groups: StudentGroup[]; policies: ExtraPolicy[]; rewards: Reward[]; awards: RewardAward[]; rounds: GameRound[] }
export interface ExtraAssignment { id: string; studentId: number; policyId: string; courseId: string; classId: string; questionIds: string[]; status: 'pending_approval' | 'published'; dueAt: string; completedAt?: string }
