const db = require('../config/database');

exports.fetchAllProducts = (req, res) => {
    const sql = 'SELECT * FROM products';

    db.query(sql, (err, result, fields) => {
        if (err) {
            return console.error('Error: ', err) && res.status(500);
        }
        res.status(200).json(result);
    })
}

exports.createNewProduct = (req, res) => {
   const { name, description, price } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ msg: 'Name and Price are required.' });
        }
    
        const sql = 'INSERT INTO products (name, price, description, created_at) VALUES (?, ?, ?)';
        
        db.query(sql, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: 'Internal Server Error', err });
            }

            return res.status(201).json({ msg: 'Product created successfully!', id: result.insertId })
        })
    
    }

exports.fetchOneProduct = (req, res) => {
    const id = parseInt(req.params.id);
    const sql = `SELECT * FROM products WHERE id = ${id}`
    db.query(sql, (err, values) => {
        if (err) {
            return console.error('Error: ', err);
        };

        const oneProduct = values.find(product => product.id === id)

        if (!oneProduct) {
            return res.status(404).json({ msg: `ID: ${id} not found.` });
        }

        res.status(200).json({msg: `Product No. ${id} fetched.`})
    }
    )}

exports.deleteProduct = (req, res) => {

}

exports.updateProductDetails = (req, res) => {

}