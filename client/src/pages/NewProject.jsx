import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const CHIPS = [
  'User Auth', 'RBAC', 'Dashboard / Analytics', 'CRUD Management',
  'File Upload', 'Search & Filter', 'Email Notifications',
  'Real-time / WebSockets', 'Payments', 'REST API / Integrations',
  'PDF / Reports', 'Audit Logs', 'Multi-language', 'Mobile Responsive',
]

const DELIVERABLES = [
  { id: 'S1', name: 'SRS Document',        desc: 'IEEE 830 format · FR-XXX-001 IDs · DB schema · REST API contracts' },
  { id: 'S2', name: 'BRD Document',        desc: 'Business objectives · Stakeholder analysis · KPIs · Risk register' },
  { id: 'S3', name: 'Folder Structure',    desc: 'Real project scaffold with exact file names from SRS' },
  { id: 'S4', name: 'PostgreSQL Schema',   desc: 'CREATE TABLE statements · indexes · FK constraints' },
  { id: 'S5', name: 'Node.js API',         desc: 'Express routes · controllers · auth middleware' },
  { id: 'S6', name: 'React Components',    desc: 'Pages · components · AuthContext · React Router' },
  { id: 'S7', name: 'Package.json + Config', desc: "Only deps your SRS needs · .env.example · README" },
]

