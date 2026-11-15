export type Role = 'admin' | 'director' | 'teacher' | 'staff' | 'parent' | 'student'

export interface School {
  id: string
  name: string
  accent: string
  logo: string
}

export interface Member {
  id: string
  schoolId: string
  name: string
  email: string
  role: Role
  courseIds: string[]
  classIds: string[]
}

export const roleLabels: Record<Role, string> = {
  admin: 'Administração',
  director: 'Direção',
  teacher: 'Professor(a)',
  staff: 'Equipe escolar',
  parent: 'Responsável',
  student: 'Aluno(a)',
}

export interface Track {
  id: number
  nome: string
}

export interface Student {
  id: number
  nome: string
  matricula: string
  turma: string
  pontos: number
  trilha?: Track
}

export interface StudentInput {
  nome: string
  matricula: string
  turma: string
  trilhaId: number
}
