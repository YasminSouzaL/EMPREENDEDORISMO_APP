const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(readonly status: number) {
    super('A API respondeu com erro (' + status + ').')
  }
}

export async function request(path: string, options: RequestInit = {}, token?: string) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', 'Bearer ' + token)

  const response = await fetch(baseUrl + path, { ...options, headers })
  if (!response.ok) throw new ApiError(response.status)
  return response
}
