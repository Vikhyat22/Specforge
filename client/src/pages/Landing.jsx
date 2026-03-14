import { useNavigate } from 'react-router-dom'
export default function Landing() {
  const navigate = useNavigate()
  return (
    <>
      <div className="bg-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="shell">
        {/* Nav */}
        <nav className="topnav">
          <div className="brand-mark">SF</div>
          <div className="brand-name">Spec<span>Forge</span></div>
          <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center' }}>
            <button
              onClick={() => navigate('/auth')}
              style={{ background:'none', border:'1px solid var(--line2)', color:'var(--fog)',
                padding:'6px 18px', borderRadius:6, cursor:'pointer', fontSize:11,
                letterSpacing:2, textTransform:'uppercase', fontFamily:'Syne, sans-serif' }}>
              Login
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="proceed-btn"
              style={{ padding:'6px 18px' }}>
              Get Started →
            </button>
          </div>
        </nav>
        {/* Hero */}
        <div style={{ textAlign:'center', padding:'100px 24px 80px', maxWidth:760, margin:'0 auto' }}>
          <div className="hero-eyebrow">// AI-powered spec generation</div>
          <h1 className="hero-h" style={{ fontSize:'clamp(36px, 6vw, 72px)', marginBottom:24 }}>
            From Idea to Code<br />in Minutes
          </h1>
          <p className="hero-sub" style={{ fontSize:18, maxWidth:520, margin:'0 auto 40px' }}>
            Describe your project. SpecForge writes the SRS, BRD, and generates
            production-ready code — all from a single spec.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="proceed-btn"
            style={{ fontSize:14, padding:'14px 36px', letterSpacing:3 }}>
            Get Started Free →
          </button>
        </div>
        {/* 3-step flow */}
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div className="hero-eyebrow">// how it works</div>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:28, color:'var(--text)', fontWeight:700 }}>
              Three steps to a working app
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:20 }}>
            {[
              { step:'01', title:'Describe your project', desc:'Fill in your project name, industry, and requirements. SpecForge handles the rest.' },
              { step:'02', title:'Get SRS + BRD', desc:'AI generates a full IEEE 830 Software Requirements Spec and Business Requirements Doc instantly.' },
              { step:'03', title:'Get working code', desc:'5-stage pipeline generates schema, backend, frontend, and components — ready to deploy.' },
            ].map(item => (
              <div key={item.step} className="fcard" style={{ padding:0 }}>
                <div className="fcard-head">
                  <span style={{ fontSize:11, letterSpacing:3, color:'var(--lime)' }}>// {item.step}</span>
                </div>
                <div style={{ padding:'20px 24px 24px' }}>
                  <h3 style={{ fontFamily:'Syne, sans-serif', fontSize:16, fontWeight:700,
                    color:'var(--text)', marginBottom:10 }}>{item.title}</h3>
                  <p style={{ fontSize:13, color:'var(--fog)', lineHeight:1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Feature highlights */}
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 24px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div className="hero-eyebrow">// features</div>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:28, color:'var(--text)', fontWeight:700 }}>
              Everything you need to ship
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
            {[
              { icon:'⚡', title:'AI-Powered Specs', desc:'IEEE 830 SRS and BRD generated from your project description.' },
              { icon:'👁', title:'Live Preview', desc:'Single-file interactive HTML preview with MockAPI and hash routing.' },
              { icon:'📦', title:'ZIP Download', desc:'Full project scaffold with server, client, schema and README.' },
              { icon:'🔀', title:'5-Stage Pipeline', desc:'Sequential code generation — each stage builds on the last.' },
            ].map(item => (
              <div key={item.title}
                style={{ background:'var(--ink2)', border:'1px solid var(--line)',
                  borderRadius:12, padding:'24px 20px' }}>
                <div style={{ fontSize:28, marginBottom:12 }}>{item.icon}</div>
                <h3 style={{ fontFamily:'Syne, sans-serif', fontSize:14, fontWeight:700,
                  color:'var(--text)', marginBottom:8, letterSpacing:1 }}>{item.title}</h3>
                <p style={{ fontSize:12, color:'var(--fog)', lineHeight:1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        {/* CTA */}
        <div style={{ textAlign:'center', padding:'40px 24px 80px' }}>
          <div className="fcard" style={{ maxWidth:500, margin:'0 auto', padding:0 }}>
            <div className="fcard-head">
              <span style={{ fontSize:11, letterSpacing:3, color:'var(--lime)' }}>// ready to build?</span>
            </div>
            <div style={{ padding:'32px 40px 36px' }}>
              <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:24, fontWeight:700,
                color:'var(--text)', marginBottom:12 }}>Start building today</h2>
              <p style={{ fontSize:13, color:'var(--fog)', marginBottom:28, lineHeight:1.6 }}>
                Free to use. No credit card required.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="proceed-btn"
                style={{ width:'100%', fontSize:13, padding:'12px' }}>
                Create Free Account →
              </button>
            </div>
          </div>
        </div>
        {/* Footer */}
        <footer style={{ textAlign:'center', padding:'24px', borderTop:'1px solid var(--line)',
          color:'var(--fog)', fontSize:11, letterSpacing:2 }}>
          SPECFORGE 2025 — SPEC-FIRST AI CODE GENERATION
        </footer>
      </div>
    </>
  )
}
