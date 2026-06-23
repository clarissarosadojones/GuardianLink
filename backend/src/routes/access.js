const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /access-logs
 * Log when a responder views a profile (for KPI tracking).
 * Can be called from the responder endpoint itself or explicitly.
 * Body: { device_serial, patient_id, responder_info? }
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const { device_serial, patient_id, responder_info } = req.body;

    if (!device_serial || !patient_id) {
      return res.status(400).json({ error: 'device_serial and patient_id are required' });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO responder_access_logs (id, device_serial, patient_id, responder_info, access_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      device_serial,
      patient_id,
      responder_info || JSON.stringify({ source: 'api', userId: req.user.sub }),
      req.body.access_type || 'api'
    );

    res.status(201).json({
      message: 'Access logged',
      log_id: id,
    });
  } catch (err) {
    console.error('Log access error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /access-logs
 * List access logs (for admin/reporting).
 * Supports ?device_serial= and ?limit= query params.
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);

    let logs;
    if (req.query.device_serial) {
      logs = db.prepare(
        'SELECT * FROM responder_access_logs WHERE device_serial = ? ORDER BY accessed_at DESC LIMIT ?'
      ).all(req.query.device_serial, limit);
    } else {
      logs = db.prepare(
        'SELECT * FROM responder_access_logs ORDER BY accessed_at DESC LIMIT ?'
      ).all(limit);
    }

    res.json({ logs, count: logs.length });
  } catch (err) {
    console.error('List logs error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /access-logs/stats
 * Return aggregate KPI stats.
 */
router.get('/stats', requireAuth, (req, res) => {
  try {
    const db = getDb();

    const totalAccesses = db.prepare('SELECT COUNT(*) as count FROM responder_access_logs').get();
    const uniqueDevices = db.prepare(
      'SELECT COUNT(DISTINCT device_serial) as count FROM responder_access_logs'
    ).get();
    const recentMonth = db.prepare(`
      SELECT COUNT(*) as count FROM responder_access_logs
      WHERE accessed_at >= datetime('now', '-30 days')
    `).get();

    // Per-device breakdown
    const byDevice = db.prepare(`
      SELECT device_serial, COUNT(*) as count, MAX(accessed_at) as last_access
      FROM responder_access_logs
      GROUP BY device_serial
      ORDER BY count DESC
    `).all();

    res.json({
      stats: {
        total_responder_accesses: totalAccesses.count,
        unique_devices_accessed: uniqueDevices.count,
        accesses_last_30_days: recentMonth.count,
      },
      by_device: byDevice,
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;