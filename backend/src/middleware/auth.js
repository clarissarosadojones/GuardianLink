const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'guardianlink-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hash a responder API key for storage.
 */
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify a plaintext API key against stored hashes.
 */
function verifyApiKey(plainKey) {
  const db = getDb();
  const keyHash = hashApiKey(plainKey);
  const row = db.prepare(
    'SELECT id, name, agency FROM responder_api_keys WHERE key_hash = ? AND active = 1'
  ).get(keyHash);
  return row || null;
}

/**
 * Generate a fresh responder API key (returns plaintext + stored hash).
 */
function generateApiKey(name, agency) {
  const { v4: uuidv4 } = require('uuid');
  const plainKey = 'gl_responder_' + crypto.randomBytes(24).toString('hex');
  const keyHash = hashApiKey(plainKey);
  const db = getDb();
  db.prepare(
    'INSERT INTO responder_api_keys (id, key_hash, name, agency) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), keyHash, name, agency || null);
  return plainKey;
}

/**
 * Generate a JWT token for a user.
 */
function generateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Middleware: require a valid caregiver JWT.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: allow either a caregiver JWT OR a responder API key.
 * Responder gets limited read-only scope.
 */
function requireAuthOrResponder(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  // Try JWT first (caregiver)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    // Check if it's a responder API key (starts with gl_responder_)
    if (token.startsWith('gl_responder_')) {
      const apiKeyData = verifyApiKey(token);
      if (!apiKeyData) {
        return res.status(401).json({ error: 'Invalid responder API key' });
      }
      req.responder = apiKeyData;
      req.authType = 'responder';
      return next();
    }

    // Otherwise, treat as JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.authType = 'user';
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  return res.status(401).json({ error: 'Invalid authorization type' });
}

module.exports = {
  requireAuth,
  requireAuthOrResponder,
  generateToken,
  generateApiKey,
  verifyApiKey,
  hashApiKey,
  JWT_SECRET,
};