import { useEffect, useState } from 'react'
import * as api from '@api'
import type { Assignment, Course, Profile, Ranking, StudentGroup } from '@/types/student'
export function useStudentPortal() {
  const [token, setToken] = useState(() => { try { return sessionStorage.getItem('enigma:student:token') ?? '' } catch { return '' } })
  const [profile, setProfile] = useState<Profile | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [ranking, setRanking] = useState<Ranking>({ rounds: [], rewards: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!!token)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    setLoading(true); setError('')
    void (async () => {
      try {
        const profile = await api.profile(token, controller.signal)
        if (profile.member.role !== 'student') throw new Error('Este site é exclusivo dos estudantes. Use o Portal Enigma para a administração e responsáveis.')
        const [activities, ranks, disciplines, teams] = await Promise.all([api.assignments(token, controller.signal), api.ranking(token, controller.signal), api.courses(token, controller.signal), api.groups(token, controller.signal)])
        if (!controller.signal.aborted) { setProfile(profile); setAssignments(activities); setRanking(ranks); setCourses(disciplines); setGroups(teams) }
      } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar seu espaço.') }
      finally { if (!controller.signal.aborted) setLoading(false) }
    })()
    return () => controller.abort()
  }, [token, version])
  async function signIn(email: string, password: string) {
    const { accessToken } = await api.login(email, password)
    try { sessionStorage.setItem('enigma:student:token', accessToken) } catch { /* A sessão permanece ativa nesta página. */ }
    setToken(accessToken); setVersion((value) => value + 1)
  }
  async function signOut() {
    try { await api.logout(token) } catch { /* Encerra também a sessão local. */ }
    try { sessionStorage.removeItem('enigma:student:token') } catch { /* A sessão em memória também é encerrada. */ }
    setToken(''); setProfile(null); setAssignments([]); setCourses([]); setGroups([]); setRanking({ rounds: [], rewards: [] }); setError('')
  }
  return { token, profile, assignments, courses, groups, ranking, loading, error, signIn, signOut, reload: () => setVersion((value) => value + 1) }
}
