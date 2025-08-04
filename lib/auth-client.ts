// Clean implementation of client-side auth helpers (cookies + JWT)
// After verification, rename to auth-client.ts replacing the old, duplicated file.

export interface User {
  uid: string
  perfis: string
  nome: string
  email: string
  criado_em: string
  atualizado_em?: string
  url_foto?: string
}

/**************** Session helpers via secure cookies ****************/

// In-memory cache: undefined = not fetched, null = unauthenticated, User = authenticated
let cachedUser: User | null | undefined = undefined

async function fetchUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" })
    if (!res.ok) return null
    const { user } = (await res.json()) as { user: User }
    return user
  } catch {
    return null
  }
}

// Synchronous accessor – returns cache (or null) and triggers background fetch if needed
export function getCurrentClientUser(): User | null {
  if (cachedUser !== undefined) return cachedUser
  void ensureUserLoaded()
  return null
}

// Forces user load and returns value
export async function ensureUserLoaded(): Promise<User | null> {
  if (cachedUser === undefined) {
    cachedUser = await fetchUser()
  }
  return cachedUser
}

export async function getCurrentClientUserAsync(): Promise<User | null> {
  return ensureUserLoaded()
}

// Força refetch da API ignorando cache atual
export async function refreshUser(): Promise<User | null> {
  cachedUser = await fetchUser()
  // Avisar mudança
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-changed"))
  }
  return cachedUser
}

export function clearCachedUser() {
  cachedUser = null
  // Notificar listeners de que o usuário mudou
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-changed"))
  }
}

export async function clientSignOut(): Promise<void> {
  await fetch("/api/auth/signout", { method: "POST", credentials: "include" })
  clearCachedUser()
}

/**************** HTTP helper ****************/
async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as T & { message?: string }
  if (!res.ok) throw new Error(data.message || "Erro inesperado")
  return data as T
}

/**************** API wrappers ****************/
export async function clientSignIn(email: string, password: string): Promise<User> {
  const { user } = await postJson<{ user: User }>("/api/auth/signin", { email, password })
  cachedUser = user
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-changed"))
  }
  return user
}

export async function clientSignUp(name: string, email: string, password: string): Promise<User> {
  const { user } = await postJson<{ user: User }>("/api/auth/signup", { name, email, password })
  cachedUser = user
  return user
}

/**************** Back-compat helpers ****************/
// Alguns componentes legados ainda importam `destroyClientSession`.
// Mantemos um alias para evitar erros de build enquanto não refatoramos todos.
export function destroyClientSession() {
  console.log('🧹 destroyClientSession: Limpando sessão do cliente')
  clearCachedUser()
  
  // Também limpar AuthService se disponível
  if (typeof window !== 'undefined') {
    import("@/lib/auth-service").then(({ default: authService }) => {
      authService.clearCache()
    }).catch(() => {
      // Ignorar erro se não conseguir importar
    })
  }
}
