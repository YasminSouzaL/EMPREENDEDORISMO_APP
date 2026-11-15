import { useEffect, useState } from 'react'
import { getFamilyProfile, getGuardians, saveGuardian } from '@api/families'
import type { FamilyProfile, Guardian } from '@api/families'

export function useFamilies(token: string, ownProfile = false) {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [profile, setProfile] = useState<FamilyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setGuardians([])
    setProfile(null)
    setError('')
    setLoading(true)
    async function load() {
      try {
        if (!token) throw new Error('Entre com sua conta para consultar os vínculos.')
        if (ownProfile) {
          const result = await getFamilyProfile(token, controller.signal)
          if (!controller.signal.aborted) setProfile(result)
        } else {
          const result = await getGuardians(token, controller.signal)
          if (!controller.signal.aborted) setGuardians(result)
        }
      } catch {
        if (!controller.signal.aborted) setError('O serviço de vínculos está indisponível. Tente novamente.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [token, ownProfile, version])

  async function save(input: Omit<Guardian, 'id'>, id?: string) {
    const saved = await saveGuardian(token, input, id)
    setGuardians((current) => [...current.filter((item) => item.id !== saved.id), saved])
  }
  return { guardians, profile, loading, error, save, reload: () => setVersion((value) => value + 1) }
}
