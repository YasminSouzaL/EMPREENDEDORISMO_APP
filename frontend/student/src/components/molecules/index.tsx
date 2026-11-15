import { Button } from '@atoms'
import { ArrowRight, CheckCircle2, ClipboardList } from 'lucide-react'
import type { Assignment } from '@/types/student'
export { LearningIllustration } from './LearningIllustration'
const courseNames: Record<string, string> = { matematica: 'Matemática', portugues: 'Língua Portuguesa', ciencias: 'Ciências', historia: 'História', geografia: 'Geografia', fisica: 'Física', quimica: 'Química', biologia: 'Biologia' }
export function ActivityCard({ activity, onOpen }: { activity: Assignment; onOpen: () => void }) {
  const expired = new Date(activity.dueAt).getTime() < Date.now()
  const due = new Date(activity.dueAt)
  return <article className={`panel activity-card ${activity.completedAt ? 'completed' : ''}`}><div className="flex justify-between items-center gap-3"><span className="activity-icon">{activity.completedAt ? <CheckCircle2 size={22} /> : <ClipboardList size={22} />}</span><span className="activity-kind">{activity.type === 'simulation' || activity.type === 'simulado' || activity.type === 'quiz' ? 'Simulado' : 'Atividade'}</span></div><span className="eyebrow">{activity.courseName ?? courseNames[activity.courseId] ?? activity.courseId}</span><h3 className="text-lg font-bold">{activity.title || 'Desafio de aprendizagem'}</h3><p className="text-sm text-muted">{activity.questionIds.length} questões{Number.isFinite(due.getTime()) ? ` · Até ${due.toLocaleDateString('pt-BR')}` : ''}</p><p className="text-sm text-muted activity-description">{activity.selectionBasis || 'Uma nova oportunidade de colocar seus conhecimentos em prática.'}</p><p className="text-sm font-semibold">{activity.completedAt ? 'Missão concluída! ✨' : `✦ Bônus de conclusão: ${activity.bonusPoints ?? 0} pontos`}</p><Button disabled={expired && !activity.completedAt} onClick={onOpen}>{activity.completedAt ? 'Ver minha conquista' : expired ? 'Prazo encerrado' : 'Começar missão'}<ArrowRight size={16} /></Button></article>
}
