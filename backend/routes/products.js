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





















// router.route('/:id')
// // Fetching Product based on ID
//     .get((req, res) => {
//     const id = parseInt(req.params.id);
//         db.query(`SELECT * FROM products WHERE id = ${id}`, (err, values) => {
//             if (err) {
//                 return console.error('Error: ', err);
//             }

//             if (product.id === id) {
//                 return res.json(values.filter((product) => product.id === id));
//             }

//             return res.status(404).json({msg: `ID: ${id} not found.`});
//             });
//     })
// // Update Product
//     .post((req, res) => {
//         const { name, description, price } = req.body;
        
//         if (!name || !price) {
//             return res.status(400).json({ msg: 'Name and Price are required.' });
//         }
//         const sql = 'INSERT INTO products (name, price, description, created_at) VALUES (?, ?, ?)';
        
//         db.query(sql, (err, result) => {
//             if (err) {
//                 console.error(err);
//                 return res.status(500).json({ msg: 'Internal Server Error', err });
//             }

//             return res.status(201).json({ msg: 'Product created successfully!', id: result.insertId })
//         })
    
//     })
// // Creating Product
//     .put((req, res) => { 

//     })
// // Deleting Product
//     .delete((req, res) => {

//     })

module.exports = router;