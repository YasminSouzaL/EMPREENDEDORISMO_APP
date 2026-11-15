import { useEffect, useState } from 'react'
import { getLearning, saveLearning } from '@api/learning'
import type { LearningData } from '@/types/learning'

export function useLearning(token: string) {
  const [data, setData] = useState<LearningData>({ revision: 0, questions: [], results: [], observations: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    void getLearning(token, controller.signal).then((value) => {
      if (!controller.signal.aborted) setData(value)
    }).catch(() => {
      if (!controller.signal.aborted) setError('Não foi possível carregar os registros de aprendizagem. Tente novamente.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, version])
  async function save(next: LearningData) {
    setSaving(true)
    try { setData(await saveLearning(token, next)) }
    finally { setSaving(false) }
  }
  return { data, loading, saving, error, save, reload: () => setVersion((current) => current + 1) }
}
