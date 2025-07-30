const express = require('express');
const router = express.Router();

const path = require('path');

const {
    fetchAllOrder,
    updateOrderStatus,
    fetchOneOrder,
} = require('../controllers/order')


router.route('/')
    .get(fetchAllOrder)

router.route('/:id')
    .get(fetchOneOrder)
    .put(updateOrderStatus)

module.exports = router;
