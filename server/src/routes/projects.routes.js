const { Router } = require('express');
const { query } = require('../config/db');
const authenticate = require('../middleware/auth');
const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ projects: rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, client_name, industry, project_type } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const { rows } = await query(
      'INSERT INTO projects (user_id, name, client_name, industry, project_type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.userId, name, client_name, industry, project_type]
    );
    res.status(201).json({ project: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.post('/:id/inputs', authenticate, async (req, res) => {
  try {
    const project_id = req.params.id;
    const form_data = req.body;
    const { rows: projectRows } = await query(
      'SELECT id FROM projects WHERE id=$1 AND user_id=$2',
      [project_id, req.user.userId]
    );
    if (!projectRows.length) return res.status(404).json({ error: 'Project not found' });
    const { rows } = await query(
      'INSERT INTO project_inputs (project_id, form_data) VALUES ($1,$2) ON CONFLICT (project_id) DO UPDATE SET form_data=$2, updated_at=NOW() RETURNING *',
      [project_id, form_data]
    );
    await query(
      "UPDATE projects SET status='wizard_complete', updated_at=NOW() WHERE id=$1",
      [project_id]
    );
    res.json({ inputs: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save inputs' });
  }
});

module.exports = router;
