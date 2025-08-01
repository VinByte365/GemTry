const express = require('express');
const router = express.Router();

const { uploadUserImage, withMulter } = require('../utils/multer');
const {
    fetchAllUser,
    createNewUser,
    updateUserDetails,
    fetchOneUser,
    deleteUser,
    BulkActionDelete,
    BulkActionStatus
} = require('../controllers/user');

// GET all users, POST new user (with optional image upload)
router.route('/')
    .get(fetchAllUser)
    .post(withMulter(uploadUserImage), createNewUser); // 🔧 Use multer middleware here

// Bulk actions
router.put('/bulk/status', BulkActionStatus);
router.delete('/bulk/delete', BulkActionDelete);

// Individual user operations
router.route('/:id')
    .get(fetchOneUser)
    .put(withMulter(uploadUserImage), updateUserDetails) // 🔧 Optional image update
    .delete(deleteUser);

module.exports = router;
