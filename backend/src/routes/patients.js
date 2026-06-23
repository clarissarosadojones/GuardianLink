const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth, requireAuthOrResponder } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper: parse a JSON string column, defaulting to [].
 */
function parseJsonArray(val) {
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

/**
 * Helper: serialize an array to a JSON string.
 */
function serializeJsonArray(val) {
  if (!val) return '[]';
  return JSON.stringify(val);
}

/**
 * GET /patients
 * List all patients for the authenticated caregiver.
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const patients = db.prepare(
      'SELECT * FROM patients WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.sub);

    const parsed = patients.map((p) => ({
      ...p,
      conditions: parseJsonArray(p.conditions),
      medications: parseJsonArray(p.medications),
      allergies: parseJsonArray(p.allergies),
      emergency_contacts: parseJsonArray(p.emergency_contacts),
    }));

    res.json({ patients: parsed });
  } catch (err) {
    console.error('List patients error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /patients
 * Create a new patient profile.
 * Body: { name, photo_url?, date_of_birth?, conditions?, medications?, allergies?, emergency_contacts?, notes? }
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      name,
      photo_url,
      date_of_birth,
      conditions,
      medications,
      allergies,
      emergency_contacts,
      notes,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO patients (id, user_id, name, photo_url, date_of_birth, conditions, medications, allergies, emergency_contacts, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user.sub,
      name,
      photo_url || null,
      date_of_birth || null,
      serializeJsonArray(conditions),
      serializeJsonArray(medications),
      serializeJsonArray(allergies),
      serializeJsonArray(emergency_contacts),
      notes || null
    );

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);

    res.status(201).json({
      message: 'Patient created',
      patient: {
        ...patient,
        conditions: parseJsonArray(patient.conditions),
        medications: parseJsonArray(patient.medications),
        allergies: parseJsonArray(patient.allergies),
        emergency_contacts: parseJsonArray(patient.emergency_contacts),
      },
    });
  } catch (err) {
    console.error('Create patient error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /patients/:id
 * Get a specific patient's full profile.
 * Requires caregiver auth OR responder auth.
 */
router.get('/:id', requireAuthOrResponder, (req, res) => {
  try {
    const db = getDb();
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // If logged in as a caregiver, verify ownership
    if (req.authType === 'user' && patient.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to view this patient' });
    }

    res.json({
      patient: {
        ...patient,
        conditions: parseJsonArray(patient.conditions),
        medications: parseJsonArray(patient.medications),
        allergies: parseJsonArray(patient.allergies),
        emergency_contacts: parseJsonArray(patient.emergency_contacts),
      },
    });
  } catch (err) {
    console.error('Get patient error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /patients/by-device/:serial
 * First responder endpoint: given a tracker serial number, return the patient's
 * emergency medical profile.
 * Requires responder API key or caregiver auth.
 */
router.get('/by-device/:serial', requireAuthOrResponder, (req, res) => {
  try {
    const db = getDb();
    const device = db.prepare(
      'SELECT * FROM devices WHERE serial_number = ? AND status = ?'
    ).get(req.params.serial, 'active');

    if (!device) {
      return res.status(404).json({ error: 'No active device found with that serial number' });
    }

    if (!device.patient_id) {
      return res.status(404).json({ error: 'Device is not paired with a patient' });
    }

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(device.patient_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found for this device' });
    }

    // Log the access
    const logId = uuidv4();
    const responderInfo = req.responder
      ? JSON.stringify({ name: req.responder.name, agency: req.responder.agency })
      : JSON.stringify({ type: 'caregiver', userId: req.user?.sub });

    db.prepare(`
      INSERT INTO responder_access_logs (id, device_serial, patient_id, responder_info, access_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(logId, req.params.serial, patient.id, responderInfo, req.authType === 'responder' ? 'responder_api' : 'caregiver_view');

    res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        photo_url: patient.photo_url,
        date_of_birth: patient.date_of_birth,
        conditions: parseJsonArray(patient.conditions),
        medications: parseJsonArray(patient.medications),
        allergies: parseJsonArray(patient.allergies),
        emergency_contacts: parseJsonArray(patient.emergency_contacts),
        notes: patient.notes,
      },
      accessed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Device lookup error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /patients/:id
 * Update a patient's profile. Only the owning caregiver can update.
 */
router.put('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to update this patient' });
    }

    const {
      name,
      photo_url,
      date_of_birth,
      conditions,
      medications,
      allergies,
      emergency_contacts,
      notes,
    } = req.body;

    db.prepare(`
      UPDATE patients SET
        name = COALESCE(?, name),
        photo_url = COALESCE(?, photo_url),
        date_of_birth = COALESCE(?, date_of_birth),
        conditions = COALESCE(?, conditions),
        medications = COALESCE(?, medications),
        allergies = COALESCE(?, allergies),
        emergency_contacts = COALESCE(?, emergency_contacts),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name || null,
      photo_url !== undefined ? photo_url : null,
      date_of_birth !== undefined ? date_of_birth : null,
      conditions ? serializeJsonArray(conditions) : null,
      medications ? serializeJsonArray(medications) : null,
      allergies ? serializeJsonArray(allergies) : null,
      emergency_contacts ? serializeJsonArray(emergency_contacts) : null,
      notes !== undefined ? notes : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);

    res.json({
      message: 'Patient updated',
      patient: {
        ...updated,
        conditions: parseJsonArray(updated.conditions),
        medications: parseJsonArray(updated.medications),
        allergies: parseJsonArray(updated.allergies),
        emergency_contacts: parseJsonArray(updated.emergency_contacts),
      },
    });
  } catch (err) {
    console.error('Update patient error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /patients/:id
 * Delete a patient profile. Only the owning caregiver can delete.
 */
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized to delete this patient' });
    }

    // Unpair any devices linked to this patient
    db.prepare('UPDATE devices SET patient_id = NULL, status = ? WHERE patient_id = ?')
      .run('inactive', req.params.id);

    db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);

    res.json({ message: 'Patient deleted' });
  } catch (err) {
    console.error('Delete patient error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;