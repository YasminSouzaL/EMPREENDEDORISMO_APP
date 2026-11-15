import { courses, getAccessibleClasses } from '@app/academic'
import type { AcademicAccess } from '@app/academic'
import type { Member } from '@/types/portal'

export function getAcademicAccess(member: Member): AcademicAccess {
  if (member.role === 'admin' || member.role === 'director') return { allowedCourseIds: null }
  return { allowedCourseIds: member.courseIds, allowedClassIds: member.classIds }
}

export const classLabels = [...new Set(courses.flatMap(({ classes }) => classes.map(({ label }) => label)))]

export function accessibleClassCount(access: AcademicAccess) {
  return new Set(courses.flatMap((course) => getAccessibleClasses(course, access).map(({ label }) => label))).size
}

export function normalizeClassLabel(label: string) {
  return label.replace(/([0-9])[ºª°]/g, '$1').normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase()
}
