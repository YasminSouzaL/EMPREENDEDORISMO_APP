import type { Role } from '@/types/portal'

export function getPortalPermissions(role: Role | 'visitor') {
  const leadership = role === 'admin' || role === 'director'
  return {
    manageSchool: leadership,
    viewMembers: leadership,
    manageMembers: role === 'admin',
    viewAcademics: leadership || role === 'teacher' || role === 'visitor',
    editAgenda: leadership,
    manageLearning: leadership || role === 'teacher',
    viewFamily: role === 'parent' || role === 'student',
  }
}
