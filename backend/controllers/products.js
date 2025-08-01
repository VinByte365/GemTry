const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const config = require('../config/server');

// Helper function to get category ID by name
async function getCategoryNameById(categoryId) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT category_name FROM categories WHERE category_id = ?';
        db.execute(sql, [categoryId], (err, results) => {
            if (err) return reject(err);
            if (results.length === 0) return resolve(null);
            resolve(results[0].category_name);
        });
    });
}

// Helper function to create a new category
async function createCategory(categoryName) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO categories (category_name) VALUES (?)';
        db.execute(sql, [categoryName], (err, result) => {
            if (err) return reject(err);
            resolve(result.insertId);
        });
    });
}

// Fetch all categories
exports.fetchAllCategories = (req, res) => {
    const sql = 'SELECT * FROM categories ORDER BY category_id ASC';
    db.execute(sql, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ msg: 'Error fetching categories', error: err.message });
        }
        res.status(200).json(results);
    });
};

// Fetch all products with their categories and stock
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
            c.category_id,
            c.category_name,
            COALESCE(s.qty, 0) as stock_qty
        FROM items i
        LEFT JOIN item_category ic ON i.item_id = ic.item_id
        LEFT JOIN categories c ON ic.category_id = c.category_id
        LEFT JOIN stocks s ON i.item_id = s.item_id
        ORDER BY i.item_id DESC
    `;

    db.execute(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ msg: 'Error fetching products', error: err.message });
        }
        res.status(200).json(results);
    });
};

// Create a new product with category and stock - Done
exports.createNewProduct = async (req, res) => {
    const { name, description, price, stock, category } = req.body;

    if (!name || !price || !stock || !category) {
        return res.status(400).json({ msg: 'Name, Price, Stock and Category are required.' });
    }

    const mainImage = req.files?.['mainImage']?.[0] || null;
    const galleryImages = req.files?.['galleryImages'] || [];

    const itemImgPath = mainImage ? `storage/items/${mainImage.filename}` : null;

    try {
        // Start transaction
        await db.promise().beginTransaction();

        // 1. Insert the item (without category_id in items table)
        const [result] = await db.promise().query(
            `INSERT INTO items (item_name, item_desc, item_price, item_img) VALUES (?, ?, ?, ?)`,
            [name, description, price, itemImgPath]
        );

        const itemId = result.insertId;

        // 2. Insert stock in stocks table
        await db.promise().query(
            `INSERT INTO stocks (item_id, qty) VALUES (?, ?)`,
            [itemId, stock]
        );

        // 3. Insert category relationship in item_category table
        await db.promise().query(
            `INSERT INTO item_category (item_id, category_id) VALUES (?, ?)`,
            [itemId, category]
        );

        // 3. Insert gallery images if any
        if (galleryImages.length > 0) {
            const galleryData = galleryImages.map(img => [itemId, `storage/items/${img.filename}`]);
            await db.promise().query(`INSERT INTO item_gallery (item_id, item_path) VALUES ?`, [galleryData]);
        }

        // Commit transaction
        await db.promise().commit();

        return res.status(201).json({ msg: 'Product added successfully.' });
    } catch (error) {
        // Rollback transaction on error
        await db.promise().rollback();
        console.error(error);
        return res.status(500).json({ msg: 'Internal server error.' });
    }
};
// Fetch single product with category and stock
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
        c.category_id,
        c.category_name,
        COALESCE(s.qty, 0) as stock_qty
    FROM items i
    LEFT JOIN item_category ic ON i.item_id = ic.item_id
    LEFT JOIN categories c ON ic.category_id = c.category_id
    LEFT JOIN stocks s ON i.item_id = s.item_id
    WHERE i.item_id = ?
`;

db.execute(sql, [id], (err, results) => {
    if (err) {
        console.error('Error fetching product:', err);
        return res.status(500).json({ msg: 'Error fetching product', error: err.message });
    }

    if (results.length === 0) {
        return res.status(404).json({ msg: `Product with ID: ${id} not found.` });
    }

    const product = results[0];

    // Fetch gallery images
    const gallerySql = `SELECT item_path FROM item_gallery WHERE item_id = ?`;

    db.execute(gallerySql, [id], (galleryErr, galleryResults) => {
        if (galleryErr) {
            console.error('Error fetching gallery images:', galleryErr);
            return res.status(500).json({ msg: 'Error fetching gallery images', error: galleryErr.message });
        }

        res.status(200).json({
            msg: `Product No. ${product.item_id} fetched.`,
            product,
            gallery: galleryResults
        });
    });
});

};

