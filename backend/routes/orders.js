const express = require('express');
const router = express.Router();

const path = require('path');

const {
    fetchAllOrder,
    updateOrderStatus,
} = require('../controllers/order')


router.route('/')
    .get(fetchAllOrder)

router.route('/:id')
    .put(updateOrderStatus)

module.exports = router;
