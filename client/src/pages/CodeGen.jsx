import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const STAGES = [
  { id: 1, name: 'database',            label: 'Database Schema' },
  { id: 2, name: 'backend',             label: 'Backend API' },
  { id: 3, name: 'frontend-structure',  label: 'Frontend Structure' },
  { id: 4, name: 'frontend-components', label: 'UI Components' },
  { id: 5, name: 'package',             label: 'Package Files' },
]

const STATUS_ICON = { pending: '⏳', running: '▶', done: '✅', error: '❌' }

export default function CodeGen() {
  const { id: projectId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [stages, setStages] = useState(
    STAGES.map(s => ({ ...s, status: 'pending', content: '' }))
  )
  const [activeTab, setActiveTab] = useState(1)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [zipLoading, setZipLoading] = useState(false)
  const abortRef = useRef(null)
  const codeViewerRef = useRef(null)
  useEffect(() => {
    if (codeViewerRef.current) {
      codeViewerRef.current.scrollTop = codeViewerRef.current.scrollHeight
    }
  }, [stages])

  function updateStage(id, patch) {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  async function runStage(stageId) {
    updateStage(stageId, { status: 'running', content: '' })
    setActiveTab(stageId)
    return new Promise((resolve, reject) => {
      let fullContent = ''
      fetch(`${BASE_URL}/api/generate/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project_id: projectId, stage: stageId })
      }).then(async res => {
        if (!res.ok) {
          const err = await res.json()
          updateStage(stageId, { status: 'error' })
          return reject(new Error(err.error || 'Request failed'))
        }
        const reader = res.body.getReader()
        abortRef.current = reader
        const decoder = new TextDecoder()
        let buffer = ''
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
              // set both status and content atomically in one update
              const finalContent = fullContent
              setStages(prev => prev.map(s =>
                s.id === stageId
                  ? { ...s, status: 'done', content: finalContent }
                  : s
              ))
              return resolve()
            }
            try {
              const msg = JSON.parse(raw)
              if (msg.type === 'chunk') {
                fullContent += msg.content
                setStages(prev => prev.map(s =>
                  s.id === stageId ? { ...s, content: fullContent } : s
                ))
              } else if (msg.type === 'error') {
                updateStage(stageId, { status: 'error' })
                return reject(new Error(msg.message))
              }
            } catch {}
          }
        }
        // stream ended without [DONE]
        const finalContent = fullContent
        setStages(prev => prev.map(s =>
          s.id === stageId
            ? { ...s, status: 'done', content: finalContent }
            : s
        ))
        resolve()
      }).catch(err => {
        updateStage(stageId, { status: 'error' })
        reject(err)
      })
    })
  }

  async function runPipeline() {
    setRunning(true)
    setError('')
    try {
      for (const stage of STAGES) {
        await runStage(stage.id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  async function runSingleStage(stageId) {
    if (running) return
    setError('')
    try {
      await runStage(stageId)
    } catch (err) {
      setError(err.message)
    }
  }

  async function downloadZip() {
    setZipLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/api/generate/zip/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Download failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectId}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setZipLoading(false)
    }
  }

  function downloadStage(stage) {
    const ext = stage.id === 1 ? 'sql' : stage.id === 5 ? 'json' : 'js'
    const filename = `${stage.name}.${ext}`
    const blob = new Blob([stage.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const allDone = stages.every(s => s.status === 'done')
  const activeStage = stages.find(s => s.id === activeTab)

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

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              borderRadius: 6, color: 'var(--green)',
              fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--green)',
                color: 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>✓</div>
              Project Intake
            </div>
            <span style={{ color: 'var(--line)', fontSize: 12 }}>›</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              borderRadius: 6, color: 'var(--green)',
              fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--green)',
                color: 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>✓</div>
              Generate Spec
            </div>
            <span style={{ color: 'var(--line)', fontSize: 12 }}>›</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              borderRadius: 6, border: '1px solid var(--lime)',
              color: 'var(--lime)', background: 'var(--lime-dim)',
              fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--lime)',
                color: 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 600 }}>3</div>
              Generate Code
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            type="button"
            style={{ background: 'none', border: '1px solid var(--line2)', color: 'var(--fog)',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
              letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Syne, sans-serif' }}>
            ← Back
          </button>
        </nav>

        <div className="page-inner">
          <div className="hero-block" style={{ marginBottom: 32 }}>
            <div className="hero-eyebrow">// Step 03 of 03 — Code Generation</div>
            <h1 className="hero-h">Code <em>Generation</em></h1>
            <p className="hero-sub">5-stage sequential pipeline — each stage builds on the last</p>
          </div>

          {error && (
            <div className="err-bar show" style={{ marginBottom: 24 }}>{error}</div>
          )}

          <div className="codegen-layout" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>

            {/* ── LEFT: Pipeline status panel ── */}
            <div className="fcard">
              <div className="fcard-head">
                <span style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--lime)' }}>
                  // pipeline
                </span>
              </div>
              <div style={{ padding: '16px 20px 20px' }}>
                {stages.map((s, i) => (
                  <div
                    key={s.id}
                    onClick={() => s.content && setActiveTab(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 0',
                      borderBottom: i < stages.length - 1 ? '1px solid var(--line)' : 'none',
                      cursor: s.content ? 'pointer' : 'default',
                      opacity: s.status === 'pending' ? 0.5 : 1,
                      transition: 'opacity .2s',
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{STATUS_ICON[s.status]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        color: activeTab === s.id ? 'var(--lime)' : 'var(--text)',
                        fontFamily: 'Syne, sans-serif', fontWeight: 600,
                      }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--fog)', letterSpacing: 1 }}>
                        Stage {s.id}
                      </div>
                    </div>
                    {(s.status === 'done' || s.status === 'error') && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <button
                          onClick={e => { e.stopPropagation(); runSingleStage(s.id) }}
                          disabled={running}
                          type="button"
                          title="Re-run this stage"
                          style={{
                            background: 'none', border: '1px solid var(--line2)',
                            color: 'var(--fog)', padding: '3px 8px', borderRadius: 4,
                            cursor: 'pointer', fontSize: 10, fontFamily: 'Syne, sans-serif',
                          }}
                        >↺</button>
                        {s.status === 'done' && (
                          <button
                            onClick={e => { e.stopPropagation(); downloadStage(s) }}
                            type="button"
                            title="Download"
                            style={{
                              background: 'none', border: '1px solid var(--line2)',
                              color: 'var(--fog)', padding: '3px 8px', borderRadius: 4,
                              cursor: 'pointer', fontSize: 10, fontFamily: 'Syne, sans-serif',
                            }}
                          >↓</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  className="proceed-btn"
                  onClick={runPipeline}
                  disabled={running}
                  type="button"
                  style={{ marginTop: 20, width: '100%' }}
                >
                  {running ? '▶ Running...' : allDone ? '↺ Re-run Pipeline' : '▶ Run Pipeline'}
                </button>

                {allDone && (
                  <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
                    <button
                      onClick={downloadZip}
                      disabled={zipLoading}
                      style={{ width:'100%', padding:'10px',
                        background:'var(--lime-dim)', border:'1px solid var(--lime)',
                        color:'var(--lime)', borderRadius:8, cursor:'pointer',
                        fontSize:11, letterSpacing:2, textTransform:'uppercase',
                        fontFamily:'Syne, sans-serif', fontWeight:600 }}>
                      {zipLoading ? 'Preparing...' : '↓ Download ZIP'}
                    </button>
                    <button
                      onClick={() => navigate(`/projects/${projectId}/preview`)}
                      style={{ width:'100%', padding:'10px',
                        background:'none', border:'1px solid var(--violet)',
                        color:'var(--violet)', borderRadius:8, cursor:'pointer',
                        fontSize:11, letterSpacing:2, textTransform:'uppercase',
                        fontFamily:'Syne, sans-serif', fontWeight:600 }}>
                      ⚡ Generate Preview
                    </button>
                    <p style={{ fontSize:10, color:'var(--fog)', textAlign:'center',
                      lineHeight:1.5, marginTop:4 }}>
                      Download the ZIP, then push to GitHub manually:<br/>
                      git init → git add . → git commit → git push
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Code viewer ── */}
            <div className="fcard" style={{ minHeight: 500 }}>
              {/* Tab bar */}
              <div className="fcard-head" style={{ display: 'flex', gap: 0, padding: 0, borderBottom: '1px solid var(--line)', overflowX: 'auto' }}>
                {stages.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveTab(s.id)}
                    type="button"
                    style={{
                      padding: '12px 16px', background: 'none', border: 'none',
                      borderBottom: activeTab === s.id ? '2px solid var(--lime)' : '2px solid transparent',
                      color: activeTab === s.id ? 'var(--lime)' : 'var(--fog)',
                      cursor: 'pointer', fontSize: 10, letterSpacing: 2,
                      textTransform: 'uppercase', fontFamily: 'Syne, sans-serif',
                      fontWeight: activeTab === s.id ? 600 : 400,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div style={{ padding: 20 }}>
                {activeStage?.content ? (
                  <pre ref={codeViewerRef} style={{
                    margin: 0, padding: 16,
                    background: 'var(--ink)', borderRadius: 8,
                    overflowX: 'auto', overflowY: 'auto', maxHeight: 560,
                    fontSize: 12, lineHeight: 1.6, color: 'var(--lime)',
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    <code>{activeStage.content}</code>
                  </pre>
                ) : (
                  <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--fog)' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>
                      {activeStage?.status === 'running' ? '⚡' : '⏳'}
                    </div>
                    <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Syne, sans-serif' }}>
                      {activeStage?.status === 'running' ? 'Generating...' : 'Not yet generated'}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