// Update product with category and stock
exports.updateProductDetails = async (req, res) => {
    const { name, description, price, stock, category } = req.body;
    const productId = req.params.id;

    if (!name) {
        return res.status(400).json({ msg: 'Name is required.' });
    }

    try {
        // Start transaction
        await db.promise().beginTransaction();

        // First get the existing product to retain values if fields are empty
        const [existingProduct] = await db.promise().query(
            `SELECT i.*, s.qty as current_stock, ic.category_id as current_category_id 
             FROM items i
             LEFT JOIN stocks s ON i.item_id = s.item_id
             LEFT JOIN item_category ic ON i.item_id = ic.item_id
             WHERE i.item_id = ?`,
            [productId]
        );

        if (existingProduct.length === 0) {
            await db.promise().rollback();
            return res.status(404).json({ msg: `Product with ID: ${productId} not found.` });
        }

        const product = existingProduct[0];

        // Handle new main image upload
        const mainImage = req.files?.['mainImage']?.[0] || req.files?.['file']?.[0] || null;
        let imagePath = product.item_img;

        if (mainImage) {
            // Delete old main image if it exists
            if (product.item_img) {
                const oldImagePath = path.join(__dirname, '..', product.item_img);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            imagePath = `storage/items/${mainImage.filename}`;
        }

        // Use existing values if new ones are not provided
        const finalPrice = price || product.item_price;
        const finalDescription = description !== undefined ? description : product.item_desc;
        const finalStock = stock || product.current_stock;
        const finalCategory = category || product.current_category_id;

        // 1. Update the items table (always update as name is required)
        await db.promise().query(
            `UPDATE items SET item_name = ?, item_desc = ?, item_price = ?, item_img = ?, updated_at = NOW() WHERE item_id = ?`,
            [name, finalDescription, finalPrice, imagePath, productId]
        );

        // 2. Update stock only if stock value is provided
        if (stock) {
            await db.promise().query(
                `UPDATE stocks SET qty = ? WHERE item_id = ?`,
                [stock, productId]
            );
        }

        // 3. Update category only if category value is provided
        if (category) {
            await db.promise().query(
                `UPDATE item_category SET category_id = ? WHERE item_id = ?`,
                [category, productId]
            );
        }

        // 4. Handle gallery images if uploaded
        const galleryImages = req.files?.['galleryImages'] || req.files?.['images'] || [];
        if (galleryImages.length > 0) {
            // Get existing gallery images for cleanup
            const [existingGallery] = await db.promise().query(
                `SELECT item_path FROM item_gallery WHERE item_id = ?`,
                [productId]
            );

            // Delete old gallery images from filesystem
            existingGallery.forEach(img => {
                const oldImagePath = path.join(__dirname, '..', img.item_path);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            });

            // Remove old gallery records from database
            await db.promise().query(`DELETE FROM item_gallery WHERE item_id = ?`, [productId]);

            // Insert new gallery images
            const newImages = galleryImages.map(file => [productId, `storage/items/${file.filename}`]);
            await db.promise().query(`INSERT INTO item_gallery (item_id, item_path) VALUES ?`, [newImages]);
        }

        // Commit transaction
        await db.promise().commit();

        res.status(200).json({ 
            msg: 'Product updated successfully.',
            id: productId,
            image: imagePath,
            updatedFields: {
                name: name,
                price: finalPrice,
                description: finalDescription,
                stock: finalStock,
                category: finalCategory
            }
        });

    } catch (error) {
        // Rollback transaction on error
        await db.promise().rollback();
        console.error('Error updating product:', error);
        res.status(500).json({ msg: 'Server error. Failed to update product.' });
    }
};

// Delete product and related records
exports.deleteProduct = async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        // Start transaction
        await new Promise((resolve, reject) => {
            db.beginTransaction(err => err ? reject(err) : resolve());
        });

        // Get the existing product
        const [existingProduct] = await new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM items WHERE item_id = ?';
            db.execute(sql, [id], (err, results) => {
                if (err) return reject(err);
                if (results.length === 0) return reject(new Error('Product not found'));
                resolve(results);
            });
        });

        // Delete the image file if it exists
        if (existingProduct.item_img) {
            const imagePath = path.join(__dirname, '..', existingProduct.item_img);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // 1. Delete from item_category
        await new Promise((resolve, reject) => {
            const sql = `DELETE FROM item_category WHERE item_id = ?`;
            db.execute(sql, [id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // 2. Delete from stocks
        await new Promise((resolve, reject) => {
            const sql = `DELETE FROM stocks WHERE item_id = ?`;
            db.execute(sql, [id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // 3. Delete from items
        await new Promise((resolve, reject) => {
            const sql = `DELETE FROM items WHERE item_id = ?`;
            db.execute(sql, [id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Commit transaction
        await new Promise((resolve, reject) => {
            db.commit(err => err ? reject(err) : resolve());
        });

        return res.json({ msg: 'Product successfully deleted.' });

    } catch (err) {
        // Rollback transaction on error
        await new Promise(resolve => db.rollback(() => resolve()));
        console.error('Error deleting product:', err);
        if (err.message === 'Product not found') {
            return res.status(404).json({ msg: `Product with ID: ${id} not found.` });
        }
        return res.status(500).json({ msg: 'Error deleting product', error: err.message });
    }
};