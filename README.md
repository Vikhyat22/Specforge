# SpecForge — Spec-First AI Code Generation

> From idea to production-ready code in minutes. SpecForge generates IEEE 830 Software Requirements Specs, Business Requirements Documents, and a complete 5-stage code pipeline — all from a single project description.

🌐 **Live Demo:** [specforge-two.vercel.app](https://specforge-two.vercel.app)

---

## What is SpecForge?

SpecForge is a spec-first AI code generation platform. Instead of jumping straight to code, it forces the right engineering discipline — write the spec first, then generate code from it.

**The flow:**

```
Project Description
       ↓
   SRS + BRD          ← AI-generated IEEE 830 spec documents
       ↓
5-Stage Code Pipeline ← Schema → Backend → Frontend → Components → Package
       ↓
  ZIP Download        ← Full project scaffold ready to deploy
       ↓
Live Preview          ← StackBlitz embed of actual generated React app
```

---

## Features

| Feature | Description |
|---|---|
| **AI Spec Generation** | IEEE 830 SRS and BRD generated via streaming SSE |
| **5-Stage Code Pipeline** | Sequential generation — each stage builds on the last |
| **ZIP Download** | Full project scaffold with server, client, schema, README |
| **Live Preview** | StackBlitz embed running the actual generated React code |
| **Provider Routing** | Swap AI providers via env var — Anthropic, Gemini, OpenRouter, OpenCode Go |
| **Auth** | JWT-based register/login with Supabase |
| **Dashboard** | Project management with status tracking |

---

## Tech Stack

### Frontend
- React 18 + Vite
- React Router v6
- Pure CSS design system (no Tailwind/shadcn)
- Fonts: JetBrains Mono, Syne, Fraunces

### Backend
- Node.js + Express
- Supabase (PostgreSQL via connection pooler)
- JWT authentication
- SSE streaming for real-time AI output

### AI Providers
- **Anthropic** — Claude models (recommended for best quality)
- **OpenRouter** — Multi-model routing
- **OpenCode Go** — MiniMax M2.5, Kimi K2.5, GLM-5
- **Gemini** — Google Gemini Flash

### Deployment
- Frontend: Vercel
- Backend: Railway (migrating to Render)
- Database: Supabase

---

## Project Structure

```
Specforge/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # JWT auth state
│   │   │   └── ToastContext.jsx # Toast notifications
│   │   ├── hooks/
│   │   │   └── useStream.js     # SSE streaming hook
│   │   └── pages/
│   │       ├── Landing.jsx      # Marketing landing page
│   │       ├── AuthPage.jsx     # Login / Register
│   │       ├── Dashboard.jsx    # Project list
│   │       ├── NewProject.jsx   # Project intake form
│   │       ├── SpecGen.jsx      # SRS + BRD generation (Step 2)
│   │       ├── CodeGen.jsx      # 5-stage code pipeline (Step 3)
│   │       └── PreviewPage.jsx  # StackBlitz live preview
│
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # Supabase pg pool
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.routes.js   # POST /api/auth/register|login
│   │   │   ├── projects.routes.js # CRUD + artifacts endpoint
│   │   │   ├── generate.routes.js # SRS, BRD, code, preview, ZIP
│   │   │   └── preview.routes.js  # Public HTML preview serve
│   │   └── services/
│   │       ├── ai.service.js       # Provider router
│   │       ├── prompts.service.js  # 5-stage code prompts
│   │       ├── zip.service.js      # JSZip project scaffold
│   │       └── providers/
│   │           ├── anthropic.js
│   │           ├── gemini.js
│   │           ├── openrouter.js
│   │           └── opencode.js
│   └── index.js
│
└── README.md
```

---

## Database Schema

Five tables in Supabase (PostgreSQL):

| Table | Purpose |
|---|---|
| `users` | Auth — email, password_hash, plan |
| `projects` | Project metadata — name, industry, type, status |
| `project_inputs` | Intake form data as JSONB |
| `specifications` | SRS + BRD content (TEXT) |
| `code_artifacts` | Generated code per stage + preview HTML |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- At least one AI provider API key

### 1. Clone the repo

```bash
git clone https://github.com/Vikhyat22/Specforge.git
cd Specforge
```

### 2. Set up the database

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  industry VARCHAR(100),
  project_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  srs_content TEXT,
  brd_content TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS code_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  artifact_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT code_artifacts_project_type_unique UNIQUE (project_id, artifact_type)
);
```

### 3. Configure the server

```bash
cd server
cp .env.example .env
```

Edit `.env`:

```env
PORT=5001
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-[region].pooler.supabase.com:5432/postgres
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# AI Provider — choose one as default
AI_PROVIDER=opencode   # anthropic | gemini | openrouter | opencode

