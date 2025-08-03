
const db = require('../config/database');

// Add item to cart
exports.addToCart = (req, res) => {
    const user_id = req.user?.id;
    const { item_id, quantity } = req.body;

    if (!item_id || !quantity) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: item_id and quantity are required.'
        });
    }

    const checkQuery = 'SELECT * FROM cart WHERE user_id = ? AND item_id = ?';
    db.query(checkQuery, [user_id, item_id], (err, results) => {
        if (err) {
            console.error('❌ Check cart error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to check cart',
                error: err.message
            });
        }

        if (results.length > 0) {
            // Item exists, update quantity
            const updateQuery = 'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?';
            db.query(updateQuery, [quantity, user_id, item_id], (err2) => {
                if (err2) {
                    console.error('❌ Update cart error:', err2);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update cart',
                        error: err2.message
                    });
                }
                return sendCartCount(res, user_id);
            });
        } else {
            // Item not in cart, insert new
            const insertQuery = 'INSERT INTO cart (user_id, item_id, quantity) VALUES (?, ?, ?)';
            db.query(insertQuery, [user_id, item_id, quantity], (err3) => {
                if (err3) {
                    console.error('❌ Insert cart error:', err3);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to add item to cart',
                        error: err3.message
                    });
                }
                return sendCartCount(res, user_id);
            });
        }
    });
};

// Helper function to send updated cart count
function sendCartCount(res, user_id) {
    const countQuery = 'SELECT SUM(quantity) as count FROM cart WHERE user_id = ?';
    db.query(countQuery, [user_id], (err, result) => {
        if (err) {
            console.error('❌ Cart count error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve cart count',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cartCount: result[0].count || 0
        });
    });
}

// Get cart items
exports.getCart = (req, res) => {
    const user_id = req.user.id;

    const cartQuery = `
        SELECT c.cart_id, c.quantity, 
               i.item_id, i.item_name, i.item_price, i.item_img,
               s.qty AS stock_qty,
               (i.item_price * c.quantity) as subtotal
        FROM cart c
        JOIN items i ON c.item_id = i.item_id
        LEFT JOIN stocks s ON i.item_id = s.item_id
        WHERE c.user_id = ?
    `;

    const totalQuery = `
        SELECT SUM(i.item_price * c.quantity) as total
        FROM cart c
        JOIN items i ON c.item_id = i.item_id
        WHERE c.user_id = ?
    `;

    db.query(cartQuery, [user_id], (err, cartItems) => {
        if (err) {
            console.error('❌ Error fetching cart items:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch cart items',
                error: err.message
            });
        }

        db.query(totalQuery, [user_id], (err2, totalResult) => {
            if (err2) {
                console.error('❌ Error calculating total:', err2);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to calculate total',
                    error: err2.message
                });
            }

            res.status(200).json({
                success: true,
                cartItems,
                total: totalResult[0].total || 0
            });
        });
    });
};

// Update cart item quantity
exports.updateCartItem = (req, res) => {
    const { cart_id, quantity } = req.body;
    const user_id = req.user.id;
console.log('Updating cart item:', cart_id, 'for user:', user_id);
    // Verify cart item belongs to user
    db.query('SELECT * FROM cart WHERE cart_id = ? AND user_id = ?', [cart_id, user_id], (err, results) => {
        if (err) {
            console.error('Select cart item error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        if (quantity <= 0) {
            // Delete the item if quantity is 0 or negative
            db.query('DELETE FROM cart WHERE cart_id = ?', [cart_id], (deleteErr) => {
                if (deleteErr) {
                    console.error('Delete cart item error:', deleteErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to remove item from cart',
                        error: deleteErr.message
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Item removed from cart'
                });
            });
        } else {
            // Update the quantity
            db.query('UPDATE cart SET quantity = ? WHERE cart_id = ?', [quantity, cart_id], (updateErr) => {
                if (updateErr) {
                    console.error('Update cart error:', updateErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update cart',
                        error: updateErr.message
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Cart updated successfully'
                });
            });
        }
    });
};


// Remove item from cart
exports.removeFromCart = (req, res) => {
    const { cart_id } = req.params;
    const user_id = req.user.id;
console.log('Removing item from cart:', cart_id, 'for user:', user_id);
    // Verify cart item belongs to user
    db.query(
        'SELECT * FROM cart WHERE cart_id = ? AND user_id = ?',
        [cart_id, user_id],
        (err, results) => {
            if (err) {
                console.error('Database error during cart item lookup:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to verify cart item',
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            // Remove item from cart
            db.query(
                'DELETE FROM cart WHERE cart_id = ?',
                [cart_id],
                (deleteErr, deleteResults) => {
                    if (deleteErr) {
                        console.error('Database error during delete:', deleteErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to remove item from cart',
                            error: deleteErr.message
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Item removed from cart successfully'
                    });
                }
            );
        }
    );
};


// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const user_id = req.user.id;

        await db.query(
            'DELETE FROM cart WHERE user_id = ?',
            [user_id]
        );

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: error.message
        });
    }
};

