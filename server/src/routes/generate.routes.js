const { Router } = require('express');
const { query } = require('../config/db');
const authenticate = require('../middleware/auth');
const { streamCompletion } = require('../services/ai.service');
const { buildCodePrompt } = require('../services/prompts.service');
const { buildProjectZip } = require('../services/zip.service');

const router = Router();

router.post('/srs', authenticate, async (req, res) => {
  const { project_id } = req.body;

  // 1. Verify project belongs to user and fetch form_data
  let project;
  try {
    const { rows } = await query(
      `SELECT p.*, pi.form_data
       FROM projects p
       LEFT JOIN project_inputs pi ON pi.project_id = p.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [project_id, req.user.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    project = rows[0];
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }

  const form_data = project.form_data || {};

  // 2. Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // 3. Handle client disconnect
  req.on('close', () => {});

  // 4. Build prompts
  const systemPrompt = `You are SpecForge, an expert software architect. Generate a complete, \
professional Software Requirements Specification (SRS) document in IEEE 830 format.
Include these sections:
1. Introduction (purpose, scope, definitions)
2. Overall Description (product perspective, functions, users)
3. Functional Requirements (use FR-XXX-001 format, be specific to the domain)
4. Non-Functional Requirements (performance, security, scalability)
5. System Architecture (tech stack, deployment)
6. Database Schema (all tables with columns and data types)
7. API Contracts (all REST endpoints)
8. Acceptance Criteria
Be specific to the industry and project type. Use the exact terminology of the domain.
Format as clean markdown.`;

  const userPrompt = `Generate a complete SRS for the following project:
Project Name: ${project.name}
Client: ${project.client_name || ''}
Industry: ${project.industry || form_data.industry || ''}
Project Type: ${project.project_type || ''}
Description: ${form_data.description || form_data.desc || ''}
Primary Users: ${form_data.primary_users || form_data.users || ''}
Features: ${Array.isArray(form_data.features) ? form_data.features.join(', ') : (form_data.features || form_data.core_features || '')}
Timeline: ${form_data.timeline || ''}
Additional requirements: ${JSON.stringify(form_data)}`;

  // 5. Stream
  let accumulated = '';

  streamCompletion(
    systemPrompt,
    userPrompt,
    // onChunk
    (chunk) => {
      accumulated += chunk;
      res.write('data: ' + JSON.stringify({ type: 'chunk', text: chunk }) + '\n\n');
    },
    // onDone
    async () => {
      try {
        await query(
          `INSERT INTO specifications (project_id, srs_content)
           VALUES ($1, $2)
           ON CONFLICT (project_id) DO UPDATE SET srs_content = $2, updated_at = NOW()`,
          [project_id, accumulated]
        );
      } catch (err) {
        // Non-fatal — stream already delivered; log and continue
        console.error('Failed to save SRS to DB:', err.message);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    },
    // onError
    (errMsg) => {
      res.write('data: ' + JSON.stringify({ type: 'error', message: errMsg }) + '\n\n');
      res.end();
    }
  );
});

router.post('/brd', authenticate, async (req, res) => {
  const { project_id } = req.body;

  // 1. Verify project belongs to user and fetch SRS
  let project;
  try {
    const { rows } = await query(
      `SELECT p.*, pi.form_data, sp.srs_content
       FROM projects p
       LEFT JOIN project_inputs pi ON pi.project_id = p.id
       LEFT JOIN specifications sp ON sp.project_id = p.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [project_id, req.user.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    project = rows[0];
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }

  if (!project.srs_content) {
    return res.status(400).json({ error: 'Generate SRS first' });
  }

  const form_data = project.form_data || {};

  // 2. Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // 3. Handle client disconnect
  req.on('close', () => {});

  // 4. Build prompts
  const systemPrompt = `You are SpecForge, an expert business analyst. Generate a complete, \
professional Business Requirements Document (BRD) that complements the provided SRS. \
Include these sections:
1. Executive Summary (business problem, proposed solution)
2. Business Objectives (SMART goals, KPIs)
3. Stakeholder Analysis (roles, responsibilities, interests)
4. Current State vs Future State
5. Use Cases (detailed scenarios for each user type)
6. Business Rules and Constraints
7. Risk Register (risks, probability, impact, mitigation)
8. Project Timeline and Milestones
9. Budget Considerations
10. Sign-off and Approval Block
Be specific to the industry. Use business language, not technical jargon.
Format as clean markdown.`;

  const userPrompt = `Generate a BRD for this project. The SRS has already been written — \
make the BRD complementary, not repetitive.

Project: ${project.name}, Client: ${project.client_name || ''}, Industry: ${project.industry || form_data.industry || ''}

SRS Summary (use this as context):
${project.srs_content.slice(0, 3000)}

Full form data: ${JSON.stringify(form_data)}`;

  // 5. Stream
  let accumulated = '';

  streamCompletion(
    systemPrompt,
    userPrompt,
    // onChunk
    (chunk) => {
      accumulated += chunk;
      res.write('data: ' + JSON.stringify({ type: 'chunk', text: chunk }) + '\n\n');
    },
    // onDone
    async () => {
      try {
        await query(
          `UPDATE specifications SET brd_content = $1, updated_at = NOW()
           WHERE project_id = $2`,
          [accumulated, project_id]
        );
      } catch (err) {
        console.error('Failed to save BRD to DB:', err.message);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    },
    // onError
    (errMsg) => {
      res.write('data: ' + JSON.stringify({ type: 'error', message: errMsg }) + '\n\n');
      res.end();
    }
  );
});

router.post('/code', authenticate, async (req, res) => {
  const { project_id, stage } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  if (!stage || stage < 1 || stage > 5) return res.status(400).json({ error: 'stage must be 1-5' });

  const STAGE_NAMES = { 1: 'database', 2: 'backend', 3: 'frontend-structure', 4: 'frontend-components', 5: 'package' };

  try {
    // verify ownership + get SRS
    const specRes = await query(
      `SELECT s.srs_content FROM specifications s
       JOIN projects p ON p.id = s.project_id
       WHERE s.project_id = $1 AND p.user_id = $2`,
      [project_id, req.user.userId]
    );
    if (!specRes.rows.length) return res.status(404).json({ error: 'Project not found' });
    const { srs_content } = specRes.rows[0];
    if (!srs_content) return res.status(400).json({ error: 'Generate SRS first' });

    // get previous artifacts
    const artifactsRes = await query(
      'SELECT artifact_type, content FROM code_artifacts WHERE project_id = $1',
      [project_id]
    );
    const previousArtifacts = {};
    artifactsRes.rows.forEach(r => { previousArtifacts[r.artifact_type] = r.content; });

    const { systemPrompt, userPrompt } = buildCodePrompt(stage, srs_content, previousArtifacts);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let fullText = '';

    streamCompletion(
      systemPrompt,
      userPrompt,
      // onChunk
      (chunk) => {
        fullText += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      },
      // onDone
      async () => {
        const artifactType = STAGE_NAMES[stage];
        try {
          await query(
            `INSERT INTO code_artifacts (project_id, artifact_type, content)
             VALUES ($1, $2, $3)
             ON CONFLICT (project_id, artifact_type) DO UPDATE SET content = $3`,
            [project_id, artifactType, fullText]
          );
        } catch (err) {
          console.error('Failed to save code artifact to DB:', err.message);
        }
        res.write(`data: ${JSON.stringify({ type: 'done', stage, artifactType })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
      // onError
      (errMsg) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    );
  } catch (err) {
    if (!res.headersSent) return res.status(500).json({ error: err.message });
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

router.post('/preview', authenticate, async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });

  try {
    // verify ownership + get SRS
    const specRes = await query(
      `SELECT s.srs_content, p.name, p.industry, p.project_type
       FROM specifications s
       JOIN projects p ON p.id = s.project_id
       WHERE s.project_id = $1 AND p.user_id = $2`,
      [project_id, req.user.userId]
    );
    if (!specRes.rows.length) return res.status(404).json({ error: 'Project not found' });
    const { srs_content, name, industry, project_type } = specRes.rows[0];
    if (!srs_content) return res.status(400).json({ error: 'Generate SRS first' });

    // get all code artifacts
    const artifactsRes = await query(
      'SELECT artifact_type, content FROM code_artifacts WHERE project_id = $1',
      [project_id]
    );
    const artifacts = {};
    artifactsRes.rows.forEach(r => { artifacts[r.artifact_type] = r.content; });

    const systemPrompt = `You are a senior frontend engineer. Output a SINGLE complete HTML file. All CSS and JS must be inline. One Google Fonts link is allowed.
CRITICAL RULES — follow every single one:
1. Your response must begin with exactly <!DOCTYPE html> — no text before it, no code fences, no markdown
2. All data must use an in-memory MockAPI: const STORE = { users: [...], accounts: [...], transactions: [...] } pre-seeded with 8 realistic domain-specific records
3. Show a login screen first with demo credentials: demo@${industry || 'app'}.app / demo123
4. After login, render a dashboard with sidebar navigation
5. Use hash routing: window.addEventListener('hashchange', render) — call render() immediately on page load with: render(window.location.hash || '#/dashboard')
6. The render function must use a switch statement on the current hash and call renderDashboard(), renderList(), renderForm() etc
7. Every nav link must use href="#/route" format
8. CRUD: create adds to STORE and re-renders, edit updates STORE, delete removes with confirm() and re-renders
9. Pre-seed demo data with realistic ${industry || 'fintech'} terminology — no John Doe, no example.com
10. Apply ${industry || 'fintech'}-appropriate color scheme
11. No broken buttons — every button must do something
12. Use document.getElementById('app').innerHTML = html pattern for rendering
13. The very last line of your script must be: render(window.location.hash || '#/dashboard');
14. Every function called from onclick= attributes must be defined as window.functionName = function() {} — never as const or let or inside another function
15. The #app div must exist in the HTML body BEFORE any script runs: <body><div id="app"></div><script>...</script></body>
16. NEVER use document.getElementById('app').innerHTML += to append modals. Instead put the modal HTML directly inside each page's HTML string as a hidden div, shown/hidden via display style
17. Hash routing: window.location.hash values will be '#/dashboard', '#/login' etc WITH the slash — always include the slash in case statements: case '#/dashboard': not case 'dashboard':
18. Do NOT run any code between defining functions and calling render() at the bottom — define all functions first, then call render() as the very last line`;

    const artifactSummary = Object.entries(artifacts)
      .map(([type, content]) => `--- ${type.toUpperCase()} ---\n${content.slice(0, 1000)}`)
      .join('\n\n');

    const userPrompt = `Project: ${name}
Industry: ${industry || 'general'}
Type: ${project_type || 'web app'}
SRS (first 4000 chars):
${srs_content.slice(0, 4000)}
${artifactSummary ? `Code artifacts (summaries):\n${artifactSummary}` : ''}
Generate the complete single-file HTML preview now.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let fullText = '';

    streamCompletion(
      systemPrompt,
      userPrompt,
      // onChunk
      (chunk) => {
        fullText += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      },
      // onDone
      async () => {
        try {
          // strip any text before <!DOCTYPE html>
          const doctypeIdx = fullText.indexOf('<!DOCTYPE html>')
          const cleanHtml = doctypeIdx >= 0 ? fullText.slice(doctypeIdx) : fullText
          await query(
            `INSERT INTO code_artifacts (project_id, artifact_type, content)
             VALUES ($1, $2, $3)
             ON CONFLICT (project_id, artifact_type) DO UPDATE SET content = $3`,
            [project_id, 'preview', cleanHtml]
          );
        } catch (err) {
          console.error('Failed to save preview artifact to DB:', err.message);
        }
        res.write(`data: ${JSON.stringify({ type: 'done', artifactType: 'preview' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
      // onError
      (errMsg) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    );
  } catch (err) {
    if (!res.headersSent) return res.status(500).json({ error: err.message });
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

router.get('/zip/:project_id', authenticate, async (req, res) => {
  const { project_id } = req.params
  try {
    const projRes = await query(
      'SELECT name FROM projects WHERE id = $1 AND user_id = $2',
      [project_id, req.user.userId]
    )
    if (!projRes.rows.length) return res.status(404).json({ error: 'Project not found' })
    const { name } = projRes.rows[0]
    const artifactsRes = await query(
      'SELECT artifact_type, content FROM code_artifacts WHERE project_id = $1',
      [project_id]
    )
    const artifacts = {}
    artifactsRes.rows.forEach(r => { artifacts[r.artifact_type] = r.content })
    const required = ['database', 'backend', 'frontend-structure', 'frontend-components', 'package']
    const missing = required.filter(s => !artifacts[s])
    if (missing.length) {
      return res.status(400).json({ error: 'Generate all 5 code stages first', missing })
    }
    const zipBuffer = await buildProjectZip(name, artifacts)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`)
    res.send(zipBuffer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router;
