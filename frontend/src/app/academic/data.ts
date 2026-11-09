export interface ClassroomDefinition {
  id: string
  grade: string
  section: string
  label: string
  schedule: string
}

export interface Course {
  id: string
  name: string
  summary: string
  classes: ClassroomDefinition[]
}

export interface AcademicAccess {
  allowedCourseIds: string[] | null
  allowedClassIds?: string[] | null
}

// Preserva os índices dos vínculos existentes.
const gradeByIndex = ['6º ano', '7º ano', '8º ano', '9º ano', '1ª série', '2ª série', '3ª série', '1º ano', '2º ano', '3º ano', '4º ano', '5º ano']

const fundamentals = [7, 8, 9, 10, 11, 0, 1, 2, 3]
const secondary = [4, 5, 6]
const allGrades = [...fundamentals, ...secondary]
export const grades = allGrades.map((index) => gradeByIndex[index])

function course(id: string, name: string, summary: string, gradeIndexes: number[], schedule: string[]): Course {
  return {
    id,
    name,
    summary,
    classes: gradeIndexes.flatMap((gradeIndex) =>
      ['A', 'B'].map((section, index) => ({
        id: `${id}-${gradeIndex + 1}-${section.toLowerCase()}`,
        grade: gradeByIndex[gradeIndex],
        section,
        label: `${gradeByIndex[gradeIndex]} ${section}`,
        schedule: schedule[index],
      })),
    ),
  }
}

export const courses: Course[] = [
  course('matematica', 'Matemática', 'Números, grandezas, geometria e resolução de problemas.', allGrades, ['Segunda e quarta, 07h30', 'Terça e quinta, 09h20']),
  course('portugues', 'Língua Portuguesa', 'Leitura, produção textual e análise linguística.', allGrades, ['Segunda e quinta, 08h20', 'Terça e sexta, 07h30']),
  course('ciencias', 'Ciências', 'Vida, matéria, energia e o planeta Terra.', fundamentals, ['Terça e sexta, 08h20', 'Segunda e quarta, 09h20']),
  course('historia', 'História', 'Sociedades, culturas e transformações ao longo do tempo.', allGrades, ['Quarta, 10h10', 'Quinta, 10h10']),
  course('geografia', 'Geografia', 'Territórios, paisagens e relações entre sociedade e natureza.', allGrades, ['Segunda, 10h10', 'Sexta, 10h10']),
  course('fisica', 'Física', 'Movimento, energia e fenômenos da natureza.', secondary, ['Terça, 10h10', 'Quarta, 09h20']),
  course('quimica', 'Química', 'Composição e transformações da matéria.', secondary, ['Quinta, 09h20', 'Sexta, 08h20']),
  course('biologia', 'Biologia', 'Organismos, ecossistemas e processos da vida.', secondary, ['Segunda, 09h20', 'Quarta, 08h20']),
]

export function getAccessibleClasses(course: Course, { allowedCourseIds, allowedClassIds }: AcademicAccess) {
  if (allowedCourseIds === null || allowedCourseIds.includes(course.id)) return course.classes
  return course.classes.filter((classroom) => allowedClassIds?.includes(classroom.id))
}

export function canAccessCourse(course: Course, access: AcademicAccess) {
  return getAccessibleClasses(course, access).length > 0
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored === null ? fallback : JSON.parse(stored) as T
  } catch {
    return fallback
  }
}

export function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}
