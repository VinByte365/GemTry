const express = require('express');
const router = express.Router();
const { authorizeRoles, isAuthenticatedUser } = require('../middleware/authentication');
const {
    getDashboardStats
} = require('../controllers/dashboard')

// Dashboard statistics route
router.get('/stats', isAuthenticatedUser, authorizeRoles('admin'), getDashboardStats);

module.exports = router;