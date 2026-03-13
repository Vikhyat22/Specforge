require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));

app.use(express.json());

const previewRoutes = require('./routes/preview.routes');
app.use('/preview', previewRoutes);

app.use('/api/auth', authRoutes);
const projectsRoutes = require('./routes/projects.routes');
app.use('/api/projects', projectsRoutes);
const generateRoutes = require('./routes/generate.routes');
app.use('/api/generate', generateRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
