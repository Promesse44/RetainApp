const prisma = require('../../config/prisma')

async function getBudget(req, res, next) {
  try {
    const { month } = req.params
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month must be in YYYY-MM format' })
    }

    const budget = await prisma.budget.findUnique({
      where: { userId_month: { userId: req.user.id, month } },
    })

    if (!budget) return res.json({ month, amount: 0, userId: req.user.id })
    res.json(budget)
  } catch (err) {
    next(err)
  }
}

async function upsertBudget(req, res, next) {
  try {
    const { month } = req.params
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month must be in YYYY-MM format' })
    }

    const { amount } = req.body
    if (amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'amount is required and must be a number' })
    }

    const budget = await prisma.budget.upsert({
      where: { userId_month: { userId: req.user.id, month } },
      update: { amount: parseFloat(amount) },
      create: { userId: req.user.id, month, amount: parseFloat(amount) },
    })
    res.json(budget)
  } catch (err) {
    next(err)
  }
}

async function listBudgets(req, res, next) {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id },
      orderBy: { month: 'desc' },
    })
    res.json(budgets)
  } catch (err) {
    next(err)
  }
}

module.exports = { getBudget, upsertBudget, listBudgets }
