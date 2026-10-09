const prisma = require('../../config/prisma')

async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

module.exports = { listCategories }
