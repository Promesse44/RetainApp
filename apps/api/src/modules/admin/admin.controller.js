const prisma = require('../../config/prisma')

// ── Category management ──────────────────────────────────────────────────────

async function createCategory(req, res, next) {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const exists = await prisma.category.findUnique({ where: { name } })
    if (exists) return res.status(409).json({ error: 'Category already exists' })

    const category = await prisma.category.create({ data: { name } })
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
}

async function updateCategory(req, res, next) {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const existing = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Category not found' })
    if (existing.isDefault) return res.status(400).json({ error: 'Cannot rename the default category' })

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name },
    })
    res.json(category)
  } catch (err) {
    next(err)
  }
}

async function deleteCategory(req, res, next) {
  try {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Category not found' })
    if (existing.isDefault) return res.status(400).json({ error: 'Cannot delete the default category' })

    // Reassign expenses to the default (Uncategorized) category
    const defaultCat = await prisma.category.findFirst({ where: { isDefault: true } })
    if (defaultCat) {
      await prisma.expense.updateMany({
        where: { categoryId: req.params.id },
        data: { categoryId: defaultCat.id },
      })
    }

    await prisma.category.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// ── Platform insights ────────────────────────────────────────────────────────

async function getInsights(req, res, next) {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const [
      totalUsers,
      totalExpenses,
      totalValueAgg,
      monthExpensesCount,
      recentExpenses,
      recentUsers,
      allExpenses,
      categories,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.expense.count(),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.expense.count({ where: { date: { gte: monthStart, lte: monthEnd } } }),
      prisma.expense.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.expense.findMany({ include: { category: { select: { id: true, name: true } } } }),
      prisma.category.findMany(),
    ])

    // Spending per category
    const spendingByCategory = {}
    const usageByCategory = {}
    for (const e of allExpenses) {
      const name = e.category.name
      spendingByCategory[name] = (spendingByCategory[name] || 0) + e.amount
      usageByCategory[name] = (usageByCategory[name] || 0) + 1
    }

    const usageSorted = Object.entries(usageByCategory).sort((a, b) => b[1] - a[1])
    const top5 = usageSorted.slice(0, 5).map(([name, count]) => ({ name, count }))
    const bottom5 = usageSorted.slice(-5).reverse().map(([name, count]) => ({ name, count }))

    res.json({
      totalUsers,
      totalExpenses,
      totalValue: totalValueAgg._sum.amount || 0,
      monthExpensesCount,
      spendingByCategory,
      top5Categories: top5,
      bottom5Categories: bottom5,
      recentExpenses,
      recentUsers,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { createCategory, updateCategory, deleteCategory, getInsights }
