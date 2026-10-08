const express = require('express')
const cors = require('cors')
const { CORS_ORIGINS } = require('./config/env')

const authRoutes = require('./modules/auth/auth.routes')
const expenseRoutes = require('./modules/expenses/expense.routes')
const budgetRoutes = require('./modules/budgets/budget.routes')
const categoryRoutes = require('./modules/categories/category.routes')
const adminRoutes = require('./modules/admin/admin.routes')

const app = express()

app.use(cors({
  origin: CORS_ORIGINS.split(','),
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/admin', adminRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

module.exports = app
