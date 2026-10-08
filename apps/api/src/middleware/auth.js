const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/env')

function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' })
  }
  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

module.exports = { authenticate, requireAdmin }
