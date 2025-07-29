const express = require('express');
const router = express.Router();

const path = require('path');
const {
    fetchAllUser,
    createNewUser,
    updateUserDetails,
    fetchOneUser,
    deleteUser
} = require('../controllers/user')


router.route('/')
    .get(fetchAllUser)
    .post(createNewUser)

router.route('/:id')
    .get(fetchOneUser)
    .put(updateUserDetails)
    .delete(deleteUser)

module.exports = router;