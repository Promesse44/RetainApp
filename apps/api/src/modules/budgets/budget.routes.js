const router = require('express').Router()
const { getBudget, upsertBudget, listBudgets } = require('./budget.controller')
const { authenticate } = require('../../middleware/auth')

router.use(authenticate)

router.get('/', listBudgets)
router.get('/:month', getBudget)
router.put('/:month', upsertBudget)

module.exports = router
