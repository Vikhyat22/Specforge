const express = require('express')
const { query } = require('../config/db')
const router = express.Router()

router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params
  try {
    const result = await query(
      `SELECT content FROM code_artifacts WHERE project_id = $1 AND artifact_type = 'preview'`,
      [projectId]
    )
    if (!result.rows.length) {
      return res.status(404).send(`<!DOCTYPE html>
<html>
<head><title>Preview Not Found</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0e0f13;color:#dde1ec;}
.box{text-align:center;}.title{font-size:24px;margin-bottom:8px;}.sub{color:#5a6175;font-size:14px;}</style>
</head>
<body><div class="box"><div class="title">Preview Not Found</div><div class="sub">No preview has been generated for this project yet.</div></div></body>
</html>`)
    }
    res.setHeader('Content-Type', 'text/html')
    res.send(result.rows[0].content)
  } catch (err) {
    res.status(500).send('Server error')
  }
})

module.exports = router