// Get cart count
exports.getCartCount = (req, res) => {
    const user_id = req.user?.id;

    if (!user_id) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized. User not authenticated.'
        });
    }

    const query = 'SELECT count(user_id) as count FROM cart WHERE user_id = ?';
    db.query(query, [user_id], (err, result) => {
        if (err) {
            console.error('Get cart count error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to get cart count',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: result[0].count || 0
        });
    });
};

exports.cartCheckout = (req, res) => {
    const user_id = req.user?.id;

    if (!user_id) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized. User not authenticated.'
        });
    }

    db.beginTransaction(err => {
        if (err) {
            console.error('❌ Transaction start error:', err);
            return res.status(500).json({ success: false, message: 'Failed to start transaction' });
        }

        const getCartQuery = `
            SELECT c.item_id, c.quantity, i.item_price, s.qty AS stock_qty
            FROM cart c
            JOIN items i ON c.item_id = i.item_id
            LEFT JOIN stocks s ON c.item_id = s.item_id
            WHERE c.user_id = ?
        `;

        db.query(getCartQuery, [user_id], (err, cartItems) => {
            if (err || cartItems.length === 0) {
                return db.rollback(() => {
                    const msg = err ? 'Failed to retrieve cart items' : 'Cart is empty';
                    console.error('❌', msg, err);
                    return res.status(400).json({ success: false, message: msg });
                });
            }

            // Check for stock availability
            const outOfStock = cartItems.find(item => item.stock_qty < item.quantity);
            if (outOfStock) {
                return db.rollback(() => {
                    return res.status(400).json({
                        success: false,
                        message: `Item ID ${outOfStock.item_id} does not have enough stock.`
                    });
                });
            }

            const insertOrderQuery = "INSERT INTO orders (user_id, order_status, order_placed) VALUES (?, 'pending', NOW())";

            db.query(insertOrderQuery, [user_id], (err, orderResult) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('❌ Failed to insert order:', err);
                        return res.status(500).json({ success: false, message: 'Failed to create order' });
                    });
                }

                const orderId = orderResult.insertId;

                const orderlineValues = cartItems.map(item => [
                    orderId,
                    item.item_id,
                    item.quantity,
                    item.item_price
                ]);

                const insertOrderlineQuery = `
                    INSERT INTO orderlines (order_id, item_id, qty, order_price)
                    VALUES ?
                `;

                db.query(insertOrderlineQuery, [orderlineValues], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('❌ Failed to insert orderlines:', err);
                            return res.status(500).json({ success: false, message: 'Failed to insert order items' });
                        });
                    }

                    // Decrement stock quantities
                    const stockUpdateQueries = cartItems.map(item => {
                        return new Promise((resolve, reject) => {
                            const updateStockQuery = `
                                UPDATE stocks SET qty = qty - ? WHERE item_id = ?
                            `;
                            db.query(updateStockQuery, [item.quantity, item.item_id], (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });

                    Promise.all(stockUpdateQueries)
                        .then(() => {
                            const clearCartQuery = `DELETE FROM cart WHERE user_id = ?`;
                            db.query(clearCartQuery, [user_id], (err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('❌ Failed to clear cart:', err);
                                        return res.status(500).json({ success: false, message: 'Failed to clear cart' });
                                    });
                                }

                                db.commit(err => {
                                    if (err) {
                                        return db.rollback(() => {
                                            console.error('❌ Commit error:', err);
                                            return res.status(500).json({ success: false, message: 'Failed to commit transaction' });
                                        });
                                    }

                                    return res.status(200).json({
                                        success: true,
                                        message: 'Checkout successful',
                                        order_id: orderId
                                    });
                                });
                            });
                        })
                        .catch(err => {
                            return db.rollback(() => {
                                console.error('❌ Stock update failed:', err);
                                return res.status(500).json({ success: false, message: 'Failed to update stock' });
                            });
                        });
                });
            });
        });
    });
};





