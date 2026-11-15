import { useEffect, useRef, useState } from 'react'
import { getGamification, saveGamification } from '@api/gamification'
import { ApiError } from '@api/client'
import type { GamificationData } from '@/types/gamification'

export function useGamification(token: string) {
  const [data, setData] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const locked = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setData(null)
    setError('')
    if (!token) { setLoading(false); return () => controller.abort() }
    void getGamification(token, controller.signal).then((value) => { if (!controller.signal.aborted) setData(value) }).catch(() => {
      if (!controller.signal.aborted) setError('Não foi possível carregar a gamificação. Verifique a conexão e a disponibilidade da API.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, version])
  async function save(next: GamificationData) {
    if (locked.current || !data) return false
    locked.current = true
    setSaving(true)
    setError('')
    try { const saved = await saveGamification(token, next); setData(saved); return true }
    catch (reason) { setError(reason instanceof ApiError && reason.status === 409 ? 'Outra pessoa alterou estes dados. Atualize a página e revise suas alterações antes de salvar novamente.' : 'Não foi possível salvar. Os dados anteriores foram preservados.'); return false }
    finally { locked.current = false; setSaving(false) }
  }
  return { data, loading, saving, error, save, reload: () => setVersion((current) => current + 1) }
}
