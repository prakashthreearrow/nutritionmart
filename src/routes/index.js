const router = require('express').Router()
const adminRoute = require('./admin/admin')
const apiRoute = require('./api')

// Admin router
router.use('/admin', adminRoute)
router.use('/api', apiRoute)
module.exports = router
