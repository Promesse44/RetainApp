const router = require('express').Router()
const { listExpenses, getExpense, createExpense, updateExpense, deleteExpense, getDashboard } = require('./expense.controller')
const { authenticate } = require('../../middleware/auth')

router.use(authenticate)

router.get('/dashboard', getDashboard)
router.get('/', listExpenses)
router.get('/:id', getExpense)
router.post('/', createExpense)
router.put('/:id', updateExpense)
router.delete('/:id', deleteExpense)

module.exports = router
