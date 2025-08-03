const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authentication');
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
    .get(isAuthenticatedUser, authorizeRoles('admin'),fetchAllUser)
    .post(withMulter(uploadUserImage), isAuthenticatedUser, authorizeRoles('admin'), createNewUser);

// Bulk actions
router.put('/bulk/status', BulkActionStatus);
router.delete('/bulk/delete', BulkActionDelete);

// Individual user operations
router.route('/:id')
    .get(fetchOneUser)
    .put(withMulter(uploadUserImage),isAuthenticatedUser, authorizeRoles('admin'), updateUserDetails)
    .delete(isAuthenticatedUser, authorizeRoles('admin'),deleteUser);

module.exports = router;
