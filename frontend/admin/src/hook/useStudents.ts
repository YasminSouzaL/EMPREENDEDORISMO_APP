import { useEffect, useState } from 'react'
import { createStudent, getStudents, getTracks } from '@api'
import type { Student, StudentInput, Track } from '@/types/portal'

export function useStudents(token: string) {
  const [students, setStudents] = useState<Student[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [studentError, setStudentError] = useState(false)
  const [trackError, setTrackError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function load() {
      setLoading(true)
      const [studentResult, trackResult] = await Promise.allSettled([getStudents(token, signal), getTracks(token, signal)])
      if (signal.aborted) return
      if (studentResult.status === 'fulfilled') setStudents(studentResult.value)
      if (trackResult.status === 'fulfilled') setTracks(trackResult.value)
      setStudentError(studentResult.status === 'rejected')
      setTrackError(trackResult.status === 'rejected')
      setLoading(false)
    }

    void load()
    return () => controller.abort()
  }, [token, requestVersion])

  async function register(input: StudentInput) {
    const student = await createStudent(token, input)
    setStudents((current) => [...current.filter(({ id }) => id !== student.id), student])
  }

  return {
    students, tracks, studentError, trackError, loading, register,
    reload: () => setRequestVersion((version) => version + 1),
  }
}
