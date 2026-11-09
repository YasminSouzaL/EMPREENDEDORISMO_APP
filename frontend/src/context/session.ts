import type { School } from '@/types/portal'

const tokenKey = 'enigma:access-token:v1'
const visitorKey = 'enigma:visitor:v1'

export function getVisitorMode() {
  return sessionStorage.getItem(visitorKey) === '1'
}

export function saveVisitorMode(enabled: boolean) {
  if (enabled) sessionStorage.setItem(visitorKey, '1')
  else sessionStorage.removeItem(visitorKey)
}

export function getAccessToken() {
  return sessionStorage.getItem(tokenKey) ?? ''
}

export function saveAccessToken(token: string) {
  if (token) sessionStorage.setItem(tokenKey, token)
  else sessionStorage.removeItem(tokenKey)
}

function identityKey(schoolId: string) {
  return 'enigma:school-identity:v1:' + encodeURIComponent(schoolId)
}

export function loadSchoolIdentity(school: School): School {
  try {
    const saved = localStorage.getItem(identityKey(school.id))
    if (saved) {
      const { name, accent, logo } = JSON.parse(saved)
      if (typeof name === 'string' && typeof accent === 'string' && typeof logo === 'string') {
        return { id: school.id, name, accent, logo }
      }
    }
  } catch {
    // Usa a identidade do servidor.
  }
  return school
}

export function saveSchoolIdentity(school: School) {
  localStorage.setItem(identityKey(school.id), JSON.stringify(school))
}
