export interface Profile { member: { id: string; name: string; role: string }; school: { name: string; accent: string; logo: string } }
export interface Assignment { id: string; title?: string; type?: string; courseId: string; courseName?: string; classId: string; questionIds: string[]; dueAt: string; completedAt?: string; selectionBasis: string; bonusPoints: number }
export interface CourseContent { id: string; title: string; body: string; url?: string }
export interface Course { id: string; name: string; teacher?: string; description?: string; contents: CourseContent[] }
export interface StudentGroup { id: string; name: string; courseId?: string; classId?: string; own?: boolean; memberCount: number; average: number }
export interface Question { id: string; prompt: string; minSeconds: number; maxSeconds: number; startedAt: string; images?: string[]; source?: { url: string; provider: string; year: number }; options: { id: string; text: string; image?: string }[] }
export interface Attempt { questionId: string; correct: boolean; seconds: number; points: number; selectedOptionId: string }
export interface Answer { correct: boolean; correctOptionId: string; points: number; seconds: number }
export interface Ranking { rounds: { id: string; title: string; ownPoints: number; groups: { id?: string; name: string; average: number; own?: boolean; memberCount?: number }[] }[]; rewards: { id: string; name: string; icon: string }[] }
