const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { generateToken, generateApiKey, requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /auth/register
 * Register a new caregiver account.
 * Body: { email, password, name }
 */
router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDb();

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.prepare(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
    ).run(id, email, passwordHash, name, 'caregiver');

    const token = generateToken({ id, email, name, role: 'caregiver' });

    res.status(201).json({
      message: 'Account created successfully',
      user: { id, email, name, role: 'caregiver' },
      token,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/login
 * Authenticate a caregiver and return a JWT.
 * Body: { email, password }
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /auth/me
 * Return the current user's info (requires auth).
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/**
 * POST /auth/generate-responder-key
 * Generate a new responder API key (admin/caregiver only).
 * Body: { name, agency? }
 */
router.post('/generate-responder-key', requireAuth, (req, res) => {
  try {
    const { name, agency } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const plainKey = generateApiKey(name, agency);

    res.status(201).json({
      message: 'Responder API key generated',
      api_key: plainKey,
      name,
      agency: agency || null,
    });
  } catch (err) {
    console.error('Generate key error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;