# Add keys for whichever providers you want to use
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
OPENROUTER_API_KEY=sk-or-...
OPENCODE_GO_API_KEY=your_opencode_key
```

```bash
npm install
node index.js
# Server running on port 5001
```

### 4. Configure the client

```bash
cd ../client
```

Create `.env.local`:

```env
VITE_API_URL=http://localhost:5001
```

```bash
npm install
npm run dev
# Frontend running on http://localhost:5173
```

---

## AI Provider Switching

Switch providers by changing `AI_PROVIDER` in your `.env`:

| Provider | Value | Best For |
|---|---|---|
| Anthropic Claude | `anthropic` | Best quality, most reliable (recommended) |
| OpenCode Go MiniMax | `opencode` | Good quality, low cost via OpenCode subscription |
| OpenRouter | `openrouter` | Multi-model flexibility |
| Google Gemini | `gemini` | Fast, large context window |

**Recommended for production:** `AI_PROVIDER=anthropic` with Claude Haiku (~$0.015 per full generation)

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects/:id/inputs` | Save intake form data |
| GET | `/api/projects/:id/artifacts` | Get all code artifacts |

### Generation (SSE Streaming)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generate/srs` | Stream SRS generation |
| POST | `/api/generate/brd` | Stream BRD generation |
| POST | `/api/generate/code` | Stream code stage (1-5) |
| GET | `/api/generate/zip/:id` | Download project ZIP |

### Preview
| Method | Endpoint | Description |
|---|---|---|
| GET | `/preview/:projectId` | Serve generated HTML preview (public) |

---

## Deployment

### Frontend (Vercel)

1. Import GitHub repo to Vercel
2. Framework: Vite
3. Root directory: `client`
4. Add env var: `VITE_API_URL=https://your-backend-url`

### Backend (Railway / Render)

**Railway:**
1. New project → Deploy from GitHub
2. Root directory: `server`
3. Add all env vars from `.env`

**Render (free tier):**
1. New Web Service → connect GitHub repo
2. Root directory: `server`
3. Build: `npm install` | Start: `node index.js`
4. Add all env vars
5. Update `VITE_API_URL` in Vercel to new Render URL

> **Note:** Render free tier spins down after 15 min inactivity. Ping `/health` before demos. Use [UptimeRobot](https://uptimerobot.com) (free) to keep it warm.

---

## Design System

Pure CSS — no Tailwind, no component libraries.

**CSS Variables:**
```css
--ink: #0e0f13        /* Primary background */
--ink2: #181a21       /* Card background */
--ink3: #21242e       /* Elevated surface */
--lime: #c6f135       /* Primary accent */
--coral: #ff5e3a      /* Error */
--sky: #3d9bff        /* Info */
--text: #dde1ec       /* Primary text */
--fog: #5a6175        /* Secondary text */
```

**Fonts:**
- JetBrains Mono — body/code
- Syne — headings, nav, buttons
- Fraunces — hero display text

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: description"`
4. Push and open a PR

---

## Why SpecForge? — Our Core Value Proposition

Most AI code generators skip the most important step: **the spec**. They go from a vague prompt directly to code — and the code reflects that vagueness.

SpecForge is built on a different philosophy:

> **Bad specs produce bad code. Good specs produce good code. SpecForge enforces the spec first.**

### The Problem We Solve

| Traditional AI Codegen | SpecForge |
|---|---|
| Prompt → Code (vague, no structure) | Description → SRS → BRD → Code (structured) |
| No requirements documentation | IEEE 830 compliant SRS + BRD |
| Code doesn't map to business needs | Every code stage traces back to a functional requirement |
| Hard to hand off to a team | Full documentation ready for stakeholders |
| One-shot generation, no stages | Sequential 5-stage pipeline with context carry-over |

### Who Is This For?

- **Founders & indie hackers** — validate and scaffold MVPs in minutes, not weeks
- **Freelancers** — generate client-ready specs + code scaffolds from a brief
- **Dev agencies** — accelerate discovery and scoping phases
- **Students & hackathon teams** — go from idea to working prototype in one session
- **Product managers** — generate technical specs without writing a single line of code

---

## Applications & Use Cases

### 1. MVP Prototyping
Describe your startup idea. SpecForge generates a complete SRS, BRD, database schema, backend API, and React frontend — ready to deploy and demo to investors in under an hour.

### 2. Client Requirement Documentation
Agencies can use SpecForge to rapidly produce IEEE 830-compliant SRS and BRD documents from client briefs. Share the generated spec with the client for sign-off before a single line of code is written.

### 3. Hackathon Development
At hackathons, teams waste hours arguing about architecture and scope. SpecForge eliminates that — describe the project, generate the spec, run the pipeline, and start building on top of a working scaffold from minute one.

### 4. Technical Interview Prep
Generate fully documented CRUD applications across any domain (fintech, healthcare, e-commerce) with real schemas, API contracts, and React frontends — great for building a portfolio.

### 5. Learning Tool
Students can explore how professional software specifications are structured by generating SRS and BRD documents for projects they understand (a to-do app, a booking system, a social feed) and then seeing exactly how those specs translate into code.

### 6. Legacy System Documentation
Feed a description of an existing system into SpecForge to auto-generate missing SRS and BRD documentation — useful for teams inheriting undocumented codebases.

### 7. Domain-Specific Code Generation
SpecForge understands industry context. A "fintech customer portal" generates different schemas, terminology, and UI patterns than a "hospital patient management system" — because the spec drives everything.

---

## License

MIT

---

Built by [Vikhyat Gupta](https://github.com/Vikhyat22) & [Shray Patney](https://github.com/shray-092) · Powered by AI · [specforge-two.vercel.app](https://specforge-two.vercel.app)
