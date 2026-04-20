export const backendUrl = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '').replace(/\/$/, '')

export function hasBackend(): boolean {
  return backendUrl.length > 0
}

export function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!hasBackend()) {
    return Promise.reject(new Error('Backend not configured (set VITE_BACKEND_URL)'))
  }
  return fetch(`${backendUrl}${path}`, init)
}
