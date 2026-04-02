// ✅ 新增 - 认证工具模块（假登录，localStorage token）

const TOKEN_KEY = 'offerflow_token'

/** 读取 token（SSR 安全） */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/** 写入 token */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** 清除 token（登出） */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** 是否已登录 */
export function isAuthenticated(): boolean {
  return !!getToken()
}

/**
 * 假登录校验
 * admin / 123456 → 写入 token 并返回 token 字符串
 * 其他 → 返回 null
 */
export function login(username: string, password: string): string | null {
  if (username === 'admin' && password === '123456') {
    const token = `offerflow_${Date.now()}`
    setToken(token)
    return token
  }
  return null
}
