const express = require('express');
const router = express.Router();

const path = require('path');
const {
    fetchAllProducts,
    createNewProduct,
    updateProductDetails,
    fetchOneProduct,
    deleteProduct
} = require('../controllers/products')




router.route('/')
    .get(fetchAllProducts)
    .post(createNewProduct)

router.route('/:id')
    .get(fetchOneProduct)
    .put(updateProductDetails)
    .delete(deleteProduct)

module.exports = router;