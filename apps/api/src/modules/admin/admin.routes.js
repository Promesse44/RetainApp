const router = require('express').Router()
const { createCategory, updateCategory, deleteCategory, getInsights } = require('./admin.controller')
const { authenticate, requireAdmin } = require('../../middleware/auth')

router.use(authenticate, requireAdmin)

router.get('/insights', getInsights)
router.post('/categories', createCategory)
router.put('/categories/:id', updateCategory)
router.delete('/categories/:id', deleteCategory)

module.exports = router
