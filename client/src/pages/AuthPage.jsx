import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  async function handleSubmit() {
    setError('')
    setLoading(true)

    try {
      // Register then auto-login, or just login
      if (!isLogin) {
        const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const regData = await regRes.json()
        if (!regRes.ok) {
          setError(regData.message || regData.error || 'Registration failed')
          return
        }
      }

      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await loginRes.json()
      if (!loginRes.ok) {
        setError(loginData.message || loginData.error || 'Login failed')
        return
      }

      login(loginData.token, loginData.user)
      navigate('/dashboard')
    } catch {
      setError('Network error — please try again')
      showToast('Network error — please try again', 'error')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(toLogin) {
    setIsLogin(toLogin)
    setError('')
  }

  return (
    <>
      <div className="bg-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
            <div className="brand-mark">SF</div>
            <div className="brand-name">Spec<span>Forge</span></div>
          </div>

          {/* Card */}
          <div className="fcard">
            <div className="fcard-head">
              <span style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--lime)' }}>
                // {isLogin ? 'Welcome back' : 'Create account'}
              </span>
            </div>

            <div style={{ padding: '28px 28px 32px' }}>

              {/* Toggle tabs */}
              <div style={{ display: 'flex', background: 'var(--ink)', borderRadius: 8, padding: 4, marginBottom: 28 }}>
                <button
                  onClick={() => switchMode(true)}
                  type="button"
                  style={{
                    flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: isLogin ? 'var(--ink3)' : 'transparent',
                    color: isLogin ? 'var(--text)' : 'var(--fog)',
                    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                    fontFamily: 'Syne, sans-serif', fontWeight: isLogin ? 600 : 400,
                    transition: 'all .15s',
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchMode(false)}
                  type="button"
                  style={{
                    flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: !isLogin ? 'var(--ink3)' : 'transparent',
                    color: !isLogin ? 'var(--text)' : 'var(--fog)',
                    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                    fontFamily: 'Syne, sans-serif', fontWeight: !isLogin ? 600 : 400,
                    transition: 'all .15s',
                  }}
                >
                  Register
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="err-bar show" style={{ marginBottom: 20 }}>
                  {error}
                </div>
              )}

              {/* Form fields */}
              <div className="fgrid" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
                {!isLogin && (
                  <div className="field">
                    <label className="flabel">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}
                <div className="field">
                  <label className="flabel">Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="flabel">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                className="proceed-btn"
                onClick={handleSubmit}
                disabled={loading}
                type="button"
                style={{ marginTop: 24, width: '100%' }}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In →' : 'Create Account →'}
              </button>

            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--fog)', letterSpacing: 1 }}>
            Spec-first AI code generation
          </p>

        </div>
      </div>
    </>
  )
}
