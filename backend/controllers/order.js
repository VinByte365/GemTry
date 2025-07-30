const { parse } = require('dotenv');
const db = require('../config/database');

exports.fetchAllOrder = (req, res) => {
    const sql = `
        SELECT 
            o.order_id,
            o.order_status,
            o.order_placed,
            u.name as customer_name,
            u.email as customer_email,
            u.contact as customer_contact,
            COALESCE(SUM(ol.order_price * ol.qty), 0) as total_amount,
            COUNT(ol.orderline_id) as item_count
        FROM orders o
        LEFT JOIN user u ON o.user_id = u.user_id
        LEFT JOIN orderlines ol ON o.order_id = ol.order_id
        GROUP BY o.order_id, o.order_status, o.order_placed, u.name, u.email, u.contact
        ORDER BY o.order_placed DESC
    `;

    db.execute(sql, (err, result, fields) => {
        if (err) {
            console.error('Error: ', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json(result);
    });
}

exports.updateOrderStatus = (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'shipped', 'cancelled', 'delivered'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const query = `
        UPDATE orders 
        SET order_status = ? 
        WHERE order_id = ?
    `;

    db.query(query, [status, orderId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order status updated successfully' });
    });
};

exports.fetchOneOrder = (req, res) => {
    const orderId = req.params.id;
    
    // Fetch order details with customer info
    const orderQuery = `
        SELECT 
            o.order_id,
            o.order_status,
            o.order_placed,
            u.name as customer_name,
            u.email as customer_email,
            u.contact as customer_contact,
            u.city as customer_city,
            COALESCE(SUM(ol.order_price * ol.qty), 0) as total_amount
        FROM orders o
        LEFT JOIN user u ON o.user_id = u.user_id
        LEFT JOIN orderlines ol ON o.order_id = ol.order_id
        WHERE o.order_id = ?
        GROUP BY o.order_id, o.order_status, o.order_placed, u.name, u.email, u.contact, u.city
    `;
    
    // Fetch order items
    const itemsQuery = `
        SELECT 
            ol.orderline_id,
            ol.qty,
            ol.order_price,
            i.item_name,
            i.item_img,
            (ol.order_price * ol.qty) as line_total
        FROM orderlines ol
        LEFT JOIN items i ON ol.item_id = i.item_id
        WHERE ol.order_id = ?
    `;
    
    db.query(orderQuery, [orderId], (err, orderResult) => {
        if (err) {
            console.error('Error fetching order:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (orderResult.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const order = orderResult[0];
        
        // Fetch order items
        db.query(itemsQuery, [orderId], (err, itemsResult) => {
            if (err) {
                console.error('Error fetching order items:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            order.items = itemsResult;
            res.status(200).json({ order });
        });
    });
};
