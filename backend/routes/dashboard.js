const express = require('express');
const router = express.Router();

const path = require('path');

const {
    totalItem
} = require('../controllers/dashboard')

//Routes
router.route('/')
    .get(totalItem);

module.exports = router;