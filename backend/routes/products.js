const express = require('express');
const router = express.Router();
const { uploadItemImages, withMulter } = require('../utils/multer');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authentication')


const path = require('path');
const {
    fetchAllProducts,
    createNewProduct,
    updateProductDetails,
    fetchOneProduct,
    deleteProduct,
    fetchAllCategories
} = require('../controllers/products')

router.route('/')
    .get(fetchAllProducts)
    .post(withMulter(uploadItemImages), isAuthenticatedUser, authorizeRoles('admin'), createNewProduct)

router.route('/categories')
    .get(fetchAllCategories)

router.route('/:id')
    .get(fetchOneProduct)
    .put(withMulter(uploadItemImages), isAuthenticatedUser, authorizeRoles('admin'), updateProductDetails)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct)

    
module.exports = router;