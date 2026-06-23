const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, closeDb } = require('./db');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const deviceRoutes = require('./routes/devices');
const accessLogRoutes = require('./routes/access');

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Request logging ────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  try {
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      users_count: count.count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── API Routes ─────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);
app.use('/devices', deviceRoutes);
app.use('/access-logs', accessLogRoutes);

// ── 404 handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ───────────────────────────────────────────
const server = app.listen(PORT, HOST, () => {
  // Initialize database tables on startup
  getDb();
  console.log(`GuardianLink API running at http://${HOST}:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// ── Graceful shutdown ──────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  closeDb();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  closeDb();
  server.close(() => process.exit(0));
});

module.exports = app;