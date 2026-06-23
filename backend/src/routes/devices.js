const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /devices
 * List all devices. Caregivers see devices for their patients.
 * Admins see all devices.
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    let devices;

    if (req.user.role === 'admin') {
      devices = db.prepare('SELECT * FROM devices ORDER BY created_at DESC').all();
    } else {
      // Get devices linked to this caregiver's patients
      devices = db.prepare(`
        SELECT d.* FROM devices d
        LEFT JOIN patients p ON d.patient_id = p.id
        WHERE p.user_id = ? OR d.patient_id IS NULL
        ORDER BY d.created_at DESC
      `).all(req.user.sub);
    }

    res.json({ devices });
  } catch (err) {
    console.error('List devices error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /devices/register
 * Register a new tracker device (before pairing).
 * Body: { serial_number }
 */
router.post('/register', requireAuth, (req, res) => {
  try {
    const { serial_number } = req.body;

    if (!serial_number) {
      return res.status(400).json({ error: 'serial_number is required' });
    }

    const db = getDb();

    // Check if serial already exists
    const existing = db.prepare('SELECT id FROM devices WHERE serial_number = ?').get(serial_number);
    if (existing) {
      return res.status(409).json({ error: 'Device with this serial number already registered' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO devices (id, serial_number, status) VALUES (?, ?, ?)'
    ).run(id, serial_number, 'inactive');

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);

    res.status(201).json({
      message: 'Device registered',
      device,
    });
  } catch (err) {
    console.error('Register device error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /devices/pair
 * Link a tracker serial number to a patient (caregiver).
 * Body: { serial_number, patient_id }
 */
router.post('/pair', requireAuth, (req, res) => {
  try {
    const { serial_number, patient_id } = req.body;

    if (!serial_number || !patient_id) {
      return res.status(400).json({ error: 'serial_number and patient_id are required' });
    }

    const db = getDb();

    // Verify the patient belongs to this caregiver
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patient_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (patient.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to pair devices with this patient' });
    }

    // Find the device
    const device = db.prepare('SELECT * FROM devices WHERE serial_number = ?').get(serial_number);
    if (!device) {
      return res.status(404).json({ error: 'Device not found. Register it first.' });
    }

    // If device is already paired to a different patient, unpair it first
    if (device.patient_id && device.patient_id !== patient_id) {
      db.prepare('UPDATE devices SET patient_id = NULL, status = ? WHERE id = ?')
        .run('inactive', device.id);
    }

    // Pair the device
    db.prepare('UPDATE devices SET patient_id = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(patient_id, 'active', device.id);

    const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(device.id);

    res.json({
      message: 'Device paired successfully',
      device: updated,
    });
  } catch (err) {
    console.error('Pair device error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /devices/unpair
 * Unlink a tracker from its patient.
 * Body: { serial_number }
 */
router.post('/unpair', requireAuth, (req, res) => {
  try {
    const { serial_number } = req.body;

    if (!serial_number) {
      return res.status(400).json({ error: 'serial_number is required' });
    }

    const db = getDb();
    const device = db.prepare('SELECT * FROM devices WHERE serial_number = ?').get(serial_number);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // If device is paired, verify the caregiver owns the patient
    if (device.patient_id) {
      const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(device.patient_id);
      if (patient && patient.user_id !== req.user.sub) {
        return res.status(403).json({ error: 'Not authorized to unpair this device' });
      }
    }

    db.prepare('UPDATE devices SET patient_id = NULL, status = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run('inactive', device.id);

    res.json({
      message: 'Device unpaired successfully',
      device: db.prepare('SELECT * FROM devices WHERE id = ?').get(device.id),
    });
  } catch (err) {
    console.error('Unpair device error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /patients/:patientId/devices
 * List all trackers for a specific patient.
 */
router.get('/patient/:patientId', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.patientId);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const devices = db.prepare(
      'SELECT * FROM devices WHERE patient_id = ? ORDER BY created_at DESC'
    ).all(req.params.patientId);

    res.json({ devices });
  } catch (err) {
    console.error('List patient devices error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;