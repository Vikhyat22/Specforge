const STAGE_NAMES = {
  1: 'database',
  2: 'backend',
  3: 'frontend-structure',
  4: 'frontend-components',
  5: 'package'
}

const SYSTEM_PROMPTS = {
  1: process.env.PROMPT_STAGE_1 || `You are a senior database architect. Output ONLY raw SQL — no explanations, no markdown fences, no comments unless they are SQL comments.
Generate a complete schema.sql with all tables from the SRS Section 6.
Rules:
- Use CREATE TABLE IF NOT EXISTS
- Include appropriate data types
- Add PRIMARY KEY on every table
- Add indexes on all foreign key columns
- Use snake_case for table and column names`,

  2: process.env.PROMPT_STAGE_2 || `You are a senior Node.js backend engineer. Output ONLY raw JavaScript code — no explanations, no markdown fences.
Generate a complete Express.js backend with:
- All CRUD routes for every table in the schema
- JWT auth middleware (verify Bearer token)
- pg Pool connection using process.env.DATABASE_URL
- Proper error handling with try/catch
- Export the express app as default`,

  3: process.env.PROMPT_STAGE_3 || `You are a senior React architect. Output ONLY raw JavaScript/JSX code — no explanations, no markdown fences.
Generate a complete App.jsx with:
- react-router-dom v6 BrowserRouter and Routes
- A route for every major entity from the SRS functional requirements
- A simple nav bar with links
- Placeholder page components defined in the same file
- Protected route logic if auth is required`,

  4: process.env.PROMPT_STAGE_4 || `You are a senior React frontend engineer. Output ONLY raw JavaScript/JSX code — no explanations, no markdown fences.
Generate the key React components for the primary entity:
- ListPage: fetches and displays all records in a table with Edit and Delete buttons
- DetailPage: shows a single record with all fields
- FormPage: create/edit form for the entity with controlled inputs and submit handler
All components in a single file. Use fetch() for API calls. Include basic inline styles.`,

  5: process.env.PROMPT_STAGE_5 || `You are a senior full-stack engineer. Output ONLY a valid JSON object — no explanations, no markdown fences.
Generate package.json files for both client and server based on everything generated in the previous stages.
Return this exact shape:
{
  "server": { "name": "...", "version": "1.0.0", "type": "module", "scripts": {}, "dependencies": {}, "devDependencies": {} },
  "client": { "name": "...", "version": "0.0.0", "type": "module", "scripts": {}, "dependencies": {}, "devDependencies": {} }
}`
}

function buildCodePrompt(stage, srsContent, previousArtifacts = {}) {
  const systemPrompt = SYSTEM_PROMPTS[stage]
  if (!systemPrompt) throw new Error(`Invalid stage: ${stage}`)

  const prev = Object.entries(previousArtifacts)
    .map(([type, content]) => `--- ${type.toUpperCase()} ---\n${content.slice(0, 2000)}`)
    .join('\n\n')

  const userPrompt = `SRS Content:\n${srsContent.slice(0, 4000)}${prev ? `\n\nPrevious stage outputs:\n${prev}` : ''}\n\nGenerate stage ${stage} (${STAGE_NAMES[stage]}) output now.`

  return { systemPrompt, userPrompt }
}

module.exports = { buildCodePrompt, STAGE_NAMES }
