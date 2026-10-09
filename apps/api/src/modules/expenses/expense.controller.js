const prisma = require('../../config/prisma')

async function listExpenses(req, res, next) {
  try {
    const userId = req.user.id
    const {
      search,
      categoryId,
      paymentMethod,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      sortBy = 'date',
      order = 'desc',
      page = '1',
      limit = '10',
    } = req.query

    const where = { userId }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }
    if (categoryId) where.categoryId = categoryId
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }
    if (amountMin || amountMax) {
      where.amount = {}
      if (amountMin) where.amount.gte = parseFloat(amountMin)
      if (amountMax) where.amount.lte = parseFloat(amountMax)
    }

    const validSortFields = { date: 'date', amount: 'amount', title: 'title', createdAt: 'createdAt' }
    const orderBy = { [validSortFields[sortBy] || 'date']: order === 'asc' ? 'asc' : 'desc' }

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.expense.count({ where }),
    ])

    res.json({
      data: expenses,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    })
  } catch (err) {
    next(err)
  }
}

async function getExpense(req, res, next) {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { category: { select: { id: true, name: true } } },
    })
    if (!expense) return res.status(404).json({ error: 'Expense not found' })
    res.json(expense)
  } catch (err) {
    next(err)
  }
}

async function createExpense(req, res, next) {
  try {
    const { title, amount, date, categoryId, paymentMethod, notes } = req.body
    if (!title || !amount || !date || !categoryId) {
      return res.status(400).json({ error: 'title, amount, date and categoryId are required' })
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) return res.status(400).json({ error: 'Invalid category' })

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        date: new Date(date),
        categoryId,
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || null,
        userId: req.user.id,
      },
      include: { category: { select: { id: true, name: true } } },
    })
    res.status(201).json(expense)
  } catch (err) {
    next(err)
  }
}

async function updateExpense(req, res, next) {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    })
    if (!existing) return res.status(404).json({ error: 'Expense not found' })

    const { title, amount, date, categoryId, paymentMethod, notes } = req.body

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!category) return res.status(400).json({ error: 'Invalid category' })
    }

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(categoryId && { categoryId }),
        ...(paymentMethod && { paymentMethod }),
        ...(notes !== undefined && { notes }),
      },
      include: { category: { select: { id: true, name: true } } },
    })
    res.json(expense)
  } catch (err) {
    next(err)
  }
}

async function deleteExpense(req, res, next) {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    })
    if (!existing) return res.status(404).json({ error: 'Expense not found' })

    await prisma.expense.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const [monthExpenses, budget, recentExpenses, allExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.budget.findUnique({ where: { userId_month: { userId, month } } }),
      prisma.expense.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.expense.findMany({ where: { userId } }),
    ])

    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const highestExpense = monthExpenses.reduce((max, e) => e.amount > (max?.amount || 0) ? e : max, null)

    const byCategory = monthExpenses.reduce((acc, e) => {
      const key = e.category.name
      acc[key] = (acc[key] || 0) + e.amount
      return acc
    }, {})

    const budgetAmount = budget?.amount || 0
    const remaining = budgetAmount - totalSpent
    let budgetStatus = 'no_budget'
    if (budgetAmount > 0) {
      const pct = totalSpent / budgetAmount
      if (pct >= 1) budgetStatus = 'over'
      else if (pct >= 0.8) budgetStatus = 'approaching'
      else budgetStatus = 'within'
    }

    res.json({
      month,
      totalSpent,
      budgetAmount,
      remaining,
      budgetStatus,
      highestExpense,
      spendingByCategory: byCategory,
      recentExpenses,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { listExpenses, getExpense, createExpense, updateExpense, deleteExpense, getDashboard }
