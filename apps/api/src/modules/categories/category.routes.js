const router = require('express').Router()
const { listCategories } = require('./category.controller')
const { authenticate } = require('../../middleware/auth')

router.get('/', authenticate, listCategories)

module.exports = router
