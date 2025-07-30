const db = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.fetchAllProducts = (req, res) => {
    const sql = `
        SELECT 
            i.item_id,
            i.item_name,
            i.item_price,
            i.item_desc,
            i.item_img,
            i.created_at,
            i.updated_at,
            c.category_name,
            COALESCE(s.qty, 0) as stock_qty
        FROM items i
        LEFT JOIN item_category ic ON i.item_id = ic.item_id
        LEFT JOIN categories c ON ic.category_id = c.category_id
        LEFT JOIN stocks s ON i.item_id = s.item_id
        WHERE i.deleted_at IS NULL
        ORDER BY i.item_id DESC
    `;

    db.execute(sql, (err, result, fields) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ msg: 'Error fetching products', error: err.message });
        }
        res.status(200).json(result);
    })
}

exports.createNewProduct = (req, res) => {
    const { name, description, price } = req.body;
        
    if (!name || !price) {
        return res.status(400).json({ msg: 'Name and Price are required.' });
    }

    // Handle file upload
    let imagePath = null;
    if (req.file) {
        imagePath = `storage/items/${req.file.filename}`;
    }
    
    const sql = 'INSERT INTO items (item_name, item_price, item_desc, item_img, created_at) VALUES (?, ?, ?, ?, NOW())';
    
    db.execute(sql, [name, price, description || '', imagePath], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ msg: 'Internal Server Error', err });
        }

        return res.status(201).json({ 
            msg: 'Product created successfully!', 
            id: result.insertId,
            image: imagePath 
        });
    });
}

exports.fetchOneProduct = (req, res) => {
    const id = parseInt(req.params.id);
    const sql = `
        SELECT 
            i.item_id,
            i.item_name,
            i.item_price,
            i.item_desc,
            i.item_img,
            i.created_at,
            i.updated_at,
            c.category_name,
            COALESCE(s.qty, 0) as stock_qty
        FROM items i
        LEFT JOIN item_category ic ON i.item_id = ic.item_id
        LEFT JOIN categories c ON ic.category_id = c.category_id
        LEFT JOIN stocks s ON i.item_id = s.item_id
        WHERE i.item_id = ? AND i.deleted_at IS NULL
    `;
    
    db.execute(sql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).json({ msg: 'Error fetching product', error: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({ msg: `Product with ID: ${id} not found.` });
        }

        res.status(200).json({ msg: `Product No. ${result[0].item_id} fetched.`, product: result[0] });
    });
}

exports.deleteProduct = (req, res) => {
    const id = parseInt(req.params.id);
    
    // First get the product to check if it exists and get image path
    const fetchSQL = `SELECT * FROM items WHERE item_id = ?`;
    
    db.execute(fetchSQL, [id], (err, result) => {
        if (err) {
            return console.error('Error: ', err);
        }

        if (result.length === 0) {
            return res.status(404).json({ msg: `Product with ID: ${id} not found.` });
        }

        const product = result[0];
        
        // Delete the image file if it exists
        if (product.item_img) {
            const imagePath = path.join(__dirname, '..', product.item_img);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const deleteSQL = `DELETE FROM items WHERE item_id = ?`;

        db.execute(deleteSQL, [id], (err, result) => {
            if (err) {
                return console.error('Error: ', err);
            }
            return res.json({ msg: 'Product successfully deleted.' });
        });
    });
}

exports.updateProductDetails = (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description, price } = req.body;
        
    if (!name || !price) {
        return res.status(400).json({ msg: 'Name and Price are required.' });
    }

    // First get the existing product to check if it exists and get current image
    const fetchSQL = `SELECT * FROM items WHERE item_id = ?`;
    
    db.execute(fetchSQL, [id], (err, result) => {
        if (err) {
            return console.error('Error: ', err);
        }

        if (result.length === 0) {
            return res.status(404).json({ msg: `Product with ID: ${id} not found.` });
        }

        const existingProduct = result[0];
        let imagePath = existingProduct.item_img;

        // Handle new file upload
        if (req.file) {
            // Delete old image if it exists
            if (existingProduct.item_img) {
                const oldImagePath = path.join(__dirname, '..', existingProduct.item_img);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            // Set new image path
            imagePath = `storage/items/${req.file.filename}`;
        }
    
        const updateSQL = `UPDATE items SET item_name = ?, item_price = ?, item_desc = ?, item_img = ?, updated_at = NOW() WHERE item_id = ?`;
        
        db.execute(updateSQL, [name, price, description || '', imagePath, id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: 'Internal Server Error', err });
            }

            return res.status(200).json({ 
                msg: 'Product updated successfully!', 
                id: id,
                image: imagePath 
            });
        });
    });
}
