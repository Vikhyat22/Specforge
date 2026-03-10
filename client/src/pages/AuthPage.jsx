import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    const body = isLogin ? { email, password } : { name, email, password }

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || data.error || 'Something went wrong')
        return
      }

      login(data.token, data.user)
      navigate('/dashboard')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--ink)',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--ink2)',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <CardHeader style={{ paddingBottom: '8px' }}>
          <div
            style={{
              fontSize: '1.5rem',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              color: 'var(--lime)',
              marginBottom: '4px',
            }}
          >
            SpecForge
          </div>
          <CardTitle style={{ color: 'hsl(var(--foreground))', fontSize: '1.1rem' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Label htmlFor="name" style={{ color: 'hsl(var(--foreground))' }}>
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    backgroundColor: 'hsl(var(--input))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label htmlFor="email" style={{ color: 'hsl(var(--foreground))' }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  backgroundColor: 'hsl(var(--input))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label htmlFor="password" style={{ color: 'hsl(var(--foreground))' }}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  backgroundColor: 'hsl(var(--input))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--coral)', fontSize: '0.875rem', margin: 0 }}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: 'var(--lime)',
                color: 'var(--ink)',
                fontWeight: 600,
              }}
            >
              {loading ? 'Loading...' : isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--lime)',
                cursor: 'pointer',
                fontSize: 'inherit',
                fontWeight: 500,
              }}
            >
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
