// ✅ 新增 - 认证工具模块（假登录，localStorage token）

const TOKEN_KEY = 'offerflow_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function login(username: string, password: string): string | null {
  if (username === 'admin' && password === '123456') {
    const token = `offerflow_${Date.now()}`
    setToken(token)
    return token
  }
  return null
}
