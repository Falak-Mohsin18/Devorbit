import { useState, type FormEvent } from "react"
import {
  AuthApiError,
  login,
  register,
  storeSession,
  type AuthSession,
} from "./auth"
import "./auth.css"

type AuthMode = "login" | "register"

function AuthLogo() {
  return (
    <div className="auth-logo">
      <div className="auth-logo-mark" aria-hidden="true">
        <span />
        <span />
        <i />
      </div>
      <span>DevOrbit</span>
    </div>
  )
}

function messageForError(error: unknown, mode: AuthMode) {
  if (!(error instanceof AuthApiError)) {
    return "Something went wrong. Please try again."
  }
  if (error.status === 401) {
    return "The email or password you entered is incorrect."
  }
  if (error.status === 409 && mode === "register") {
    return "An account with this email already exists. Try logging in instead."
  }
  if (error.status >= 500) {
    return "The DevOrbit server is temporarily unavailable. Please try again shortly."
  }
  return error.message
}

export default function AuthPage({
  mode,
  onAuthenticated,
}: {
  mode: AuthMode
  onAuthenticated: (session: AuthSession) => void
}) {
  const isLogin = mode === "login"
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return

    const nextErrors: Record<string, string> = {}
    if (!isLogin && !name.trim()) nextErrors.name = "Enter your name."
    if (!email.trim()) nextErrors.email = "Enter your email address."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address."
    }
    if (!password) nextErrors.password = "Enter your password."
    else if (!isLogin && password.length < 8) {
      nextErrors.password = "Use at least 8 characters."
    }
    if (!isLogin && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match."
    }
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setError("")
    setFieldErrors({})
    try {
      const session = isLogin
        ? await login({ email: email.trim(), password })
        : await register({ name: name.trim(), email: email.trim(), password })
      storeSession(session)
      onAuthenticated(session)
    } catch (requestError) {
      setError(messageForError(requestError, mode))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <a className="auth-brand-link" href="/" aria-label="Return to DevOrbit home">
        <AuthLogo />
      </a>

      <section className="auth-story">
        <div className="auth-story-orbit" aria-hidden="true">
          <span className="orbit-ring ring-one" />
          <span className="orbit-ring ring-two" />
          <i className="orbit-node node-one" />
          <i className="orbit-node node-two" />
          <i className="orbit-node node-three" />
          <div>DO</div>
        </div>
        <div>
          <span>Orbit Intelligence</span>
          <strong>Your projects, contributions, and growth in one workspace.</strong>
          <p>Connect the work you ship with the developer story you are building.</p>
        </div>
      </section>

      <main className="auth-main">
        <div className="auth-form-shell">
          <div className="auth-kicker">{isLogin ? "Welcome back" : "Create your workspace"}</div>
          <h1>{isLogin ? "Log in to DevOrbit" : "Start building your orbit"}</h1>
          <p>
            {isLogin
              ? "Enter your account details to continue to your workspace."
              : "Create an account to organize projects, collaborate, and track your growth."}
          </p>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <form className="auth-form" onSubmit={submit} noValidate>
            {!isLogin && (
              <label>
                <span>Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  autoFocus
                />
                {fieldErrors.name && <small>{fieldErrors.name}</small>}
              </label>
            )}
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                autoFocus={isLogin}
              />
              {fieldErrors.email && <small>{fieldErrors.email}</small>}
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder={isLogin ? "Enter your password" : "At least 8 characters"}
              />
              {fieldErrors.password && <small>{fieldErrors.password}</small>}
            </label>
            {!isLogin && (
              <label>
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                />
                {fieldErrors.confirmPassword && <small>{fieldErrors.confirmPassword}</small>}
              </label>
            )}
            <button type="submit" disabled={submitting}>
              {submitting
                ? isLogin ? "Logging in…" : "Creating account…"
                : isLogin ? "Log in" : "Create account"}
            </button>
          </form>

          <div className="auth-switch">
            {isLogin ? "New to DevOrbit?" : "Already have an account?"}
            <a href={isLogin ? "/register" : "/login"}>
              {isLogin ? "Create an account" : "Log in"}
            </a>
          </div>
          <a className="auth-back" href="/">← Back to DevOrbit</a>
        </div>
      </main>
    </div>
  )
}
