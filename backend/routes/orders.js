const express = require('express');
const router = express.Router();
const path = require('path');
const { authorizeRoles, isAuthenticatedUser } = require('../middleware/authentication');
const {
    fetchAllOrder,
    updateOrderStatus,
    fetchOneOrder,
} = require('../controllers/order')


router.route('/')
    .get(isAuthenticatedUser, authorizeRoles('admin'), fetchAllOrder)

router.route('/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), fetchOneOrder)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateOrderStatus)

module.exports = router;
