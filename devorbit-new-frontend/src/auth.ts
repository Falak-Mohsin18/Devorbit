export const AUTH_TOKEN_KEY = "devorbit_auth_token"

export type AuthUser = {
  id: string
  name: string
  email: string
  role?: string
  avatar?: string
  avatarUrl?: string
  skills?: string[]
}

export type AuthSession = {
  token: string
  user: AuthUser
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegistrationDetails = {
  name: string
  email: string
  password: string
}

export class AuthApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "AuthApiError"
    this.status = status
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false
  const candidate = value as Record<string, unknown>
  const id = candidate.id ?? candidate._id
  return (
    (typeof id === "string" || typeof id === "number") &&
    typeof candidate.email === "string"
  )
}

function normalizeUser(value: unknown): AuthUser {
  if (!isAuthUser(value)) {
    throw new AuthApiError("The server returned an invalid user record.", 502)
  }
  const candidate = value as Record<string, unknown>
  const id = String(candidate.id ?? candidate._id)
  return {
    ...(candidate as unknown as AuthUser),
    id,
    name: (candidate.name as string) || (candidate.email as string),
  }
}

async function readResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) return null
  return response.json() as Promise<unknown>
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback
  const body = payload as Record<string, unknown>
  if (typeof body.message === "string") return body.message
  if (typeof body.error === "string") return body.error
  return fallback
}

async function request(path: string, init: RequestInit) {
  let response: Response
  try {
    response = await fetch(path, init)
  } catch {
    throw new AuthApiError(
      "Unable to reach the DevOrbit server. Check your connection and try again.",
      0,
    )
  }

  const payload = await readResponse(response)
  if (!response.ok) {
    throw new AuthApiError(
      getErrorMessage(payload, `The server returned an error (${response.status}).`),
      response.status,
    )
  }
  return payload
}

function normalizeSession(payload: unknown): AuthSession {
  if (!payload || typeof payload !== "object") {
    throw new AuthApiError("The server returned an invalid authentication response.", 502)
  }
  const body = payload as Record<string, unknown>
  if (typeof body.token !== "string" || !body.token) {
    throw new AuthApiError("The authentication response did not include a token.", 502)
  }
  return {
    token: body.token,
    user: normalizeUser(body.user),
  }
}

export async function login(credentials: LoginCredentials) {
  const payload = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })
  return normalizeSession(payload)
}

export async function register(details: RegistrationDetails) {
  const payload = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  })
  return normalizeSession(payload)
}

export async function getCurrentUser(token: string) {
  const payload = await request("/api/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (payload && typeof payload === "object" && "user" in payload) {
    return normalizeUser((payload as Record<string, unknown>).user)
  }
  return normalizeUser(payload)
}

export function getStoredToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, session.token)
}

export function clearSession() {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // The in-memory session is still cleared by the caller.
  }
}
