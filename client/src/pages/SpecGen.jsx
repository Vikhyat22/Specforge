import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStream } from '../hooks/useStream'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// Blinking cursor component
function Cursor() {
  return (
    <span style={{
      display: 'inline-block',
      color: 'var(--coral)',
      animation: 'cursorBlink 1s step-end infinite',
      marginLeft: 1,
    }}>│</span>
  )
}

// Status tag component
function StatusTag({ status }) {
  const map = {
    idle:      { label: 'Wait',       color: 'var(--fog2)',  bg: 'transparent',      border: 'var(--line2)' },
    streaming: { label: '⬤ Live',     color: 'var(--lime)',  bg: 'var(--lime-dim)',   border: 'var(--lime)'  },
    done:      { label: '✓ Done',     color: 'var(--green)', bg: 'rgba(34,197,94,.1)', border: 'rgba(34,197,94,.4)' },
    error:     { label: '✕ Error',    color: 'var(--coral)', bg: 'var(--coral-dim)', border: 'rgba(255,94,58,.4)' },
  }
  const s = map[status] || map.idle
  return (
    <span style={{
      fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600,
      padding: '3px 9px', borderRadius: 4,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      transition: 'all .3s',
    }}>
      {s.label}
    </span>
  )
}

export default function SpecGen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { stream, isStreaming, error: streamError, setError: setStreamError } = useStream()

  const [project, setProject] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const [srsContent, setSrsContent] = useState('')
  const [brdContent, setBrdContent] = useState('')
  const [activeTab, setActiveTab] = useState('srs')
  const [srsStatus, setSrsStatus] = useState('idle')
  const [brdStatus, setBrdStatus] = useState('idle')

  const srsRef = useRef(null)
  const brdRef = useRef(null)

  // Redirect if no token
  useEffect(() => {
    if (!token) navigate('/auth')
  }, [token, navigate])

  // Load project on mount
  useEffect(() => {
    if (!token || !id) return
    fetch(`${BASE_URL}/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Project not found (${r.status})`)
        return r.json()
      })
      .then(({ project }) => setProject(project))
      .catch((err) => setLoadError(err.message))
  }, [id, token])

  // Auto-scroll doc viewers as content streams in
  useEffect(() => {
    if (srsRef.current) srsRef.current.scrollTop = srsRef.current.scrollHeight
  }, [srsContent])
  useEffect(() => {
    if (brdRef.current) brdRef.current.scrollTop = brdRef.current.scrollHeight
  }, [brdContent])

  function handleGenerate() {
    if (isStreaming) return
    setSrsContent('')
    setBrdContent('')
    setSrsStatus('streaming')
    setBrdStatus('idle')
    setStreamError(null)
    setActiveTab('srs')

    stream(
      `${BASE_URL}/api/generate/srs`,
      { project_id: id },
      (chunk) => setSrsContent((prev) => prev + chunk),
      () => {
        setSrsStatus('done')
        setBrdStatus('streaming')
        setActiveTab('brd')

        stream(
          `${BASE_URL}/api/generate/brd`,
          { project_id: id },
          (chunk) => setBrdContent((prev) => prev + chunk),
          () => setBrdStatus('done'),
        )
      },
    )
  }

  function downloadDoc(type) {
    const content = type === 'srs' ? srsContent : brdContent
    const filename = `${project?.name || 'spec'}-${type.toUpperCase()}.md`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const bothDone = srsStatus === 'done' && brdStatus === 'done'

  return (
    <>
      {/* cursor blink keyframe injected once */}
      <style>{`
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      <div className="bg-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      <div className="shell">
        {/* ── Topnav ── */}
        <nav className="topnav">
          <div className="nav-brand">
            <div className="brand-mark">SF</div>
            <div className="brand-name">Spec<span>Forge</span></div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Step 1 — done */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              borderRadius: 6, color: 'var(--green)',
              fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'var(--green)', color: 'var(--ink)',
                display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700,
              }}>✓</div>
              Project Intake
            </div>
            <span style={{ color: 'var(--line)', fontSize: 12 }}>›</span>
            {/* Step 2 — active */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              borderRadius: 6, border: '1px solid var(--lime)',
              color: 'var(--lime)', background: 'var(--lime-dim)',
              fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'var(--lime)', color: 'var(--ink)',
                display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 600,
              }}>2</div>
              Generate Spec
            </div>
            <span style={{ color: 'var(--line)', fontSize: 12 }}>›</span>
            {/* Step 3 — dimmed */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              borderRadius: 6, color: 'var(--fog)',
              fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'var(--line)', color: 'var(--fog)',
                display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 600,
              }}>3</div>
              Generate Code
            </div>
          </div>

          {/* Tech tags */}
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(61,155,255,.3)', color: 'var(--sky)' }}>React</span>
            <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(198,241,53,.3)', color: 'var(--lime)' }}>Node.js</span>
            <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(168,85,247,.3)', color: 'var(--violet)' }}>PostgreSQL</span>
          </div>
        </nav>

        {/* ── Page body ── */}
        <div className="page-inner">

          {/* Hero */}
          <div className="hero-block">
            <div className="hero-eyebrow">// Step 02 of 03 — Specification Generation</div>
            <h1 className="hero-h">
              Your <em>SRS + BRD</em><br />generating now
            </h1>
            <p className="hero-sub">
              {loadError
                ? `Error: ${loadError}`
                : project
                ? `Project: ${project.name}${project.client_name ? ` · ${project.client_name}` : ''}`
                : 'Loading project…'}
            </p>
          </div>

          {/* Two-column spec layout */}
          <div className="spec-layout">

            {/* ── LEFT: Document viewer ── */}
            <div>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: '1px solid var(--line)' }}>
                {[
                  { key: 'srs', label: 'SRS Document', status: srsStatus },
                  { key: 'brd', label: 'BRD Document', status: brdStatus },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    type="button"
                    style={{
                      padding: '12px 20px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.key
                        ? '2px solid var(--lime)'
                        : '2px solid transparent',
                      color: activeTab === tab.key ? 'var(--lime)' : 'var(--fog2)',
                      fontSize: 11, fontWeight: activeTab === tab.key ? 600 : 400,
                      letterSpacing: 0.5,
                      cursor: 'pointer',
                      transition: 'all .15s',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    {tab.label}
                    <StatusTag status={tab.status} />
                  </button>
                ))}
              </div>

              {/* Content area */}
              <div
                ref={activeTab === 'srs' ? srsRef : brdRef}
                style={{
                  height: 600, overflowY: 'auto',
                  background: 'var(--ink2)',
                  border: '1px solid var(--line)',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  padding: 24,
                }}
              >
                {activeTab === 'srs' ? (
                  srsContent ? (
                    <pre style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12, lineHeight: 1.9,
                      color: 'var(--text2)',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      margin: 0,
                    }}>
                      {srsContent}
                      {srsStatus === 'streaming' && <Cursor />}
                    </pre>
                  ) : (
                    <div style={{
                      height: '100%', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--fog)', fontSize: 12, gap: 10,
                    }}>
                      <span style={{ fontSize: 28 }}>📄</span>
                      Click Generate to start…
                    </div>
                  )
                ) : (
                  brdContent ? (
                    <pre style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12, lineHeight: 1.9,
                      color: 'var(--text2)',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      margin: 0,
                    }}>
                      {brdContent}
                      {brdStatus === 'streaming' && <Cursor />}
                    </pre>
                  ) : (
                    <div style={{
                      height: '100%', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--fog)', fontSize: 12, gap: 10,
                    }}>
                      <span style={{ fontSize: 28 }}>📋</span>
                      {srsStatus === 'idle'
                        ? 'Generate SRS first…'
                        : srsStatus === 'streaming'
                        ? 'Waiting for SRS to complete…'
                        : 'Click Generate to start…'}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ── RIGHT: Progress panel ── */}
            <div style={{
              background: 'var(--ink2)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              overflow: 'hidden',
              position: 'sticky',
              top: 90,
            }}>

              {/* Panel header */}
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--ink3)',
                fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
                color: 'var(--lime)',
              }}>
                // Generation Status
              </div>

              {/* Status rows */}
              <div style={{ padding: '6px 0' }}>
                {[
                  { label: 'SRS Document', status: srsStatus },
                  { label: 'BRD Document', status: brdStatus },
                ].map((row, i) => (
                  <div key={row.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderBottom: i === 0 ? '1px solid var(--line)' : 'none',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>
                      {row.label}
                    </span>
                    <StatusTag status={row.status} />
                  </div>
                ))}
              </div>

              {/* Stream error */}
              {streamError && (
                <div style={{
                  margin: '0 14px',
                  padding: '10px 14px',
                  background: 'var(--coral-dim)',
                  border: '1px solid rgba(255,94,58,.3)',
                  borderRadius: 8,
                  fontSize: 11, color: 'var(--coral)', lineHeight: 1.6,
                }}>
                  {streamError}
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--line)', margin: '6px 0' }} />

              {/* Generate button */}
              <div style={{ padding: '14px 18px' }}>
                <button
                  className="proceed-btn"
                  onClick={handleGenerate}
                  disabled={isStreaming}
                  type="button"
                  style={{ marginTop: 0 }}
                >
                  {isStreaming ? (
                    <>
                      <span style={{
                        width: 12, height: 12,
                        border: '2px solid var(--ink)',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin .7s linear infinite',
                      }} />
                      Generating…
                    </>
                  ) : (
                    '⚡ Generate SRS + BRD'
                  )}
                </button>
              </div>

              {/* Post-generation actions */}
              {bothDone && (
                <>
                  <div style={{ borderTop: '1px solid var(--line)' }} />
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--fog)', marginBottom: 4 }}>
                      // Downloads
                    </p>
                    <button
                      onClick={() => downloadDoc('srs')}
                      type="button"
                      style={{
                        width: '100%', padding: '11px 16px',
                        background: 'transparent',
                        border: '1px solid var(--line2)',
                        borderRadius: 8,
                        color: 'var(--text2)', fontSize: 11,
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all .15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lime)'; e.currentTarget.style.color = 'var(--lime)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.color = 'var(--text2)' }}
                    >
                      ↓ Download SRS (.md)
                    </button>
                    <button
                      onClick={() => downloadDoc('brd')}
                      type="button"
                      style={{
                        width: '100%', padding: '11px 16px',
                        background: 'transparent',
                        border: '1px solid var(--line2)',
                        borderRadius: 8,
                        color: 'var(--text2)', fontSize: 11,
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all .15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lime)'; e.currentTarget.style.color = 'var(--lime)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.color = 'var(--text2)' }}
                    >
                      ↓ Download BRD (.md)
                    </button>

                    <div style={{ borderTop: '1px solid var(--line)', margin: '4px 0' }} />

                    <button
                      onClick={() => navigate(`/projects/${id}/code`)}
                      type="button"
                      className="proceed-btn"
                      style={{ marginTop: 0 }}
                    >
                      Proceed to Code Generation →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
