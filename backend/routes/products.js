const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadSingle } = require('../utils/multer');

const path = require('path');
const {
    fetchAllProducts,
    createNewProduct,
    updateProductDetails,
    fetchOneProduct,
    deleteProduct
} = require('../controllers/products')

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ msg: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ msg: err.message });
    } else if (err) {
        return res.status(400).json({ msg: err.message });
    }
    next();
};

router.route('/')
    .get(fetchAllProducts)
    .post(uploadSingle, handleMulterError, createNewProduct)

router.route('/:id')
    .get(fetchOneProduct)
    .put(uploadSingle, handleMulterError, updateProductDetails)
    .delete(deleteProduct)

module.exports = router;