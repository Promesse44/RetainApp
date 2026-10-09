const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../../config/prisma')
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = require('../../config/env')

function signAccess(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function signRefresh(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN })
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' })
    }
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ error: 'Email already in use' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    const payload = { id: user.id, email: user.email, role: user.role }
    res.status(201).json({
      user,
      accessToken: signAccess(payload),
      refreshToken: signRefresh(payload),
    })
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const payload = { id: user.id, email: user.email, role: user.role }
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      accessToken: signAccess(payload),
      refreshToken: signRefresh(payload),
    })
  } catch (err) {
    next(err)
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' })

    let payload
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user) return res.status(401).json({ error: 'User not found' })

    const newPayload = { id: user.id, email: user.email, role: user.role }
    res.json({ accessToken: signAccess(newPayload) })
  } catch (err) {
    next(err)
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, refresh, me }