export default function NewProject() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    industry: '',
    timeline: '',
    description: '',
    primary_users: '',
    admin_users: '',
    user_volume: '',
    auth_type: '',
    custom_features: '',
    performance: '',
    security_level: '',
    deployment: '',
    device_support: '',
    special_constraints: '',
  })
  const [selectedChips, setSelectedChips] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function update(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function toggleChip(chip) {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    )
  }

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      setError('Project Name is required.')
      return
    }
    if (!formData.description.trim()) {
      setError('Project Description is required.')
      return
    }
    setError(null)
    setSubmitting(true)

    try {
      const projectRes = await fetch(`${BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          client_name: formData.client_name,
          industry: formData.industry,
          project_type: formData.timeline,
        }),
      })
      if (!projectRes.ok) {
        const e = await projectRes.json().catch(() => ({}))
        throw new Error(e.error || `Failed to create project (${projectRes.status})`)
      }
      const { project } = await projectRes.json()

      const inputsRes = await fetch(`${BASE_URL}/api/projects/${project.id}/inputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, features: selectedChips }),
      })
      if (!inputsRes.ok) {
        const e = await inputsRes.json().catch(() => ({}))
        throw new Error(e.error || `Failed to save inputs (${inputsRes.status})`)
      }

      navigate('/projects/' + project.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }, [formData, selectedChips, token, navigate])

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
          <div style={{display:'flex', alignItems:'center', gap:4}}>
            <div style={{display:'flex', alignItems:'center', gap:8, padding:'6px 16px',
              borderRadius:6, border:'1px solid var(--lime)', color:'var(--lime)',
              background:'var(--lime-dim)', fontSize:10, letterSpacing:1, textTransform:'uppercase'}}>
              <div style={{width:18, height:18, borderRadius:'50%', background:'var(--lime)',
                color:'var(--ink)', display:'grid', placeItems:'center', fontSize:9, fontWeight:600}}>1</div>
              <span className="step-label">Project Intake</span>
            </div>
            <span style={{color:'var(--line)', fontSize:12}}>›</span>
            <div style={{display:'flex', alignItems:'center', gap:8, padding:'6px 16px',
              borderRadius:6, color:'var(--fog)', fontSize:10, letterSpacing:1, textTransform:'uppercase'}}>
              <div style={{width:18, height:18, borderRadius:'50%', background:'var(--line)',
                color:'var(--fog)', display:'grid', placeItems:'center', fontSize:9, fontWeight:600}}>2</div>
              <span className="step-label">Generate Spec</span>
            </div>
            <span style={{color:'var(--line)', fontSize:12}}>›</span>
            <div style={{display:'flex', alignItems:'center', gap:8, padding:'6px 16px',
              borderRadius:6, color:'var(--fog)', fontSize:10, letterSpacing:1, textTransform:'uppercase'}}>
              <div style={{width:18, height:18, borderRadius:'50%', background:'var(--line)',
                color:'var(--fog)', display:'grid', placeItems:'center', fontSize:9, fontWeight:600}}>3</div>
              <span className="step-label">Generate Code</span>
            </div>
          </div>
          <div className="tech-stack-nav-badges" style={{display:'flex', gap:6}}>
            <span style={{fontSize:9, letterSpacing:1.5, textTransform:'uppercase', padding:'4px 10px',
              borderRadius:4, border:'1px solid rgba(61,155,255,.3)', color:'var(--sky)'}}>React</span>
            <span style={{fontSize:9, letterSpacing:1.5, textTransform:'uppercase', padding:'4px 10px',
              borderRadius:4, border:'1px solid rgba(198,241,53,.3)', color:'var(--lime)'}}>Node.js</span>
            <span style={{fontSize:9, letterSpacing:1.5, textTransform:'uppercase', padding:'4px 10px',
              borderRadius:4, border:'1px solid rgba(168,85,247,.3)', color:'var(--violet)'}}>PostgreSQL</span>
          </div>
        </nav>

        {/* ── Page body ── */}
        <div className="page-inner">

          {/* Hero */}
          <div className="hero-block">
            <div className="hero-eyebrow">// New Project — Intake Form</div>
            <h1 className="hero-h">Build <em>exactly</em> what<br />the client asked for</h1>
            <p className="hero-sub">
              Fill in your client's project details and we'll generate a complete SRS, BRD,
              database schema, and starter codebase — tailored to their exact requirements.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="intake-layout">

            {/* ── LEFT: form cards ── */}
            <div>

              {/* Card 1 — Client & Project */}
              <div className="fcard">
                <div className="fcard-head">
                  <span>🏢</span>
                  <span className="fcard-title">Client &amp; Project</span>
                  <span className="fcard-sub">SECTION 01</span>
                </div>
                <div className="fgrid">
                  <div className="field">
                    <label className="flabel freq">Project Name</label>
                    <input
                      id="f-name"
                      type="text"
                      placeholder="e.g. Acme Customer Portal"
                      value={formData.name}
                      onChange={(e) => update('name', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="flabel">Client / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={formData.client_name}
                      onChange={(e) => update('client_name', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="flabel">Industry / Domain</label>
                    <input
                      type="text"
                      placeholder="e.g. Healthcare, Fintech"
                      value={formData.industry}
                      onChange={(e) => update('industry', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="flabel">Timeline</label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => update('timeline', e.target.value)}
                    >
                      <option value="">Select timeline…</option>
                      <option value="4 weeks — MVP">4 weeks — MVP</option>
                      <option value="6–8 weeks — Standard">6–8 weeks — Standard</option>
                      <option value="3 months — Full Build">3 months — Full Build</option>
                      <option value="6 months — Enterprise">6 months — Enterprise</option>
                    </select>
                  </div>
                  <div className="field span2">
                    <label className="flabel freq">Project Description</label>
                    <textarea
                      placeholder="Describe what the client wants to build..."
                      value={formData.description}
                      onChange={(e) => update('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2 — Users & Roles */}
              <div className="fcard">
                <div className="fcard-head">
                  <span>👥</span>
                  <span className="fcard-title">Users &amp; Roles</span>
                  <span className="fcard-sub">SECTION 02</span>
                </div>
                <div className="fgrid">
                  <div className="field">
                    <label className="flabel">Primary Users</label>
                    <input
                      type="text"
                      placeholder="e.g. Customers, restaurant owners"
                      value={formData.primary_users}
                      onChange={(e) => update('primary_users', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="flabel">Admin / Internal Users</label>
                    <input
                      type="text"
                      placeholder="e.g. Operations team, Support"
                      value={formData.admin_users}
                      onChange={(e) => update('admin_users', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="flabel">Expected User Volume</label>
                    <select
                      value={formData.user_volume}
                      onChange={(e) => update('user_volume', e.target.value)}
                    >
                      <option value="">Select volume…</option>
                      <option value="Small — under 1K">Small — under 1K</option>
                      <option value="Medium — 1K–50K">Medium — 1K–50K</option>
                      <option value="Large — 50K+">Large — 50K+</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="flabel">Authentication</label>
                    <select
                      value={formData.auth_type}
                      onChange={(e) => update('auth_type', e.target.value)}
                    >
                      <option value="">Select auth…</option>
                      <option value="Email / Password + JWT">Email / Password + JWT</option>
                      <option value="Google OAuth + JWT">Google OAuth + JWT</option>
                      <option value="Email OTP + JWT">Email OTP + JWT</option>
                      <option value="Multi-provider OAuth">Multi-provider OAuth</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 3 — Features & Modules */}
              <div className="fcard">
                <div className="fcard-head">
                  <span>⚙️</span>
                  <span className="fcard-title">Features &amp; Modules</span>
                  <span className="fcard-sub">SECTION 03</span>
                </div>
                <div className="chip-grid">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip}
                      className={`chip${selectedChips.includes(chip) ? ' on' : ''}`}
                      onClick={() => toggleChip(chip)}
                      type="button"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <div style={{ padding: '0 18px 18px' }}>
                  <div className="field">
                    <label className="flabel">Additional / Custom Features</label>
                    <input
                      type="text"
                      placeholder="Any other specific features or integrations?"
                      value={formData.custom_features}
                      onChange={(e) => update('custom_features', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4 — Non-Functional Requirements */}
              <div className="fcard">
                <div className="fcard-head">
                  <span>🔒</span>
                  <span className="fcard-title">Non-Functional Requirements</span>
                  <span className="fcard-sub">SECTION 04</span>
                </div>
                <div className="fgrid">
                  <div className="field">
                    <label className="flabel">Performance</label>
                    <select
                      value={formData.performance}
                      onChange={(e) => update('performance', e.target.value)}
                    >
                      <option value="">Select…</option>
                      <option value="Standard">Standard</option>
                      <option value="High">High</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="flabel">Security Level</label>
                    <select
                      value={formData.security_level}
                      onChange={(e) => update('security_level', e.target.value)}
                    >
                      <option value="">Select…</option>
                      <option value="Basic">Basic</option>
                      <option value="Standard">Standard</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="flabel">Deployment Target</label>
                    <select
                      value={formData.deployment}
                      onChange={(e) => update('deployment', e.target.value)}
                    >
                      <option value="">Select…</option>
                      <option value="Vercel + Railway">Vercel + Railway</option>
                      <option value="AWS EC2 + RDS">AWS EC2 + RDS</option>
                      <option value="DigitalOcean">DigitalOcean</option>
                      <option value="Client's own server">Client's own server</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="flabel">Device Support</label>
                    <select
                      value={formData.device_support}
                      onChange={(e) => update('device_support', e.target.value)}
                    >
                      <option value="">Select…</option>
                      <option value="Modern browsers only">Modern browsers only</option>
                      <option value="Browsers + Mobile">Browsers + Mobile</option>
                    </select>
                  </div>
                  <div className="field span2">
                    <label className="flabel">Special Constraints</label>
                    <input
                      type="text"
                      placeholder="e.g. HIPAA compliance, GDPR, offline support"
                      value={formData.special_constraints}
                      onChange={(e) => update('special_constraints', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Error bar */}
              <div className={`err-bar${error ? ' show' : ''}`}>{error}</div>

              {/* Submit */}
              <button
                className="proceed-btn"
                onClick={handleSubmit}
                disabled={submitting}
                type="button"
              >
                {submitting ? 'Creating…' : 'Generate SRS + BRD →'}
              </button>

            </div>

            {/* ── RIGHT: sidebar ── */}
            <div style={{
              background: 'var(--ink2)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              overflow: 'hidden',
              position: 'sticky',
              top: 90,
            }}>
              <div style={{
                padding: '16px 18px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--ink3)',
                fontSize: 10,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: 'var(--lime)',
              }}>
                // What gets generated
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {DELIVERABLES.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '14px 18px',
                      borderBottom: i < DELIVERABLES.length - 1 ? '1px solid var(--line)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, flexShrink: 0,
                      background: 'var(--ink3)',
                      border: '1px solid var(--line2)',
                      borderRadius: 5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: 'var(--lime)', fontWeight: 700,
                      letterSpacing: 0,
                    }}>
                      {item.id}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--fog2)', lineHeight: 1.6 }}>
                        {item.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
