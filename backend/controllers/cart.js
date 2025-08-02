const db = require('../config/database');

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        console.log('req.user:', req.user);
        const { item_id, quantity } = req.body;

        if (!item_id || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: item_id and quantity are required.'
            });
        }

        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User not authenticated.'
            });
        }

        // Check if item already exists in cart
        const [existingItem] = await db.query(
            'SELECT * FROM cart WHERE user_id = ? AND item_id = ?',
            [user_id, item_id]
        );

        if (existingItem.length > 0) {
            // Update quantity if item exists
            await db.query(
                'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?',
                [quantity, user_id, item_id]
            );
        } else {
            // Add new item to cart
            await db.query(
                'INSERT INTO cart (user_id, item_id, quantity) VALUES (?, ?, ?)',
                [user_id, item_id, quantity]
            );
        }

        // Get updated cart count
        const [cartCount] = await db.query(
            'SELECT SUM(quantity) as count FROM cart WHERE user_id = ?',
            [user_id]
        );

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cartCount: cartCount[0].count || 0
        });

    } catch (error) {
        console.error('❌ Add to cart error:', {
            message: error.message,
            stack: error.stack,
            code: error.code || 'N/A'
        });

        let statusCode = 500;
        let errorMessage = 'Something went wrong while adding the item to the cart.';

        if (error.code === 'ER_DUP_ENTRY') {
            statusCode = 409;
            errorMessage = 'This item is already in the cart.';
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: error.message
        });
    }
};

// Get cart items
exports.getCart = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [cartItems] = await db.query(
            `SELECT c.cart_id, c.quantity, 
                    p.item_id, p.item_name, p.item_price, p.item_img,
                    p.stock_qty,
                    (p.item_price * c.quantity) as subtotal
             FROM cart c
             JOIN products p ON c.item_id = p.item_id
             WHERE c.user_id = ?`,
            [user_id]
        );

        const [total] = await db.query(
            `SELECT SUM(p.item_price * c.quantity) as total
             FROM cart c
             JOIN products p ON c.item_id = p.item_id
             WHERE c.user_id = ?`,
            [user_id]
        );

        res.status(200).json({
            success: true,
            cartItems,
            total: total[0].total || 0
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart items',
            error: error.message
        });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const { cart_id, quantity } = req.body;
        const user_id = req.user.id;

        // Verify cart item belongs to user
        const [cartItem] = await db.query(
            'SELECT * FROM cart WHERE cart_id = ? AND user_id = ?',
            [cart_id, user_id]
        );

        if (cartItem.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Check if quantity is valid
        if (quantity <= 0) {
            // If quantity is 0 or negative, remove item from cart
            await db.query(
                'DELETE FROM cart WHERE cart_id = ?',
                [cart_id]
            );
        } else {
            // Update quantity
            await db.query(
                'UPDATE cart SET quantity = ? WHERE cart_id = ?',
                [quantity, cart_id]
            );
        }

        res.status(200).json({
            success: true,
            message: quantity <= 0 ? 'Item removed from cart' : 'Cart updated successfully'
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart',
            error: error.message
        });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const user_id = req.user.id;

        // Verify cart item belongs to user
        const [cartItem] = await db.query(
            'SELECT * FROM cart WHERE cart_id = ? AND user_id = ?',
            [cart_id, user_id]
        );

        if (cartItem.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        // Remove item from cart
        await db.query(
            'DELETE FROM cart WHERE cart_id = ?',
            [cart_id]
        );

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart',
            error: error.message
        });
    }
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
exports.getCartCount = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [result] = await db.query(
            'SELECT SUM(quantity) as count FROM cart WHERE user_id = ?',
            [user_id]
        );

        res.status(200).json({
            success: true,
            count: result[0].count || 0
        });
    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cart count',
            error: error.message
        });
    }
};

// Checkout cart and create order
exports.cartCheckout = (req, res) => {
    const user_id = req.user.id;

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Connection error:', err);
            return res.status(500).json({ success: false, message: 'Database connection failed' });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return res.status(500).json({ success: false, message: 'Failed to start transaction' });
            }

            // Step 1: Get cart items with current prices
            const getCartQuery = `
                SELECT c.item_id, c.quantity, p.item_price
                FROM cart c
                JOIN products p ON c.item_id = p.item_id
                WHERE c.user_id = ?
            `;

            connection.query(getCartQuery, [user_id], (err, cartItems) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        return res.status(500).json({ success: false, message: 'Failed to retrieve cart items' });
                    });
                }

                if (cartItems.length === 0) {
                    return connection.rollback(() => {
                        connection.release();
                        return res.status(400).json({ success: false, message: 'Cart is empty' });
                    });
                }

                // Step 2: Insert into order table
                const orderInsertQuery = `
                    INSERT INTO \`order\` (user_id, order_status, order_placed)
                    VALUES (?, 'PLACED', NOW())
                `;

                connection.query(orderInsertQuery, [user_id], (err, orderResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            return res.status(500).json({ success: false, message: 'Failed to create order' });
                        });
                    }

                    const orderId = orderResult.insertId;

                    // Step 3: Insert into orderline
                    const orderlineValues = cartItems.map(item => [
                        orderId,
                        item.item_id,
                        item.quantity,
                        item.item_price
                    ]);

                    const orderlineInsertQuery = `
                        INSERT INTO orderline (order_id, item_id, qty, order_price)
                        VALUES ?
                    `;

                    connection.query(orderlineInsertQuery, [orderlineValues], (err) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                return res.status(500).json({ success: false, message: 'Failed to insert order items' });
                            });
                        }

                        // Step 4: Clear user's cart
                        const clearCartQuery = `DELETE FROM cart WHERE user_id = ?`;

                        connection.query(clearCartQuery, [user_id], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    return res.status(500).json({ success: false, message: 'Failed to clear cart' });
                                });
                            }

                            // Step 5: Commit transaction
                            connection.commit(err => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        return res.status(500).json({ success: false, message: 'Failed to commit transaction' });
                                    });
                                }

                                connection.release();
                                return res.status(200).json({
                                    success: true,
                                    message: 'Checkout successful',
                                    order_id: orderId
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};


