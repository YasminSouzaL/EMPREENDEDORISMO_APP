import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, authenticate, getProfile, registerSchool } from '@api'
import type { Profile } from '@api'
import type { School } from '@/types/portal'
import { getAccessToken, getVisitorMode, loadSchoolIdentity, saveAccessToken, saveSchoolIdentity, saveVisitorMode } from './session'

function usePortalState() {
  const [token, setToken] = useState(getAccessToken)
  const [visitorMode, setVisitorMode] = useState(getVisitorMode)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessionError, setSessionError] = useState(false)
  const [signedOut, setSignedOut] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const member = profile?.member
  const school = profile?.school

  function changeSession(next: string, visitor = false) {
    saveAccessToken(next)
    saveVisitorMode(visitor)
    setProfile(null)
    setSessionError(false)
    setToken(next)
    setVisitorMode(visitor)
  }

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    const { signal } = controller

    async function restoreSession() {
      try {
        const current = await getProfile(token, signal)
        if (!signal.aborted) setProfile({ ...current, school: loadSchoolIdentity(current.school) })
      } catch (reason) {
        if (signal.aborted) return
        if (reason instanceof ApiError && (reason.status === 401 || reason.status === 403)) changeSession('')
        else setSessionError(true)
      }
    }

    void restoreSession()
    return () => controller.abort()
  }, [token, attempt])

  async function signIn(email: string, password: string) {
    const accessToken = await authenticate(email, password)
    setSignedOut(false)
    changeSession(accessToken)
    setAttempt((current) => current + 1)
  }

  function updateSchool(settings: Omit<School, 'id'>) {
    if (!profile || (profile.member.role !== 'admin' && profile.member.role !== 'director')) {
      throw new Error('Seu perfil não pode alterar a identidade da escola.')
    }
    const updated = { ...settings, id: profile.school.id }
    saveSchoolIdentity(updated)
    setProfile({ ...profile, school: updated })
  }

  return {
    member, school, token, visitor: !token && visitorMode, sessionError, signedOut,
    loadingSession: Boolean(token && !profile && !sessionError),
    signIn, registerSchool, updateSchool,
    enterAsVisitor: () => changeSession('', true),
    retrySession: () => { setSessionError(false); setAttempt((current) => current + 1) },
    signOut: () => { setSignedOut(true); changeSession('') },
  }
}

const PortalContext = createContext<ReturnType<typeof usePortalState> | null>(null)

export function PortalProvider({ children }: { children: ReactNode }) {
  const portal = usePortalState()
  return <PortalContext.Provider value={portal}>{children}</PortalContext.Provider>
}

export function usePortal() {
  const portal = useContext(PortalContext)
  if (!portal) throw new Error('O PortalProvider precisa envolver a aplicação.')
  return portal
}
