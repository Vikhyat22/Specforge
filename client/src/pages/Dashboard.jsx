import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const STATUS_BADGE = {
  draft: {
    color: 'var(--fog)',
    background: 'var(--ink3)',
  },
  wizard_complete: {
    color: 'var(--sky)',
    background: 'var(--sky-dim)',
  },
  generating: {
    color: 'var(--gold)',
    background: 'var(--gold-dim)',
  },
  complete: {
    color: 'var(--lime)',
    background: 'var(--lime-dim)',
  },
  error: {
    color: 'var(--coral)',
    background: 'var(--coral-dim)',
  },
}

function statusBadge(status) {
  return STATUS_BADGE[status] ?? STATUS_BADGE.draft
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      navigate('/auth')
      return
    }
    fetch(`${BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [token, navigate])

  function handleLogout() {
    logout()
    navigate('/auth')
  }

  return (
    <>
      <div className="bg-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="shell">

        {/* ── Top nav ── */}
        <nav className="topnav">
          <div className="nav-brand">
            <div className="brand-mark">SF</div>
            <div className="brand-name">Spec<span>Forge</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--fog2)' }}>
              {user?.name ?? user?.email ?? ''}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '7px 16px',
                border: '1px solid var(--line2)',
                borderRadius: 6,
                background: 'transparent',
                color: 'var(--fog2)',
                fontSize: 11,
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        {/* ── Page body ── */}
        <div className="page-inner">

          {/* Hero eyebrow + action row */}
          <div className="dashboard-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
            <div className="hero-eyebrow">// Your Projects</div>
            <button
              className="proceed-btn"
              onClick={() => navigate('/projects/new')}
              style={{ width: 'auto', padding: '12px 24px', marginBottom: 0, display: 'inline-flex' }}
            >
              + New Project
            </button>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--fog)' }}>
              Loading...
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && projects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--fog)' }}>
              No projects yet
            </div>
          )}

          {/* ── Projects grid ── */}
          {!loading && projects.length > 0 && (
            <div className="dashboard-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {projects.map((project) => {
                const badge = statusBadge(project.status)
                return (
                  <div
                    key={project.id}
                    className="fcard"
                    style={{ cursor: 'pointer', marginBottom: 0 }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    {/* Card head */}
                    <div className="fcard-head" style={{ justifyContent: 'space-between' }}>
                      <span
                        className="fcard-title"
                        style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}
                      >
                        {project.name}
                      </span>
                      {/* Status badge */}
                      <span style={{
                        fontSize: 9,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 4,
                        color: badge.color,
                        background: badge.background,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {project.status?.replace(/_/g, ' ') ?? 'draft'}
                      </span>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {project.client_name && (
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                          {project.client_name}
                        </span>
                      )}
                      {project.industry && (
                        <span style={{ fontSize: 11, color: 'var(--fog2)' }}>
                          {project.industry}
                        </span>
                      )}
                      {project.project_type && (
                        <span style={{ fontSize: 11, color: 'var(--fog2)' }}>
                          {project.project_type}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: 'var(--fog)', marginTop: 8 }}>
                        {formatDate(project.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
