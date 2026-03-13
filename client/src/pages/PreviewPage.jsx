import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const VIEWPORTS = [
  { label: 'Desktop', width: '100%' },
  { label: 'Tablet',  width: '768px' },
  { label: 'Mobile',  width: '375px' },
]

export default function PreviewPage() {
  const { id: projectId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [htmlContent, setHtmlContent] = useState('')
  const [viewport, setViewport] = useState('100%')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  // load existing preview on mount
  useEffect(() => {
    fetch(`${BASE_URL}/preview/${projectId}`)
      .then(res => res.text())
      .then(html => {
        if (!html.includes('Preview Not Found')) setHtmlContent(html)
      })
      .catch(() => {})
  }, [projectId])

  async function generatePreview() {
    setGenerating(true)
    setError('')
    setStatus('Generating preview...')
    setHtmlContent('')

    try {
      const res = await fetch(`${BASE_URL}/api/generate/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ project_id: projectId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()

          if (raw === '[DONE]') {
            setHtmlContent(fullContent)
            setStatus('')
            setGenerating(false)
            return
          }

          try {
            const msg = JSON.parse(raw)
            if (msg.type === 'chunk') {
              fullContent += msg.content
              setStatus(`Streaming... ${fullContent.length} chars`)
            } else if (msg.type === 'error') {
              throw new Error(msg.message)
            }
          } catch (e) {
            if (e.message !== 'Unexpected token') throw e
          }
        }
      }

      setHtmlContent(fullContent)
      setStatus('')
    } catch (err) {
      setError(err.message)
      setStatus('')
    } finally {
      setGenerating(false)
    }
  }

  function copyShareLink() {
    const url = `${BASE_URL}/preview/${projectId}`
    navigator.clipboard.writeText(url)
      .then(() => alert('Share link copied to clipboard!'))
      .catch(() => alert(`Share link: ${url}`))
  }

  function downloadHTML() {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `preview-${projectId}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="bg-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      <div className="shell">
        <nav className="topnav">
          <div className="nav-brand"
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}>
            <div className="brand-mark">SF</div>
            <div className="brand-name">Spec<span>Forge</span></div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => navigate(-1)}
              type="button"
              style={{
                background: 'none', border: '1px solid var(--line2)', color: 'var(--fog)',
                padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Syne, sans-serif',
              }}
            >
              ← Back
            </button>
          </div>
        </nav>

        <div className="page-inner">
          <div className="hero-block" style={{ marginBottom: 24 }}>
            <div className="hero-eyebrow">// live preview</div>
            <h1 className="hero-h">Preview</h1>
            <p className="hero-sub">AI-generated single-file interactive app</p>
          </div>

          {error && (
            <div className="err-bar show" style={{ marginBottom: 20 }}>{error}</div>
          )}

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {/* Viewport switcher */}
            <div style={{ display: 'flex', background: 'var(--ink)', borderRadius: 8, padding: 3, gap: 2 }}>
              {VIEWPORTS.map(v => (
                <button
                  key={v.label}
                  onClick={() => setViewport(v.width)}
                  type="button"
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: viewport === v.width ? 'var(--ink3)' : 'transparent',
                    color: viewport === v.width ? 'var(--text)' : 'var(--fog)',
                    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: viewport === v.width ? 600 : 400,
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {htmlContent && (
                <>
                  <button
                    onClick={copyShareLink}
                    type="button"
                    style={{
                      background: 'none', border: '1px solid var(--line2)', color: 'var(--fog)',
                      padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                      letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    ⎘ Share
                  </button>
                  <button
                    onClick={downloadHTML}
                    type="button"
                    style={{
                      background: 'none', border: '1px solid var(--line2)', color: 'var(--fog)',
                      padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                      letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    ↓ Download
                  </button>
                  <button
                    onClick={generatePreview}
                    disabled={generating}
                    type="button"
                    style={{
                      background: 'none', border: '1px solid var(--line2)', color: 'var(--fog)',
                      padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                      letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Syne, sans-serif',
                    }}
                  >
                    ↺ Re-generate
                  </button>
                </>
              )}
              <button
                className="proceed-btn"
                onClick={generatePreview}
                disabled={generating}
                type="button"
                style={{ padding: '6px 20px' }}
              >
                {generating ? (status || 'Generating...') : htmlContent ? '↺ Re-generate' : '▶ Generate Preview'}
              </button>
            </div>
          </div>

          {/* iframe viewer */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            background: 'var(--ink)', borderRadius: 12,
            border: '1px solid var(--line)', padding: 16, minHeight: 600,
          }}>
            {htmlContent ? (
              <iframe
                srcDoc={htmlContent}
                style={{
                  width: viewport, height: 600, border: 'none', borderRadius: 8,
                  transition: 'width 0.3s ease', background: '#fff',
                }}
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                flex: 1, gap: 12, color: 'var(--fog)',
              }}>
                <div style={{ fontSize: 40 }}>⚡</div>
                <div style={{
                  fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
                  fontFamily: 'Syne, sans-serif',
                }}>
                  {generating ? status : 'No preview yet — click Generate Preview'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
