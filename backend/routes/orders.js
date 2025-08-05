const express = require('express');
const router = express.Router();
const path = require('path');
const { authorizeRoles, isAuthenticatedUser } = require('../middleware/authentication');
const {
    fetchAllOrder,
    updateOrderStatus,
    fetchOneOrder,
    fetchUserOrders
} = require('../controllers/order')

router.route('/')
    .get(isAuthenticatedUser, fetchAllOrder)

router.route('/:id')
    .get(isAuthenticatedUser, fetchOneOrder)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateOrderStatus)

router.get('/user/:id', isAuthenticatedUser, fetchUserOrders);
module.exports = router;
