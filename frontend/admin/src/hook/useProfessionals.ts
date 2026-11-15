import { useEffect, useState } from 'react'
import { getProfessionals, saveProfessional } from '@api'
import type { MemberInput } from '@api'
import type { Member } from '@/types/portal'

export function useProfessionals(token: string) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function load() {
      setLoading(true)
      setError(false)
      try {
        const list = await getProfessionals(token, signal)
        if (!signal.aborted) setMembers(list)
      } catch {
        if (!signal.aborted) setError(true)
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [token, attempt])

  async function save(input: MemberInput, id?: string) {
    const member = await saveProfessional(token, input, id)
    setMembers((current) => current.some((item) => item.id === member.id)
      ? current.map((item) => item.id === member.id ? member : item)
      : [...current, member])
  }

  return { members, loading, error, save, retry: () => setAttempt((current) => current + 1) }
}
