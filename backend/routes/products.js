const express = require('express');
const router = express.Router();
const { uploadItemImages, withMulter } = require('../utils/multer');

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
    .post(withMulter(uploadItemImages), createNewProduct)

router.route('/categories')
    .get(fetchAllCategories)

router.route('/:id')
    .get(fetchOneProduct)
    .put(withMulter(uploadItemImages), updateProductDetails)
    .delete(deleteProduct)

    
module.exports = router;